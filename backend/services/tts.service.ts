import type { Socket } from "socket.io";

const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George
const MODEL_ID = "eleven_flash_v2_5";     // low-latency model

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
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream-input?model_id=${MODEL_ID}&output_format=pcm_24000`;
    console.log("[TTS] Connecting to ElevenLabs...");

    const ws = new WebSocket(url, {
      headers: {
        "xi-api-key": apiKey
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("[TTS] Timeout! readyState:", ws.readyState);
        ws.close();
        reject(new Error("TTS connection timeout"));
      }, 15000);

      ws.addEventListener("open", () => {
        clearTimeout(timeout);
        console.log("[TTS] Connected");

        // Send initial config (BOS — Beginning of Stream)
        ws.send(JSON.stringify({
          text: " ",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
          xi_api_key: apiKey,
        }));

        resolve();
      });

      ws.addEventListener("error", (ev: any) => {
        clearTimeout(timeout);
        console.error("[TTS] WS error event fired:", ev.message || ev.error || ev);
        reject(new Error(`TTS WS error: ${ev.message || "Unknown error"}`));
      });
    });

    const session = new TtsSession(socket, ws);

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(typeof event.data === "string" ? event.data : "");

        if (data.audio) {
          // ElevenLabs sends base64-encoded PCM chunks
          const buf = Buffer.from(data.audio, "base64");
          if (buf.length > 0) {
            console.log("[TTS] emitting ttsAudio, bytes:", buf.length);
            socket.emit("ttsAudio", new Uint8Array(buf));
          }
        }

        if (data.isFinal) {
          console.log("[TTS] Generation complete (isFinal)");
          if (session.flushTimeout) {
            clearTimeout(session.flushTimeout);
            session.flushTimeout = null;
          }
          if (session.speakResolve) {
            session.speakResolve();
            session.speakResolve = null;
          }
        }
      } catch {
        // Non-JSON message, ignore
      }
    });

    ws.addEventListener("error", (ev) => {
      console.error("[TTS] WS error:", ev);
    });

    ws.addEventListener("close", () => {
      console.log("[TTS] WS closed");
      // Resolve any pending speak promise so LLM loop doesn't hang
      if (session.speakResolve) {
        session.speakResolve();
        session.speakResolve = null;
      }
    });

    return session;
  }

  async speak(text: string): Promise<void> {
    console.log(`[TTS] speak, readyState: ${this.ws.readyState}`);

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[TTS] socket not open, skipping");
      return;
    }

    // Send text chunk
    this.ws.send(JSON.stringify({
      text: text + " ",
      try_trigger_generation: true,
    }));
  }

  async close(): Promise<void> {
    if (this.flushTimeout) clearTimeout(this.flushTimeout);
    
    if (this.ws.readyState === WebSocket.OPEN) {
      // Send EOS (End of Stream)
      this.ws.send(JSON.stringify({ text: "" }));
      
      // Wait for ElevenLabs to finish generating and send isFinal
      await new Promise<void>((resolve) => {
        this.speakResolve = resolve;
        setTimeout(() => resolve(), 5000); // safety timeout
      });
    }
    this.ws.close();
  }
}
