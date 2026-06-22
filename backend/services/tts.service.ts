import type { Socket } from "socket.io";

export async function synthesizeSpeech(text: string, socket: Socket): Promise<void> {
  // Placeholder: will call TTS provider, get audio chunks, and emit them
  // For now, emit text so frontend can display while TTS is being integrated
  socket.emit("ttsAudio", { text, isFinal: false });
}
