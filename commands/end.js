const { SlashCommandBuilder } = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("end")
    .setDescription("ends the current auction"),
  async execute(interaction) {
    let db = await openDb();
    let getsql =
      "SELECT highestbid, amountbids, auctionid FROM auctions WHERE guildid = ? AND channelid = ? AND active = TRUE";
    let row = db.get(getsql, [interaction.guild.id, interaction.channel.id]);

    let deactivatesql =
      "UPDATE auctions SET active = FALSE WHERE auctionid = ?";
    db.run(deactivatesql, [row.auctionid]);
    await interaction.reply({ content: "auction over" });
  },
};
