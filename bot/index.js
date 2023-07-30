const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { DISCORD_BOT_TOKEN, PORT, LOG_LEVEL, DEBUG } = require("./config.json");
const { createWebSocketServer } = require("./websocket/createWebSocket");
const winston = require("winston");

const executionDate = Date.now();
const executionDateFormatted = new Date(executionDate)
  .toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
  .replace(/\//g, "-")
  .replace(/,/g, "")
  .replace(/:/g, "-");
console.log(executionDateFormatted);

if (!fs.existsSync(path.join(__dirname, "logs"))) {
  fs.mkdirSync(path.join(__dirname, "logs"));
}
if (!fs.existsSync(path.join(__dirname, "logs", "errors"))) {
  fs.mkdirSync(path.join(__dirname, "logs", "errors"));
}
if (!fs.existsSync(path.join(__dirname, "logs", "combined"))) {
  fs.mkdirSync(path.join(__dirname, "logs", "combined"));
}
if (!fs.existsSync(path.join(__dirname, "logs", "exceptions"))) {
  fs.mkdirSync(path.join(__dirname, "logs", "exceptions"));
}
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Have filename based on date and time
    new winston.transports.File({
      filename: path.join(
        __dirname,
        "logs",
        `errors`,
        `${executionDateFormatted} errors.log`
      ),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(
        __dirname,
        "logs",
        `combined`,
        `${executionDateFormatted} combined.log`
      ),
      level: LOG_LEVEL,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(
        __dirname,
        "logs",
        `exceptions`,
        `${executionDateFormatted} exceptions.log`
      ),
      level: "error",
    }),
  ],
});

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});
client.logger = logger;

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));
client.commands = new Collection();

// Get all folders in the commands directory
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

client.cooldowns = new Collection();
// Dictionary: Add the tracked user ID as the key and the websocket as the value
// Note: Actor Web Sockets currently has a dictionary of all user IDs that it broadcasts to.
// Start adding new lists as dictionaries and broadcasting to all of them.
client.actorWebSockets = new Collection();
client.waitingWebSockets = new Collection();

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  logger.info(`Loaded event for ${event.name} from ${filePath}`);
}

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      logger.info(`Loaded command ${command.data.name} from ${filePath}`);
    } else {
      logger.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// BUG Currently, the bot sends these messages even if it's not in voice with the specified user, so long as they share a server.
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (client.actorWebSockets.has(newState.id)) {
    if (oldState.channelId !== newState.channelId) {
      if (newState.channelId) {
        const websockets = client.actorWebSockets.get(newState.id);
        for (const websocket of websockets) {
          websocket.send(
            JSON.stringify({ type: "ACTOR_STATE", data: "CONNECTION" })
          );
        }
      } else {
        const websockets = client.actorWebSockets.get(newState.id);
        for (const websocket of websockets) {
          websocket.send(
            JSON.stringify({ type: "ACTOR_STATE", data: "DISCONNECTION" })
          );
        }
      }
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  const { cooldowns } = client;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const defaultCooldownDuration = 3;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      return interaction.reply({
        content: `Please wait <t:${expiredTimestamp}:R> more second(s) before reusing the \`${command.name}\` command.`,
        ephemeral: true,
      });
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing command ${command.name}: ${error}`);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

createWebSocketServer(PORT, client);

logger.info(`Websocket server created and listening on port ${PORT}.`);

// Log in to Discord with your client's token
client.login(DISCORD_BOT_TOKEN);
