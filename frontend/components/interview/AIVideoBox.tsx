"use client";

import { useEffect, useRef, useCallback } from "react";

interface AIVideoBlobProps {
  isSpeaking: boolean;
  isThinking: boolean;
}

export default function AIVideoBox({ isSpeaking, isThinking }: AIVideoBlobProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, time: number, speaking: boolean) => {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.18;

    ctx.clearRect(0, 0, w, h);

    // Background subtle radial gradient
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    bgGrad.addColorStop(0, "rgba(82, 102, 255, 0.04)");
    bgGrad.addColorStop(0.5, "rgba(82, 102, 255, 0.01)");
    bgGrad.addColorStop(1, "transparent");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const speakScale = speaking ? 1.12 : 1.0;
    const speakSpeed = speaking ? 1.8 : 1.0;

    // Draw multiple layered blobs
    const layers = [
      { radius: baseRadius * 1.6 * speakScale, alpha: 0.03, color: "120, 140, 255", speed: 0.3 * speakSpeed, lobes: 5, amp: 0.15 },
      { radius: baseRadius * 1.3 * speakScale, alpha: 0.06, color: "100, 120, 255", speed: 0.5 * speakSpeed, lobes: 4, amp: 0.12 },
      { radius: baseRadius * 1.05 * speakScale, alpha: 0.1, color: "82, 102, 255", speed: 0.7 * speakSpeed, lobes: 6, amp: 0.1 },
      { radius: baseRadius * 0.85 * speakScale, alpha: 0.15, color: "100, 130, 255", speed: 0.9 * speakSpeed, lobes: 5, amp: 0.08 },
      { radius: baseRadius * 0.6 * speakScale, alpha: 0.2, color: "140, 160, 255", speed: 1.1 * speakSpeed, lobes: 7, amp: 0.06 },
    ];

    for (const layer of layers) {
      ctx.beginPath();
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const t = time * 0.001 * layer.speed;
        
        const noise = 
          Math.sin(angle * layer.lobes + t) * layer.amp +
          Math.sin(angle * (layer.lobes + 2) - t * 1.3) * layer.amp * 0.5 +
          Math.sin(angle * (layer.lobes - 1) + t * 0.7) * layer.amp * 0.3;
        
        const r = layer.radius * (1 + noise);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(
        cx + Math.sin(time * 0.001) * 20,
        cy + Math.cos(time * 0.0012) * 20,
        0, cx, cy, layer.radius * 1.5
      );
      grad.addColorStop(0, `rgba(${layer.color}, ${layer.alpha * 1.5})`);
      grad.addColorStop(0.6, `rgba(${layer.color}, ${layer.alpha})`);
      grad.addColorStop(1, `rgba(${layer.color}, 0)`);
      
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Central bright core
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.35 * speakScale);
    coreGrad.addColorStop(0, "rgba(180, 195, 255, 0.35)");
    coreGrad.addColorStop(0.5, "rgba(120, 140, 255, 0.15)");
    coreGrad.addColorStop(1, "rgba(82, 102, 255, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.35 * speakScale, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow ring when speaking
    if (speaking) {
      const ringAlpha = 0.08 + Math.sin(time * 0.003) * 0.04;
      const ringGrad = ctx.createRadialGradient(cx, cy, baseRadius * 1.4, cx, cy, baseRadius * 2.2);
      ringGrad.addColorStop(0, `rgba(82, 102, 255, ${ringAlpha})`);
      ringGrad.addColorStop(1, "rgba(82, 102, 255, 0)");
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating particles
    for (let i = 0; i < 8; i++) {
      const pAngle = (i / 8) * Math.PI * 2 + time * 0.0003;
      const pDist = baseRadius * (1.3 + Math.sin(time * 0.001 + i) * 0.4) * speakScale;
      const px = cx + Math.cos(pAngle) * pDist;
      const py = cy + Math.sin(pAngle) * pDist;
      const pAlpha = 0.15 + Math.sin(time * 0.002 + i * 1.5) * 0.1;
      const pSize = 1.5 + Math.sin(time * 0.003 + i) * 0.8;
      
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140, 160, 255, ${pAlpha})`;
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      (canvas as any).__drawW = rect.width;
      (canvas as any).__drawH = rect.height;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    let speakingRef = isSpeaking;

    const loop = (time: number) => {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const drawW = (canvas as any).__drawW || canvas.width;
      const drawH = (canvas as any).__drawH || canvas.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      draw(
        { ...canvas, width: drawW, height: drawH } as unknown as HTMLCanvasElement,
        ctx, time, speakingRef
      );
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    speakingRef = isSpeaking;

    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, [isSpeaking, draw]);

  return (
    <div
      className={`
        relative rounded-[20px] overflow-hidden border transition-[border-color] duration-400 ease-in-out
        flex-[1.2] flex items-center justify-center max-md:flex-1
        hover:border-[var(--iv-border-medium)]
        ${isSpeaking ? "iv-speaking-glow" : ""}
      `}
      style={{
        background: "var(--iv-surface-2)",
        borderColor: isSpeaking ? undefined : "var(--iv-border-subtle)",
      }}
    >
      {/* Label */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-black/50 backdrop-blur-[12px] border border-white/8 z-5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isSpeaking
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
              : ""
          }`}
          style={!isSpeaking ? { background: "var(--iv-text-tertiary)" } : undefined}
        />
        <span className="text-xs font-medium tracking-[0.02em]" style={{ color: "var(--iv-text-primary)" }}>
          AI Interviewer
        </span>
      </div>

      {/* Blob Canvas */}
      <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-[20px] bg-black/50 backdrop-blur-[12px] border border-white/8 z-5">
          <div className="flex gap-1">
            <span
              className="w-1 h-1 rounded-full iv-thinking-dot"
              style={{ background: "hsl(var(--iv-accent))" }}
            />
            <span
              className="w-1 h-1 rounded-full iv-thinking-dot-2"
              style={{ background: "hsl(var(--iv-accent))" }}
            />
            <span
              className="w-1 h-1 rounded-full iv-thinking-dot-3"
              style={{ background: "hsl(var(--iv-accent))" }}
            />
          </div>
          <span className="text-xs" style={{ color: "var(--iv-text-secondary)" }}>
            Thinking...
          </span>
        </div>
      )}
    </div>
  );
}
