const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");
const { DEFAULT_MAX_GROUP_SIZE } = require("../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription(
      "manually starts an auction in this channel. can only can be run in a forum thread"
    )
    .addNumberOption((option) =>
      option
        .setName("startingbid")
        .setDescription(
          "(optional) amount that the first bid must be greater or equal to. default is 0"
        )
        .setMinValue(0)
    )
    .addIntegerOption((option) =>
      option
        .setName("maxgroupsize")
        .setDescription(
          `(optional) maximum # of bidders that can bid together. default is ${DEFAULT_MAX_GROUP_SIZE}. set to 1 for no groups.`
        )
        .setMinValue(1)
    ),
  async execute(interaction) {
    let db = await openDb();
    let guildsql = "SELECT * FROM guilds WHERE guildid = ?";
    let guildRow = await db.get(guildsql, [interaction.guild.id]);
    let startingBid = interaction.options.getNumber("startingbid") ?? 0;
    let maxgroupsize =
      interaction.options.getInteger("maxgroupsize") ?? DEFAULT_MAX_GROUP_SIZE;

    let auctionChannel = interaction.channel;
    let auctionsql = "SELECT channelid FROM auctions WHERE channelid = ?";
    let auctionRow = await db.get(auctionsql, [auctionChannel.id]);

    /// deal with weird server/guild errors
    //server not even found in servers!
    if (!guildRow) {
      await interaction.reply({
        content:
          "something went wrong! please try to kick and re-add the bot to fix.",
        ephemeral: true,
      });
      return;
    }

    //no forum id found
    if (guildRow.forumid === null) {
      await interaction.reply({
        content:
          "the auction forum channel has not been specified. use command setchannel to do so",
        ephemeral: true,
      });
      return;
    }

    ///now deal with channel errors
    //make sure channel is a thread
    if (auctionChannel.type != ChannelType.PublicThread) {
      await interaction.reply({
        content: "this channel is not a thread.",
        ephemeral: true,
      });
      return;
    }

    //make sure the channels parent is the designated one
    if (auctionChannel.parentId != guildRow.forumid) {
      await interaction.reply({
        content:
          "you are trying to start an auction in a forum that hasn't been designated for auctions.",
        ephemeral: true,
      });
      return;
    }

    if (auctionRow) {
      await interaction.reply({
        content: "an auction has already been started in this channel.",
        ephemeral: true,
      });
      return;
    }

    //forum channel associated
    let forumChannel = auctionChannel.parent;

    //send success messages

    let message = await auctionChannel.send(`Starting bid: ${startingBid}\n Max group size: ${maxgroupsize}`);
    message.pin();

    let auctionInputSql =
      "INSERT INTO auctions (guildid, auctionid, channelid, messageid, highestbid, amountbids) VALUES (?, ?, ?, ?, ?, 0)";
    await db.run(auctionInputSql, [
      interaction.guild.id,
      await this.generateNewAuctionId(db),
      auctionChannel.id,
      message.id,
      startingBid,
    ]);

    await interaction.reply({ content: "auction started!", ephemeral: true });
  },
  async generateNewAuctionId(db) {
    let sql = "SELECT MAX(auctionid) AS oldid FROM auctions";
    let row = await db.get(sql, []);
    let newid = 0;
    if (row.oldid) {
      newid = row.oldid + 1;
    }
    return newid;
  },
};
