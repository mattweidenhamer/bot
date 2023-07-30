const WebSocket = require("ws");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { CERT_FILE, KEY_FILE, DEBUG } = require("../config.json");

const createWebSocketServer = (port, discordClient) => {
  // Normal unseured version
  //const server = http.createServer();
  // Encrypted wss version
  const logger = discordClient.logger;
  let server = null;
  if (DEBUG) {
    server = http.createServer();
  } else {
    server = https.createServer({
      cert: fs.readFileSync(CERT_FILE),
      key: fs.readFileSync(KEY_FILE),
    });
  }
  const ws = new WebSocket.WebSocketServer({ server });

  ws.on("error", console.error);
  ws.on("connection", function connection(socket) {
    // TODO - Add error handling
    // TODO - If actor is not configured after 5 seconds, close connection
    // TODO - Close connection if no messages have been sent in the last hour.
    logger.info("New connection to websocket.");
    socket.on("message", (data) => {
      logger.debug("Received message from websocket.");
      const parsedData = JSON.parse(data);
      if (parsedData.type === "ACTOR" && ws.actorId === undefined) {
        logger.debug("Actor specifier received.");
        const actorId = parsedData.actorId;
        socket.actorId = actorId;
        if (discordClient.actorWebSockets.has(actorId)) {
          logger.debug(`Adding  websockets`);
          discordClient.actorWebSockets.get(actorId).add(socket);
        } else {
          logger.debug(
            `Actor ${actorId} does not have a collection in websockets, and one will be created.`
          );
          discordClient.actorWebSockets.set(actorId, new Set());
          discordClient.actorWebSockets.get(actorId).add(socket);
        }
        logger.info(`Websocket for ID ${actorId} set.`);
      } else {
        logger.warn(
          `Received unusual or unprompted data from websocket: ${data}`
        );
        logger.warn(`Websocket will be closed as a precaution.`);
        socket.close();
      }
    });
    socket.on("close", function close() {
      logger.debug("Closing and cleaning up websocket.");
      if (!socket.actorId) {
        logger.info(`A websocket was closed before actorId was configured.`);
        return;
      }
      if (discordClient.actorWebSockets.get(socket.actorId).delete(socket)) {
        logger.debug(`Websocket for actor ${socket.actorId} deleted.`);
        if (discordClient.actorWebSockets.get(socket.actorId).size === 0) {
          logger.debug(
            `Websocket set for actor ${socket.actorId} is empty. Deleting set.`
          );
          discordClient.actorWebSockets.delete(socket.actorId);
        }
      } else {
        logger.warn(
          `Websocket not found for deletion in the set of websockets for ${socket.actorId}.`
        );
      }
    });
    socket.on("error", logger.error);
    socket.on("ping", logger.debug);
    socket.on("upgrade", logger.debug);
  });
  server.listen(port);
  logger.info(`Websocket server listening on port ${port}.`);

  // ws.on("message", function receiveMessage(data) {
  //   console.log("Received message from websocket.");
  //   const parsedData = JSON.parse(data);
  //   console.log(parsedData);
  //   if (parsedData.type === "ACTOR") {
  //     console.log("Actor message received.");
  //     const actorId = parsedData.actorId;
  //     if (discordClient.actorWebSockets.has(actorId)) {
  //       console.log("Actor already has a websocket. Closing old socket.");
  //       const oldWs = discordClient.actorWebSockets.get(actorId);
  //       oldWs.send("CLOSE");
  //       oldWs.close();
  //     }
  //     discordClient.actorWebSockets.set(actorId, ws);
  //     discordClient.waitingWebSockets.delete(ws);
  //     console.log("Actor websocket set.");
  //   }
  // });

  return ws;
};

module.exports = { createWebSocketServer };
