const WebSocket = require("ws");
const fs = require("fs");
const https = require("https");
const http = require("http");

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
  const options = {
    key: fs.readFileSync("private-key.pem"),
    cert: fs.readFileSync("public-cert.pem"),
  };
  const server = https.createServer(options);
  const ws = new WebSocket.WebSocketServer({ server });

  ws.on("error", console.error);
  ws.on("connection", function connection(socket) {
    console.log("New connection to websocket.");
    socket.on("message", (data) => {
      console.log("Received message from websocket.");
      const parsedData = JSON.parse(data);
      if (parsedData.type === "ACTOR") {
        console.log("Actor specifier received.");
        const actorId = parsedData.actorId;
        if (discordClient.actorWebSockets.has(actorId)) {
          console.log("Actor already has a websocket. Closing old socket.");
          const oldWs = discordClient.actorWebSockets.get(actorId);
          oldWs.send("CLOSE");
          oldWs.close();
        }
        discordClient.actorWebSockets.set(actorId, socket);
        console.log("Actor websocket set.");
      }
    });
    socket.on("close", function close() {
      console.log("Closing and cleaning up websocket.");
      const actorId = discordClient.actorWebSockets.findKey((websocket) => {
        return websocket === socket;
      });
      if (actorId) {
        discordClient.actorWebSockets.delete(actorId);
      } else {
        console.warn("Couldn't find actorId for websocket.");
      }
    });
  });
  server.listen(port);

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
