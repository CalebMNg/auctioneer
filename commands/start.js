const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { openDb } = require("../handlers/databaseHandler");
const { MAX_GROUP_SIZE } = require("../constants");

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
          `(optional) maximum # of bidders that can bid together. default is 1.`
        )
        .setMinValue(1).setMaxValue(MAX_GROUP_SIZE)
    ),
  async execute(interaction) {
    const db = await openDb();
    const guildsql = "SELECT * FROM guilds WHERE guildid = ?";
    const guildRow = await db.get(guildsql, [interaction.guild.id]);
    const startingBid = interaction.options.getNumber("startingbid") ?? 0;
    const maxgroupsize =
      interaction.options.getInteger("maxgroupsize") ?? 1;

    const auctionChannel = interaction.channel;
    const auctionsql = "SELECT channelid, active FROM auctions WHERE channelid = ?";
    const auctionRows = await db.all(auctionsql, [auctionChannel.id]);

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

    //check if any in this channel are still active (1 is true)
    if (auctionRows.find((row) => row.active === 1)) {
      await interaction.reply({
        content: "an auction has already been started in this channel.",
        ephemeral: true,
      });
      return;
    }

    //forum channel associated
    const forumChannel = auctionChannel.parent;

    //send success messages
    const message = await auctionChannel.send(`Starting bid: ${startingBid}\n Max group size: ${maxgroupsize}`);
    message.pin();

    // const auctionInputSql =
    //   "INSERT INTO auctions (guildid, auctionid, channelid, messageid, highestbid, amountbids, owner) VALUES (?, ?, ?, ?, ?, 0, TRUE)";
    // await db.run(auctionInputSql, [
    //   interaction.guild.id,
    //   await generate,
    //   auctionChannel.id,
    //   message.id,
    //   startingBid,
    // ]);

    await interaction.reply({ content: "auction started!", ephemeral: true });
  },
};
