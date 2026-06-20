import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from 'cors';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.json());
app.use(cors())


const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
