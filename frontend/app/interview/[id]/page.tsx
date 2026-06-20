'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';


export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {

  useEffect(() => {
    
  }, []);

  return (
    <div style={{ padding: '1rem', fontFamily: 'monospace' }}>
    </div>
  );
}