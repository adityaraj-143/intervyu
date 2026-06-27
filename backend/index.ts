// Bun auto-loads .env
import express from "express";
import http from "http";
import cors from "cors";
import multer from "multer";
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

// multer: memory storage, accept a single optional PDF named "jobDescriptionPdf"
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are accepted"));
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");
  registerSocketHandlers(socket, speechClient);
});

app.post(
  "/api/v1/interview",
  upload.single("jobDescriptionPdf"),
  handleInterviewStart
);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
