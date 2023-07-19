const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.logger.info(
      `Logged in as ${client.user.tag} at ${new Date().toLocaleString()}`
    );
  },
};
