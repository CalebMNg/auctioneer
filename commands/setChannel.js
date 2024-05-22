const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("tells the bot the forum channel for auctions")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("the forum channel used for auctions")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildForum)
    ),
  async execute(interaction) {
    const forum = interaction.options.getChannel("channel");
    let db = await openDb();
    let sql = "SELECT guildid FROM guilds WHERE guildid = ?";
    let row = await db.get(sql, [interaction.guild.id]);
    if (!row) {
      let sql = "INSERT INTO guilds (guildid, forumid) VALUES (?, ?)";
      (await db).run(sql, [interaction.guild.id, forum.id]);
    }
    else {
      let sql = "UPDATE guilds SET forumid = ? WHERE guildid = ?";
      (await db).run(sql, [forum.id, interaction.guild.id]);
    }

    await interaction.reply({content: "channel set.", ephemeral: true});
  },
};
