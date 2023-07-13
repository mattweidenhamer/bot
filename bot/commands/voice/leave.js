const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leaves the voice channel"),
  async execute(interaction) {
    //If this was called from DMS, return and send a message
    if (!interaction.guild)
      return interaction.reply(
        ":x:: You can't use this command in DMs! Unless... do you not love me anymore? :pleading_face:"
      );
    if (
      !interaction.member.roles.cache.some(
        (role) => role.name === "Puppeteer"
      ) &&
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return interaction.reply(
        ":x:: You need to have the Puppeteer role or be an administrator to use this command!"
      );

    // If the bot is not in a voice channel in the same guild, return and send a message
    if (!interaction.guild.members.me.voice.channel)
      return interaction.reply(
        ":x:: I'm not in a voice channel! /nIf you want me to join, type /join first."
      );
    // If the bot is in a voice channel in the same guild, leave it
    if (interaction.guild.members.me.voice.channel) {
      console.log("Leaving voice channel...");
      const connection = getVoiceConnection(interaction.guild.id);
      connection.destroy();
      console.log("Left voice channel.");
      return interaction.reply(
        // TODO vanity: add a random message from an array
        ":white_check_mark: I'm gone! See you again soon!"
      );
    }
  },
};
