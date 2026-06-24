import { SpeechClient } from "@google-cloud/speech";

export function createSpeechClient(): SpeechClient {
  return new SpeechClient({ keyFilename: "./gc-auth.json" });
}
