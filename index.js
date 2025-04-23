// const app = require("./app");
// const net = require("net");
// const WebSocket = require("ws");
// const IoTData = require("./schema/iot");

// // WebSocket Server
// const wss = new WebSocket.Server({ port: 8080 });
// console.log("WebSocket server listening on ws://localhost:8080");

// wss.on("connection", (ws) => {
//   console.log("New WebSocket client connected");
//   ws.on("close", () => console.log("WebSocket client disconnected"));
// });

// // TCP Server
// const tcpServer = net.createServer((socket) => {
//   console.log("New TCP client connected");

//   socket.on("data", async(data) => {
//     const rawData = data.toString().trim();
//     console.log("Raw data received:", rawData);
//     // Store the string in MongoDB (Keep only last 400)
//     if(rawData.startsWith("$") && rawData.endsWith("*")) {
//     await IoTData.findOneAndUpdate(
//         {},
//         { $push: { data: { $each: [rawData], $slice: -525 } } },
//         { upsert: true, new: true }
//     );

//     console.log("Data stored successfully."); }

//     try {
//       wss.clients.forEach(async(client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify(rawData));
//         }
//       });
//     } catch (error) {
//       console.error("Error processing data:", error.message);
//     }
//   });

//   socket.on("close", () => console.log("TCP client disconnected"));
//   socket.on("error", (err) => console.error("TCP socket error:", err.message));
// });

// tcpServer.listen(3000, () => {
//   console.log("TCP server listening on port 3000");
// });


//final deployed working code

const app = require("./app");
const net = require("net");
const WebSocket = require("ws");
const Battery = require("./schema/Battery");

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });
console.log("WebSocket server listening on ws://localhost:8080");

const clients = new Map(); // { imei: Set<WebSocketClients> }

// Handle WebSocket Connections
wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.event === "subscribe" && data.imei) {
        const imei = data.imei;
        if (!clients.has(imei)) {
          clients.set(imei, new Set());
        }
        clients.get(imei).add(ws); // Store client for IMEI
        console.log(`Client subscribed for IMEI: ${imei}`);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error.message);
    }
  });

  ws.on("close", () => {
    // Remove disconnected clients
    for (let [imei, sockets] of clients.entries()) {
      if (sockets.has(ws)) {
        sockets.delete(ws);
        if (sockets.size === 0) clients.delete(imei); // Remove IMEI if no clients left
      }
    }
    console.log("WebSocket client disconnected");
  });
});

// TCP Server (Incoming IoT Data)
const tcpServer = net.createServer((socket) => {
  console.log("New TCP client connected");

  socket.on("data", async (data) => {
    const rawData = data.toString().trim();
    console.log("Raw data received:", rawData);

    if (rawData.startsWith("$") && rawData.endsWith("*")) {
      try {
        const trimmedMessage = rawData.slice(1, -1); // Remove '$' and '*'
        const parts = trimmedMessage.split(",");

        if (parts.length < 38) {
          console.error("Invalid data format: Missing fields");
          return;
        }

        const header = parts[0];
        if (isNumericHeader(header)) return; // ** Filter Only String-Based Headers (BMS Packets)**

        const imei = parts[1];

        // **🚀 Push New IoT Data to MongoDB**
        await Battery.findOneAndUpdate(
          { imei: imei }, // Find document with matching IMEI
          { $push: { rawData: rawData } }, // Append new IoT data to array
          { upsert: true } // Create if IMEI does not exist
        );

        console.log(`Saved IoT data for IMEI ${imei} in MongoDB`);
        const parsedData = {
          header,
          imei: parts[1],
          addonMode: parseInt(parts[2]),
          date: parts[3],
          time: parts[4],
          latitude: parseFloat(parts[5]),
          latitudeDirection: parts[6],
          longitude: parseFloat(parts[7]),
          longitudeDirection: parts[8],
          capacity: parseInt(parts[9]),
          remainingCapacity: parseInt(parts[10]),
          bmsVoltage: parseFloat(parts[11]),
          bmsCurrent: parseFloat(parts[12]),
          stateOfCharge: parseFloat(parts[13]),
          cycles: parseInt(parts[14]),
          mosState: parseInt(parts[15]),
          reserved1: parseInt(parts[16]),
          reserved2: parseInt(parts[17]),
          protectionState: parts[18],
          tempSensorCount: parseInt(parts[19]),
          temperatureSensors: [
            parseFloat(parts[20]),
            parseFloat(parts[21]),
            parseFloat(parts[22]),
            parseFloat(parts[23]),
          ],
          cellCount: parseInt(parts[24]),
          cellVoltages: parts.slice(25, 45).map(Number),
          checksum: parts[45],
        };

        console.log(`Parsed BMS data for IMEI ${parsedData.imei}:`, parsedData);

        // **🚀 Send only to subscribed WebSocket clients for this IMEI**
        if (clients.has(parsedData.imei)) {
          clients.get(parsedData.imei).forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({ event: "updateStats", data: parsedData })
              );
            }
          });
        }
      } catch (error) {
        console.error("Error processing data:", error.message);
      }
    } else {
      console.error("Invalid data format");
    }
  });

  socket.on("close", () => console.log("TCP client disconnected"));
  socket.on("error", (err) => console.error("TCP socket error:", err.message));
});

tcpServer.listen(3000, () => {
  console.log("TCP server listening on port 3000");
});

function isNumericHeader(header) {
  return !isNaN(header); // Returns true if the header is fully numeric
}
