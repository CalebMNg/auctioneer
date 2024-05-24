const {
  Events,
} = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");
const { MAX_WINNERS_SIZE } = require("../constants");
const { startAuction } = require("../handlers/startAuctionHandler");

module.exports = {
  name: Events.ThreadCreate,
  async execute(thread) {
    const db = await openDb();
    const sql = "SELECT forumid FROM guilds WHERE guildid = ?";
    const row = await db.get(sql, [thread.guildId]);
    if (!row || row.forumid != thread.parentId) return;
    //do the start function
    setTimeout(await startAuction, 0.1, thread);
  },
};
