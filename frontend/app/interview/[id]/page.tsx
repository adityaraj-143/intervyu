"use client";

import { BACKEND_URL } from "@/config";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  useEffect(() => {
    const socket = io(BACKEND_URL);

    let mediaRecorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      stream = s;

      mediaRecorder = new MediaRecorder(s, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          socket.emit("audioChunk", buffer);
        }
      };

      mediaRecorder.start(250);
    });

    socket.on("transcription", (data) => {
      console.log(data);
    });

    return () => {
      mediaRecorder?.stop();

      stream?.getTracks().forEach((track) => track.stop());

      socket.emit("stopRecording");
      socket.disconnect();
    };
  }, []);

  return <div style={{ padding: "1rem", fontFamily: "monospace" }}></div>;
}
