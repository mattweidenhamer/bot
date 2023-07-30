const {
  SlashCommandBuilder,
  channelMention,
  PermissionsBitField,
} = require("discord.js");
const {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins the voice channel"),
  async execute(interaction) {
    const logger = interaction.client.logger;
    //If this was called from DMs, return and send a message
    if (!interaction.guild) {
      logger.debug("Refused join command from DMs.");
      return interaction.reply(":x:: You can't use this command in DMs!");
    }
    if (
      !interaction.member.roles.cache.some(
        (role) => role.name === "Puppeteer"
      ) &&
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      logger.debug("Refused join command from non-admin.");
      return interaction.reply(
        ":x:: You need to have the Puppeteer role or be an administrator to use this command!"
      );
    }

    // If the user is not in a voice channel, return and send a message
    if (!interaction.member.voice.channel) {
      logger.debug("Refused join command from user not in voice channel.");
      return interaction.reply(":x:: You need to join a voice channel first!");
    }

    // If the bot is already in a voice channel in the same guild, return and send a message
    if (interaction.guild.members.me.voice.channel) {
      logger.debug("Refused join command because bot was already in VC.");
      return interaction.reply(
        ":x:: I'm already in a voice channel! /nIf you want me to leave, type /leave first."
      );
    }
    // If the bot is not in a voice channel in the same guild, join it and add an event listener to the bot.

    channel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true,
    })
      .on("debug", logger.debug)
      .on("error", logger.error);
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 2_000);
      interaction.reply(
        `:white_check_mark: Joining ${channelMention(
          interaction.member.voice.channelId
        )}`
      );
    } catch (exception) {
      // If the exception is an abort error, it means the connection failed.
      // No need to log.
      if (exception.code === "ABORT_ERR") {
        logger.error(
          `Failed to join voice channel ${interaction.member.voice.channel.name} in guild ${interaction.guild.name} due to abortion`
        );
        return interaction.reply(
          ":x: There was an error joining that voice channel! I may not have permission to join it, for example!"
        );
      } else {
        console.error(exception);
        return interaction.reply(":x: Major error: " + exception.code);
      }
    }

    connection.on(VoiceConnectionStatus.Ready, () => {
      logger.info(
        `Successfully loaded voice state in channel ${interaction.member.voice.channel.name}`
      );
    });
    // TODO generate new IDs for each connection
    connection.receiver.speaking.on("end", (userId) => {
      logger.debug("Received speaking end event. user ID is ${userId}");
      if (interaction.client.actorWebSockets.has(userId)) {
        const websockets = interaction.client.actorWebSockets.get(userId);
        websockets.forEach((websocket) => {
          websocket.send(
            JSON.stringify({ type: "ACTOR_STATE", data: "NOT_SPEAKING" })
          );
        });
      }
    });
    connection.receiver.speaking.on("start", (userId) => {
      logger.debug(`Received speaking start event. user ID is ${userId}`);
      if (interaction.client.actorWebSockets.has(userId)) {
        const websockets = interaction.client.actorWebSockets.get(userId);
        websockets.forEach((websocket) => {
          websocket.send(
            JSON.stringify({ type: "ACTOR_STATE", data: "START_SPEAKING" })
          );
        });
      }
    });
    connection.on(
      VoiceConnectionStatus.Disconnected,
      async (oldState, newState) => {
        logger.error(
          `Unexpectedly disconnected from voice call, beginning reconect race...`
        );
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          connection.destroy();
          // TODO this may leave some unknown websockets in the collection.

          logger.error(
            `Failed to reconnect to voice channel after 5 seconds, destroying connection.`
          );
        }
      }
    );
    logger.info(
      `Joined voice channel ${channel.name} in guild ${channel.guild.name}`
    );
  },
};
