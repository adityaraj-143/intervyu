// Bun auto-loads .env
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { Server } from "socket.io";
import { PORT } from "./config";
import { createSpeechClient } from "./services/speech.service";
import { registerSocketHandlers } from "./handlers/socket.handler";
import { handleInterviewStart } from "./controllers/interview.controller";
import authRoutes from './routes/auth.routes';
import interviewRoutes from './routes/interview.routes';
import { authenticateJWT } from "./middlewares/auth.middleware";

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(cookieParser());
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
  authenticateJWT,
  upload.fields([
    { name: "jobDescriptionPdf", maxCount: 1 },
    { name: "resumePdf", maxCount: 1 }
  ]),
  handleInterviewStart
);

app.use('/api/v1/auth/', authRoutes)
app.use('/api/v1/interview', interviewRoutes)

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
