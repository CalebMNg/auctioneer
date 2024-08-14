const { ButtonStyle } = require("discord.js");
const { openDb } = require("./databaseHandler");
const { DEFAULT_BID } = require("../constants");
const { generateEmbedArray } = require("./auctionSettingsEmbedHandler");

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

async function moveFunc(buttonInteraction, pageChange) {
  const settingsid = buttonInteraction.message.id;
  //get the currentpage
  const getsql = "SELECT settingspage FROM auctions WHERE settingsid = ?";
  const currentPageRow = await db.get(getsql, [settingsid]);
  let currentPage = currentPageRow.settingspage;
  if (
    (pageChange > 0 && currentPage === embedParameters.length - 1) ||
    (pageChange < 0 && currentPage === 0)
  ) {
    console.log(`WRONG ${buttonInteraction.customId}`);
    return;
  }
  currentPage += pageChange;

  buttonInteraction.update({
    embeds: [embedParameters[currentPage].embed],
    components: embedParameters[currentPage].row,
  });

  //update the page internally
  const changesql = "UPDATE auctions SET settingspage = ? WHERE settingsid = ?";
  await db.run(changesql, [currentPage, settingsid]);
}

//we declare it so we dont regenerate it a bunch of times
const embedParameters = generateEmbedArray();

module.exports = {
  async startAuctionPrep(channel) {
    //send the settings message
    console.log(embedParameters[0].row);
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
    if (buttonInteraction.customId === "right") {
      await moveFunc(buttonInteraction, 1);
    } else if (buttonInteraction.customId === "left") {
      await moveFunc(buttonInteraction, -1);
    }
  },
  async startAution(buttonInteraction) {
    const auctionChannel = buttonInteraction.channel;
    const message = await auctionChannel.send(
      `Starting bid: ${startingBid}\n Max group size: ${maxgroupsize}`
    );
    message.pin();

    const getStartingSql =
      "SELECT startingbid FROM auctions WHERE channelid = ?";
    const startingBid = await db.get(getStartingSql, [auctionChannel.id]);

    const auctionInputSql =
      "INSERT INTO auctions (guildid, auctionid, channelid, messageid, highestbid, amountbids, owner) VALUES (?, ?, ?, ?, ?, 0, TRUE)";
    await db.run(auctionInputSql, [
      buttonInteraction.guild.id,
      await generateNewAuctionId(db),
      auctionChannel.id,
      message.id,
      startingBid,
    ]);
    await buttonInteraction.reply({
      content: "auction started!",
      ephemeral: true,
    });
  },
};
