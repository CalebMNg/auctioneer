const { SlashCommandBuilder } = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("end")
    .setDescription("ends the current auction"),
  async execute(interaction) {
    const db = await openDb();
    const getsql =
      "SELECT highestbid, amountbids, auctionid FROM auctions WHERE guildid = ? AND channelid = ? AND active = TRUE";
    const row = db.get(getsql, [interaction.guild.id, interaction.channel.id]);

    const deactivatesql =
      "UPDATE auctions SET active = FALSE WHERE auctionid = ?";
    db.run(deactivatesql, [row.auctionid]);
    await interaction.reply({ content: "auction over" });
  },
};
