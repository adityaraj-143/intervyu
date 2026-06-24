import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { PORT } from "./config";
import { createSpeechClient } from "./services/speech.service";
import { registerSocketHandlers } from "./handlers/socket.handler";
import { handleInterviewStart } from "./routes/interview.routes";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

const speechClient = createSpeechClient();

io.on("connection", (socket) => {
  console.log("Client connected");
  registerSocketHandlers(socket, speechClient);
});

app.post("/api/v1/interview", handleInterviewStart);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
