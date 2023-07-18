const fs = require("node:fs");
const path = require("node:path");
const https = require("https");
const http = require("http");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { DISCORD_BOT_TOKEN } = require("./config.json");
const { createWebSocketServer } = require("./websocket/createWebSocket");
const WebSocket = require("ws");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

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
  console.log(`Loaded event for ${event.name} from ${filePath}`);
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
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
    console.log(`Loaded command ${command.data.name} from ${filePath}`);
  }
}

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (client.actorWebSockets.has(newState.id)) {
    if (oldState.channelId !== newState.channelId) {
      const webSocket = client.actorWebSockets.get(newState.id);
      if (newState.channelId) {
        webSocket.send(
          JSON.stringify({ type: "ACTOR_STATE", data: "CONNECTION" })
        );
      } else {
        webSocket.send(
          JSON.stringify({ type: "ACTOR_STATE", data: "DISCONNECTION" })
        );
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
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

// //Set up websocket
// // const options = {
// //   key: fs.readFileSync("private-key.pem"),
// //   cert: fs.readFileSync("public-cert.pem"),
// // };
// const server = http.createServer();
// const ws = new WebSocket.WebSocketServer();

// ws.on("error", console.error);
// ws.on("connection", function connection(socket) {
//   console.log("New connection to websocket.");
//   socket.on("message", (data) => {
//     console.log("Received message from websocket.");
//     const parsedData = JSON.parse(data);
//     if (parsedData.type === "ACTOR") {
//       console.log("Actor specifier received.");
//       const actorId = parsedData.actorId;
//       if (discordClient.actorWebSockets.has(actorId)) {
//         console.log("Actor already has a websocket. Closing old socket.");
//         const oldWs = discordClient.actorWebSockets.get(actorId);
//         oldWs.send("CLOSE");
//         oldWs.close();
//       }
//       discordClient.actorWebSockets.set(actorId, socket);
//       console.log("Actor websocket set.");
//     }
//   });
//   socket.on("close", function close() {
//     console.log("Closing and cleaning up websocket.");
//     const actorId = discordClient.actorWebSockets.findKey((websocket) => {
//       return websocket === socket;
//     });
//     if (actorId) {
//       discordClient.actorWebSockets.delete(actorId);
//     } else {
//       console.warn("Couldn't find actorId for websocket.");
//     }
//   });
// });
// server.listen("8080", () => {
//   console.log("Websocket server listening on port 8080.");
// });
createWebSocketServer(8080, client);

console.log("Websocket created.");

// Log in to Discord with your client's token
client.login(DISCORD_BOT_TOKEN);
