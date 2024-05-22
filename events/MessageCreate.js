const { Events, MessageType, } = require('discord.js');
const { clientId } = require('../config.json');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
      //delete own pinned messages
      if (message.author.id === clientId && message.type === MessageType.ChannelPinnedMessage) {
        message.delete();
      }
    },
}