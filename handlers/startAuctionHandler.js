const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");
const {
  MAX_WINNERS_SIZE,
  DECIMAL_PLACES,
  DEFAULT_BID,
} = require("../constants");
const { round } = require("../bidIncreaseCalculator");

const arrowColor = ButtonStyle.Primary;
const incDecColor = ButtonStyle.Secondary;

async function generateNewAuctionId(db) {
  const sql = "SELECT MAX(auctionid) AS oldid FROM auctions";
  const row = await db.get(sql, []);
  let newid = 0;
  if (row.oldid) {
    newid = row.oldid + 1;
  }
  return newid;
}

//puts the components in each action row array
function partionActionRows(buttons = Array(), selectMenus = Array()) {

  const actionRows = new Array();
  //note: max actionrows are 5 and the last 1 will be left for movement so we can use a total of 4
  if (selectMenus.length * 5 + buttons.length > 5 * 4) {
    throw console.error("TOO MANY BUTTONS AND MENUS");
  }

  //here we choose to add the buttons, then the select menus
  //buttons
  let i = 0;
  for (; i + 5 < buttons.length; i += 5) {
    actionRows.push(
      new ActionRowBuilder().addComponents(buttons.slice(i, i + 5))
    );
  }
  //add the last buttons at the end of the array to their own action row if they exist
  if (buttons.length % 5 != 0)
    actionRows.push(new ActionRowBuilder().addComponents(buttons.slice(i)));
  //select menus
  for (const menu in selectMenus) {
    actionRows.push(new ActionRowBuilder().addComponents(menu));
  }
  return actionRows;
}
//
// NOTE: these functions do not include arrows⬅ ➡️, or the title. THEY MUST BE PARTIONED FIRST
//
// amount of winners parameter
function generateWinnersInfo() {
  const increaseButton = new ButtonBuilder()
    .setCustomId("winup")
    .setLabel("⬆️ +1")
    .setStyle(incDecColor);
  const decreaseButton = new ButtonBuilder()
    .setCustomId("windown")
    .setLabel("⬇️ -1")
    .setStyle(incDecColor);
  const winnerRow = partionActionRows(
    (buttons = [increaseButton, decreaseButton])
  );
  const embedWinner = new EmbedBuilder().addFields({
    name: "Maximum number of winners",
    value: "1",
  });

  const fullEmbedWinner = { embed: embedWinner, row: winnerRow };
  return fullEmbedWinner;
}
// starting bid parameter
function generateStartingBidInfo() {
  const startChangeButtons = Array();
  //handle floating error, round it
  for (let i = round(0.1 ** DECIMAL_PLACES); i <= 1; i *= 10) {
    startChangeButtons.push(
      new ButtonBuilder()
        .setCustomId(`start${i}`)
        .setLabel(`+ ${i}`)
        .setStyle(ButtonStyle.Secondary)
    );
  }
  startChangeButtons.push(
    new ButtonBuilder()
      .setCustomId("clear")
      .setLabel("clear")
      .setStyle(ButtonStyle.Danger)
  );

  const startRows = partionActionRows(buttons = startChangeButtons);

  const embedStart = new EmbedBuilder().addFields({
    name: "Minimum start bid amount",
    value: "0",
  });

  const fullEmbedStart = { embed: embedStart, row: startRows };
  return fullEmbedStart;
}
// max group bidding size
function generateGroupBiddersInfo() {
  const increaseButton = new ButtonBuilder()
    .setCustomId("groupup")
    .setLabel("⬆️ +1")
    .setStyle(incDecColor);
  const decreaseButton = new ButtonBuilder()
    .setCustomId("groupdown")
    .setLabel("⬇️ -1")
    .setStyle(incDecColor);
  const groupRow = partionActionRows(
    (buttons = [increaseButton, decreaseButton])
  );
  const embedGroup = new EmbedBuilder().addFields({
    name: "Maximum number of users in a group that can bid together",
    value: "1",
  });

  const fullGroupWinner = { embed: embedGroup, row: groupRow };
  return fullGroupWinner;
}

//generate the full array
function generateEmbedArray() {
  const embeds = Array();

    //left and right buttons
    const leftButton = new ButtonBuilder()
    .setCustomId("left")
    .setLabel("⬅️")
    .setStyle(arrowColor);
  const rightButton = new ButtonBuilder()
    .setCustomId("right")
    .setLabel("➡️")
    .setStyle(arrowColor);

  //These must be of type {embed = EmbedBuilder(), row = [ActionRows]}
  const winners = generateWinnersInfo();
  const groupbidders = generateGroupBiddersInfo();
  const startbid = generateStartingBidInfo();

  embeds.push(winners);
  embeds.push(groupbidders);
  embeds.push(startbid);

  for (let i = 0; i < embeds.length; i++) {
    numRows = embeds[i].row.length;
    if (i != 0) embeds[i].row[numRows-1].addComponents(leftButton);
    if (i != embeds.length -1) embeds[i].row[numRows-1].addComponents(rightButton);
    embeds[i].embed.setTitle("Auction parameters").setFooter({
      text: "use ⬅️ and ➡️ to look through all of the options. use /help for more info on what each parameter does.",
    });
  }
  return embeds;
}

//we declare it so we dont regenerate it a bunch of times
const embedParameters = generateEmbedArray();

module.exports = {
  async startAuction(channel) {
    console.log(embedParameters[0].embed)
    const response = await channel.send({
      embeds: [embedParameters[0].embed],
      components: embedParameters[0].row,
    });
    const db = await openDb();

    //add the sql
    insertsql =
      "INSERT INTO auctions (guildid, auctionid, channelid, settingsid, owner, highestbid) VALUES (?, ?, ?, ?, ?, ?)";
    await db.run(insertsql, [
      channel.guildId,
      await generateNewAuctionId(db),
      channel.id,
      response.id,
      channel.ownerId,
      DEFAULT_BID,
    ]);
  },
  async handleAuctionButton(buttonInteraction) {
    const settingsid = buttonInteraction.message.id;

    if (buttonInteraction.customId === "right") {
      //get the currentpage
      const getsql = "SELECT settingspage FROM auctions WHERE settingsid = ?";
      const currentPageRow = await db.get(getsql, [settingsid]);
      let currentPage = currentPageRow.settingspage;
      if (currentPage === embedParameters.length - 1) {
        console.log("INVALID RIGHT");
        return;
      }
      currentPage += 1;

      buttonInteraction.update({
        embeds: [embedParameters[currentPage].embed],
        components: embedParameters[currentPage].row,
      });

      //update the page internally
      const changesql =
        "UPDATE auctions SET settingspage = ? WHERE settingsid = ?";
      await db.run(changesql, [currentPage, settingsid]);
    }

    if (buttonInteraction.customId === "left") {
      //get the currentpage
      const getsql = "SELECT settingspage FROM auctions WHERE settingsid = ?";
      const currentPageRow = await db.get(getsql, [settingsid]);
      let currentPage = currentPageRow.settingspage;
      if (currentPage === 0) {
        console.log("INVALID LEFT");
        return;
      }
      currentPage -= 1;

      buttonInteraction.update({
        embeds: [embedParameters[currentPage].embed],
        components: embedParameters[currentPage].row,
      });

      //update the page internally
      const changesql =
        "UPDATE auctions SET settingspage = ? WHERE settingsid = ?";
      await db.run(changesql, [currentPage, settingsid]);
    }
  },
};
