import type { Socket } from "socket.io";
import WebSocket from "ws";

const DEEPGRAM_MODEL = "aura-2-thalia-en";

export class TtsSession {
  private socket: Socket;
  private ws: WebSocket;
  private speakResolve: (() => void) | null = null;
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor(socket: Socket, ws: WebSocket) {
    this.socket = socket;
    this.ws = ws;
  }

  static async create(socket: Socket): Promise<TtsSession> {
    const apiKey = process.env.DEEPGRAM_KEY;
    if (!apiKey) throw new Error("DEEPGRAM_KEY not set");

    const url = `wss://api.deepgram.com/v1/speak?model=${DEEPGRAM_MODEL}&encoding=linear16&sample_rate=24000`;
    console.log("[TTS] Connecting...");

    const ws = new WebSocket(url, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("TTS connection timeout"));
      }, 15000);

      ws.on("open", () => {
        clearTimeout(timeout);
        console.log("[TTS] Connected");
        resolve();
      });

      ws.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const session = new TtsSession(socket, ws);

    ws.on("message", (data: any, isBinary) => {
      if (isBinary) {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        console.log("[TTS] emitting ttsAudio (binary), bytes:", buf.length);
        socket.emit("ttsAudio", new Uint8Array(buf));
      } else {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed?.type === "Flushed") {
            console.log("[TTS] Flushed");
            if (session.flushTimeout) {
              clearTimeout(session.flushTimeout);
              session.flushTimeout = null;
            }
            if (session.speakResolve) {
              session.speakResolve();
              session.speakResolve = null;
            }
          } else if (parsed?.type === "Metadata") {
            console.log("[TTS] Metadata:", parsed.request_id);
          } else if (parsed?.type === "Warning") {
            console.warn("[TTS] Warning:", parsed.description);
          }
        } catch {
          // Not JSON - might be base64 audio string
          const text = data.toString();
          if (text) {
            try {
              const audioBuffer = Buffer.from(text, "base64");
              console.log("[TTS] emitting ttsAudio (base64), bytes:", audioBuffer.length);
              socket.emit("ttsAudio", new Uint8Array(audioBuffer));
            } catch {
              console.warn("[TTS] unparseable message:", text.slice(0, 50));
            }
          }
        }
      }
    });

    ws.on("error", (err) => console.error("[TTS] WS error:", err.message));

    return session;
  }

  async speak(text: string): Promise<void> {
    console.log(`[TTS] speak, readyState: ${this.ws.readyState}`);

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[TTS] socket not open, skipping");
      return;
    }

    this.ws.send(JSON.stringify({ type: "Speak", text }));
    this.ws.send(JSON.stringify({ type: "Flush" }));

    return new Promise((resolve) => {
      this.speakResolve = resolve;
      this.flushTimeout = setTimeout(() => {
        console.warn("[TTS] speak timeout");
        this.speakResolve = null;
        this.flushTimeout = null;
        resolve();
      }, 10000);
    });
  }

  close(): void {
    if (this.flushTimeout) clearTimeout(this.flushTimeout);
    this.ws.close();
  }
}
