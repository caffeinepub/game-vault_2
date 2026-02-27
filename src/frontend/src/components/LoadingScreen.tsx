import { useCallback, useEffect, useRef, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [rootOpacity, setRootOpacity] = useState(1);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [textOpacity, setTextOpacity] = useState(0);
  const [textGlow, setTextGlow] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Web Audio: Xbox One startup chime ────────────────────────────────────
  const playChime = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const playNote = (freq: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const t = ctx.currentTime + startOffset;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.1);
      };

      // Rising 3-note Xbox-style chime sequence
      playNote(440, 0, 0.5);
      playNote(550, 0.4, 0.5);
      playNote(660, 0.9, 0.8);
    } catch {
      // Audio not supported — silent fallback
    }
  }, []);

  // ── Phase timeline (35s total) ───────────────────────────────────────────
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 0s → G fades in over 1.5s
    timers.push(
      setTimeout(() => setLogoOpacity(1), 50) // near-instant trigger so CSS transition kicks in
    );

    // 3s → play chime
    timers.push(setTimeout(() => playChime(), 3000));

    // 3.5s → "Game Vault" text fades in
    timers.push(setTimeout(() => setTextOpacity(1), 3500));

    // 5s → start breathing glow on text
    timers.push(setTimeout(() => setTextGlow(true), 5000));

    // 32s → begin fade out
    timers.push(
      setTimeout(() => {
        setRootOpacity(0);
      }, 32000)
    );

    // 35s → complete
    timers.push(setTimeout(() => onComplete(), 35000));

    return () => {
      timers.forEach(clearTimeout);
      audioCtxRef.current?.close();
    };
  }, [onComplete, playChime]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        overflow: "hidden",
        // Xbox One signature green background
        backgroundColor: "#107C10",
        opacity: rootOpacity,
        transition: rootOpacity === 0 ? "opacity 3s ease-in-out" : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes g-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }

        @keyframes g-appear {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes glow-breathe-white {
          0%, 100% {
            text-shadow:
              0 0 20px rgba(255, 255, 255, 0.7),
              0 0 50px rgba(255, 255, 255, 0.35),
              0 0 100px rgba(255, 255, 255, 0.15);
          }
          50% {
            text-shadow:
              0 0 30px rgba(255, 255, 255, 0.95),
              0 0 70px rgba(255, 255, 255, 0.55),
              0 0 140px rgba(255, 255, 255, 0.3);
          }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "48px",
        }}
      >
        {/* ── "G" Logo in Xbox One bold geometric style ─────────────────────── */}
        <div
          style={{
            opacity: logoOpacity,
            transition: "opacity 1.5s ease-out",
            animation: logoOpacity === 1 ? "g-pulse 4s ease-in-out 1.5s infinite" : undefined,
            userSelect: "none",
          }}
        >
          <span
            style={{
              fontFamily: "'Segoe UI', Arial, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(180px, 22vw, 220px)",
              lineHeight: 1,
              color: "#FFFFFF",
              display: "block",
              textShadow:
                "0 0 40px rgba(255,255,255,0.8), 0 0 80px rgba(255,255,255,0.4), 0 0 120px rgba(255,255,255,0.2)",
              filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.25))",
            }}
          >
            G
          </span>
        </div>

        {/* ── "Game Vault" wordmark below the G ────────────────────────────── */}
        <h1
          style={{
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 300,
            fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
            color: "#FFFFFF",
            margin: 0,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: textOpacity,
            transition: "opacity 2s ease-out",
            animation: textGlow ? "glow-breathe-white 4s ease-in-out infinite" : undefined,
            textShadow: textOpacity
              ? "0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.3)"
              : undefined,
            userSelect: "none",
          }}
        >
          Game Vault
        </h1>
      </div>
    </div>
  );
}
