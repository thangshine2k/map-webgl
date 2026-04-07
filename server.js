const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = 3000;
const WS_PORT = 8080;

let vehicles = [];

// init 10k xe
for (let i = 0; i < 10000; i++) {
  vehicles.push({
    id: i,
    lat: 21.02 + Math.random() * 0.1,
    lng: 105.84 + Math.random() * 0.1,
  });
}

// REST
app.get("/vehicles", (req, res) => {
  res.json(vehicles);
});

app.listen(PORT, () => {
  console.log("API running http://localhost:3000");
});

// WS
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on("connection", (ws) => {
  setInterval(() => {
    const updates = [];

    for (let i = 0; i < 200; i++) {
      const v = vehicles[Math.floor(Math.random() * vehicles.length)];

      v.lat += (Math.random() - 0.5) * 0.001;
      v.lng += (Math.random() - 0.5) * 0.001;

      updates.push(v);
    }

    ws.send(JSON.stringify(updates));
  }, 1000);
});
