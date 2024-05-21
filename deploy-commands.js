const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const commandsPath = path.join(__dirname, "commands");
const commandFolder = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const commandName of commandFolder) {
  const filePath = path.join(commandsPath, commandName);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command ${commandName} is missing a required "data" or "execute" property.`
    );
  }
}


// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// delete global commands
//  rest.put(Routes.applicationCommands(clientId), { body: [] })
//  	.then(() => console.log('Successfully deleted all application commands.'))
//  	.catch(console.error);

//deploy
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();