const { Events } = require("discord.js");

module.exports = {
  name: Events.Error,
  execute(client) {
    client.logger.error("An error event was sent by Discord.js:");
    client.logger.error(error);
  },
};
