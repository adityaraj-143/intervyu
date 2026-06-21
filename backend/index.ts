import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import speech from "@google-cloud/speech";
import { PORT } from "./config";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

const speechClient = new speech.SpeechClient({
  keyFilename: "./gc-auth.json",
});

io.on("connection", (socket) => {
  console.log("Client connected");

  const recognizeStream = speechClient
    .streamingRecognize({
      config: {
        encoding: "WEBM_OPUS", // Change based on frontend format
        sampleRateHertz: 48000,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
      },
      interimResults: true,
    })
    .on("error", (err) => {
      console.error("STT Error:", err);
      socket.emit("stt-error", err.message);
    })
    .on("data", (data) => {
      const transcript = data.results?.[0]?.alternatives?.[0]?.transcript ?? "";

      const isFinal = data.results?.[0]?.isFinal ?? false;

      console.log(`[STT] ${transcript} (${isFinal ? "FINAL" : "INTERIM"})`);

      socket.emit("transcription", {
        transcript,
        isFinal,
      });
    });

  socket.on("audioChunk", (chunk: ArrayBuffer) => {
    recognizeStream.write(Buffer.from(chunk));
  });

  socket.on("stopRecording", () => {
    recognizeStream.end();
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    recognizeStream.end();
  });
});


app.post("/api/v1/interview", (req, res) => {
  const { githubUsername } = req.body;

  //TODO: webscrape the user's profile and repos 

  if (!githubUsername) {
    return res.status(400).json({ error: "GitHub username is required" });
  }

  return res.status(200).json({ message: "Interview started", interviewId: 1 });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
