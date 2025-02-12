const net = require('net');
const WebSocket = require('ws');

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server listening on ws://localhost:8080');

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    ws.on('close', () => console.log('WebSocket client disconnected'));
});

// TCP server
const tcpServer = net.createServer((socket) => {
    console.log('New TCP client connected');

    socket.on('data', (data) => {
        const rawData = data.toString().trim();
        console.log('Raw data received:', rawData);

        // Ensure message starts with '$' and ends with '*'
        if (rawData.startsWith('$') && rawData.endsWith('*')) {
            // Remove the start '$' and end '*' characters
            const trimmedMessage = rawData.slice(1, -1); // Remove the first '$' and last '*'

            // Split the string into components
            const [header, vendorId, firmwareVersion, packetType, alertId, packetStatus, imei, vehicleReg] =
                trimmedMessage.split(',');

            // Construct the parsed data
            const parsedData = {
                header,
                vendorId,
                firmwareVersion,
                packetType,
                alertId,
                packetStatus,
                imei,
                vehicleRegistration: vehicleReg,
            };

            console.log(`Parsed data for IMEI ${imei}:`, parsedData);

            // Format the data into an object for [imei] = {parsedData}
            const formattedData = {
                [imei]: parsedData,
            };

            // Forward data to WebSocket clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(formattedData));
                }
            });
        } else {
            console.error('Invalid data format');
        }
    });

    socket.on('close', () => console.log('TCP client disconnected'));
    socket.on('error', (err) => console.error('TCP socket error:', err.message));
});

tcpServer.listen(3000, () => {
    console.log('TCP server listening on port 3000');
});
