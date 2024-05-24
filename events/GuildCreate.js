const { Events, } = require('discord.js');
const { openDb } = require("../handlers/databaseHandler.js");

module.exports = {
    name: Events.GuildCreate,
    async execute(interaction) {
        const db = await openDb();
        const sql = 'SELECT * FROM guilds WHERE guildid = ? ;';
        exists = await db.get(sql, [interaction.id]) != null;
        if (!exists) {
            const sql = 'INSERT INTO guilds (guildid, forumid) VALUES (?, ?);';
            (await db).run(sql, [interaction.id, null])
        }
    },
}