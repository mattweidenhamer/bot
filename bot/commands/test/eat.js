const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eat")
    .setDescription("I eat something."),
  async execute(interaction) {
    let url =
      "https://tenor.com/view/man-running-out-of-restaurant-man-eating-man-eating-and-running-cartoon-eating-cartoon-man-running-gif-24721662";
    interaction.reply(url);
  },
};
