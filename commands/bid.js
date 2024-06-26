const { SlashCommandBuilder } = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");
const { calculateMinIncrease, round } = require("../bidIncreaseCalculator");
const { DECIMAL_PLACES } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bid")
    .setDescription("bids on the current auction")
    .addNumberOption(
      (option) =>
        option
          .setName("bid")
          .setDescription("bid amount")
          .setRequired(true)
          .setMinValue(0) // add option to tag other bidders
    ),
  async execute(interaction) {
    const channel = interaction.channel;
    const db = await openDb();
    const getsql =
      "SELECT auctionid, messageid, highestbid, amountbids FROM auctions WHERE guildid = ? AND channelid = ? AND active = TRUE";
    const row = await db.get(getsql, [interaction.guild.id, channel.id]);

    //not in auction channel
    if (!row) {
      await interaction.reply({
        content: "there is no auction occuring in this channel.",
        ephemeral: true,
      });
      return;
    }

    // could store the minimum bid but its fast anyways
    const newMinimum = calculateMinIncrease(row.amountbids, row.highestbid);
    if (row.amountbids == 0) newMinimum = row.highestbid;

    const bidAttempt = interaction.options.getNumber("bid");
    bidAttempt = round(bidAttempt);


    //too small bid
    if (bidAttempt < newMinimum - Number.EPSILON) {
      await interaction.reply({
        content: `your bid is too small, you must bid at least ${newMinimum}.`,
        ephemeral: true,
      });
      return;
    }

    //TODO: add confirmation if same bidder

    //update the tables
    const deletesql = "DELETE FROM bidders WHERE guildid = ? AND auctionid = ?";
    await db.run(deletesql, [interaction.guild.id, row.auctionid]);

    const addsql =
      "INSERT INTO bidders (guildid, auctionid, bidderid, amount) VALUES (?, ?, ?, ?)";
    await db.run(addsql, [
      interaction.guild.id,
      row.auctionid,
      interaction.user.id,
      bidAttempt,
    ]);

    const updatesql =
      "UPDATE auctions SET highestbid = ?, amountbids = ? WHERE auctionid = ?";
    await db.run(updatesql, [bidAttempt, row.amountbids + 1, row.auctionid]);

    //update the message
    const bidMessage = await channel.messages.fetch(row.messageid);
    bidMessage.edit(
      `Current bid: ${bidAttempt} by ${
        interaction.user
      }\n Next minimum bid: ${calculateMinIncrease(row.amountbids + 1, bidAttempt)}`
    );

    //finish interaction
    await interaction.reply({ content: "bid successful!", ephemeral: true });
  },
};
