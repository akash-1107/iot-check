const net = require("net");
const WebSocket = require("ws");

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

  socket.on("data", (data) => {
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

        const parsedData = {
          header: parts[0],
          vendorId: parts[1],
          firmwareVersion: parts[2],
          packetType: parts[3],
          alertId: parseInt(parts[4]),
          packetStatus: parts[5],
          imei: parts[6],
          vehicleReg: parts[7],
          gpsFix: parseInt(parts[8]),
          date: parts[9],
          time: parts[10],
          latitude: parseFloat(parts[11]),
          latitudeDirection: parts[12],
          longitude: parseFloat(parts[13]),
          longitudeDirection: parts[14],
          speed: parseFloat(parts[15]),
          heading: parseFloat(parts[16]),
          satellites: parseInt(parts[17]),
          altitude: parseFloat(parts[18]),
          pdop: parseFloat(parts[19]),
          hdop: parseFloat(parts[20]),
          operator: parts[21],
          ignitionStatus: parseInt(parts[22]),
          mainPowerStatus: parseInt(parts[23]),
          mainInputVoltage: parseFloat(parts[24]),
          internalBatteryVoltage: parseFloat(parts[25]),
          emergencyStatus: parseInt(parts[26]),
          tamperAlert: parts[27],
          gsmSignalStrength: parseInt(parts[28]),
          mcc: parts[29],
          mnc: parts[30],
          lac: parts[31],
          cellId: parts[32],

          // Neighbouring Cell Towers
          nmr1: { lac: parts[33], cellId: parts[34], signalStrength: parseInt(parts[35]) },
          nmr2: { lac: parts[36], cellId: parts[37], signalStrength: parseInt(parts[38]) },
          nmr3: { lac: parts[39], cellId: parts[40], signalStrength: parseInt(parts[41]) },
          nmr4: { lac: parts[42], cellId: parts[43], signalStrength: parseInt(parts[44]) },

          digitalInputStatus: parts[45],
          digitalOutputStatus: parts[46],
          frameNumber: parseInt(parts[47]),
          checksum: parts[48],
        };

        console.log(`Parsed data for IMEI ${parsedData.imei}:`, parsedData);

        // Forward data to WebSocket clients
        const formattedData = { [parsedData.imei]: parsedData };
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(formattedData));
          }
        });

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
