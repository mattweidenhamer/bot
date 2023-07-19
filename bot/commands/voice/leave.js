const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leaves the voice channel"),
  async execute(interaction) {
    //If this was called from DMS, return and send a message
    const logger = interaction.client.logger;
    if (!interaction.guild) {
      logger.debug("Interaction was not in a guild, returning.");
      return interaction.reply(
        ":x:: You can't use this command in DMs! Unless... do you not love me anymore? :pleading_face:"
      );
    }
    if (
      !interaction.member.roles.cache.some(
        (role) => role.name === "Puppeteer"
      ) &&
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      logger.debug("User was not a Puppeteer or an admin, returning.");
      return interaction.reply(
        ":x:: You need to have the Puppeteer role or be an administrator to use this command!"
      );
    }
    // If the bot is not in a voice channel in the same guild, return and send a message
    if (!interaction.guild.members.me.voice.channel) {
      logger.debug("Bot was not in a voice channel, returning.");

      return interaction.reply(
        ":x:: I'm not in a voice channel! /nIf you want me to join, type /join first."
      );
    }
    // If the bot is in a voice channel in the same guild, leave it
    if (interaction.guild.members.me.voice.channel) {
      logger.debug("Leaving voice channel.");
      const connection = getVoiceConnection(interaction.guild.id);
      // TODO get the discord IDs of all members in the voice channel, and if any are in the connections, send a websocket message of "Gone"
      connection.destroy();

      logger.info(
        `Left voice channel ${interaction.guild.members.me.voice.channel.name} in guild ${interaction.guild.name}.`
      );
      return interaction.reply(
        // TODO vanity: add a random message from an array
        ":white_check_mark: I'm gone! See you again soon!"
      );
    } else {
      console.error("Bot was not in a voice channel but in a weird way.");
      console.log("Bot was not in a voice channel, returning.");
      return interaction.reply(
        ":x:: I'm not in a voice channel, but in a weird way! If you see this, tell Nill!"
      );
    }
  },
};
