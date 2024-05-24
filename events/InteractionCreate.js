const { Events } = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");
const { handleAuctionButton } = require("../handlers/startAuctionHandler");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    //chat command!
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        }
      }
    } //buttons
    else if (interaction.isButton()) {
			//looking for settings button
      if (interaction.channel.isThread()) {
        const db = await openDb();
        const channelsql =
          "SELECT settingsid FROM auctions WHERE guildid = ? AND active = TRUE";
        const allAuctionIds = (
          await db.all(channelsql, [interaction.guildId])
        ).map((row) => row.settingsid);
        if (allAuctionIds.includes(interaction.message.id)) handleAuctionButton(interaction)
      }
    }
  },
};
