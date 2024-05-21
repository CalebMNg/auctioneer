const { Events, } = require('discord.js');
const { openDb } = require("../handlers/databaseHandler.js");

module.exports = {
    name: Events.GuildCreate,
    async execute(interaction) {
        let db = openDb();
        let sql = 'SELECT guildid FROM guilds WHERE guildid = ? ;';
        exists = await db.get(sql, [interaction.id]) != null;
        if (!exists) {
            let sql = 'INSERT INTO guilds (guildid) VALUES (?);';
            (await db).run(sql, [interaction.id])
        }
    },
}