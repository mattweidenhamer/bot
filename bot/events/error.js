const { Events } = require("discord.js");

module.exports = {
  name: Events.Error,
  execute(client) {
    console.error;
  },
};
