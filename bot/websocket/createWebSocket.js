const WebSocket = require("ws");
const fs = require("fs");
const https = require("https");
const http = require("http");
const winston = require("winston");

// const newConnection = (ws, discordClient) => {
//   return () => {
//     console.log("New connection to websocket.");
//     //May be extrenuous
//     discordClient.waitingWebSockets.set(ws, "WAITING");
//     ws.on("message", (data) => {
//       console.log("Received message from websocket.");
//       const parsedData = JSON.parse(data);
//       if (parsedData.type === "ACTOR") {
//         console.log("Actor message received.");
//         const actorId = parsedData.actorId;
//         if (discordClient.actorWebSockets.has(actorId)) {
//           console.log("Actor already has a websocket. Closing old socket.");
//           const oldWs = discordClient.actorWebSockets.get(actorId);
//           oldWs.send("CLOSE");
//           oldWs.close();
//         }
//         discordClient.actorWebSockets.set(actorId, ws);
//         discordClient.waitingWebSockets.delete(ws);
//         console.log("Actor websocket set.");
//       }
//     });
//   };
// };

// const closeConnection = (ws, discordClient) => {
//   return () => {
//     console.log("Closing and cleaning up websocket.");
//     const actorId = discordClient.actorWebSockets.findKey((websocket) => {
//       return websocket === ws;
//     });
//     if (actorId) {
//       discordClient.actorWebSockets.delete(actorId);
//     } else {
//       console.warn("Couldn't find actorId for websocket.");
//     }
//   };
// };

// const receiveMessage = (ws, discordClient) => {
//   return (data) => {
//     console.log("Received message from websocket.");
//     const parsedData = JSON.parse(data);
//     console.log(parsedData);
//     if (parsedData.type === "ACTOR") {
//       console.log("Actor message received.");
//       const actorId = parsedData.actorId;
//       if (discordClient.actorWebSockets.has(actorId)) {
//         console.log("Actor already has a websocket. Closing old socket.");
//         const oldWs = discordClient.actorWebSockets.get(actorId);
//         oldWs.send("CLOSE");
//         oldWs.close();
//       }
//       discordClient.actorWebSockets.set(actorId, ws);
//       discordClient.waitingWebSockets.delete(ws);
//       console.log("Actor websocket set.");
//     }
//   };
// };

const createWebSocketServer = (port, discordClient) => {
  // Normal unseured version
  //const server = http.createServer();
  // Encrypted wss version
  const logger = discordClient.logger;
  const server = https.createServer({
    cert: fs.readFileSync("public-cert.pem"),
    key: fs.readFileSync("private-key.pem"),
  });
  const ws = new WebSocket.WebSocketServer({ server });

  ws.on("error", console.error);
  ws.on("connection", function connection(socket) {
    logger.info("New connection to websocket.");
    socket.on("message", (data) => {
      logger.debug("Received message from websocket.");
      const parsedData = JSON.parse(data);
      if (parsedData.type === "ACTOR") {
        logger.debug("Actor specifier received.");
        const actorId = parsedData.actorId;
        if (discordClient.actorWebSockets.has(actorId)) {
          logger.info("Actor already has a websocket. Closing old socket.");
          const oldWs = discordClient.actorWebSockets.get(actorId);
          oldWs.send("CLOSE");
          oldWs.close();
        }
        discordClient.actorWebSockets.set(actorId, socket);
        logger.info(`Websocket for ID ${actorId} set.`);
      }
    });
    socket.on("close", function close() {
      logger.info("Closing and cleaning up websocket.");
      const actorId = discordClient.actorWebSockets.findKey((websocket) => {
        return websocket === socket;
      });
      if (actorId) {
        discordClient.actorWebSockets.delete(actorId);
        logger.debug(`Websocket Key for ID ${actorId} deleted.`);
      } else {
        logger.warn(`Couldn't find actorId to remove websocket.`);
      }
    });
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
