import { SpeechClient } from "@google-cloud/speech";

let speechClient: SpeechClient;

export function createSpeechClient(): SpeechClient {
  speechClient = new SpeechClient({
    keyFilename: "./gc-auth.json",
  });
  return speechClient;
}

export function getSpeechClient(): SpeechClient {
  if (!speechClient) {
    return createSpeechClient();
  }
  return speechClient;
}
