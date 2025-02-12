const express = require("express");
const WebSocket = require("ws");

const app = express();

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Store connections
const connections = [];

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket connected");

  // Add the connection to the list
  connections.push(ws);

  ws.on("message", (message) => {
    console.log(`Received raw message: ${message}`);

    // Validate and parse the message
    if (message.startsWith("$") && message.endsWith("*")) {
      // Remove start and end characters
      const trimmedMessage = message.slice(1, -1);

      // Split the string into components
      const [
        header,
        vendorId,
        firmwareVersion,
        packetType,
        alertId,
        packetStatus,
        imei,
        vehicleReg,
      ] = trimmedMessage.split(",");

      console.log("Parsed Data:");
      console.log(`Header: ${header}`);
      console.log(`Vendor ID: ${vendorId}`);
      console.log(`Firmware Version: ${firmwareVersion}`);
      console.log(`Packet Type: ${packetType}`);
      console.log(`Alert ID: ${alertId}`);
      console.log(`Packet Status: ${packetStatus}`);
      console.log(`IMEI: ${imei}`);
      console.log(`Vehicle Registration: ${vehicleReg}`);

      // Forward the parsed message to all connected clients
      connections.forEach((clientWs) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              header,
              vendorId,
              firmwareVersion,
              packetType,
              alertId,
              packetStatus,
              imei,
              vehicleReg,
            })
          );
        }
      });
    } else {
      console.error("Invalid message format");
    }
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected");
    // Remove the connection from the list
    const index = connections.indexOf(ws);
    if (index > -1) {
      connections.splice(index, 1);
    }
  });
});

// HTTP server for the home page
app.get("/", (req, res) => {
  res.send(
    "WebSocket server is running. Connect and send data as per the specified format."
  );
});

// Start HTTP server
const server = app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

// Upgrade HTTP to WebSocket
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
