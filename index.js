const app = require("./app");
const net = require("net");
const WebSocket = require("ws");
const IoTData = require("./schema/iot");

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });
console.log("WebSocket server listening on ws://localhost:8080");

wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");
  ws.on("close", () => console.log("WebSocket client disconnected"));
});

// TCP Server
const tcpServer = net.createServer((socket) => {
  console.log("New TCP client connected");

  socket.on("data", async(data) => {
    const rawData = data.toString().trim();
    console.log("Raw data received:", rawData);
    // Store the string in MongoDB (Keep only last 400)
    await IoTData.findOneAndUpdate(
        {},
        { $push: { data: { $each: [rawData], $slice: -400 } } },
        { upsert: true, new: true }
    );

    console.log("Data stored successfully.");

    try {
      wss.clients.forEach(async(client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(rawData));
        }
      });
    } catch (error) {
      console.error("Error processing data:", error.message);
    }
  });

  socket.on("close", () => console.log("TCP client disconnected"));
  socket.on("error", (err) => console.error("TCP socket error:", err.message));
});

tcpServer.listen(3000, () => {
  console.log("TCP server listening on port 3000");
});
