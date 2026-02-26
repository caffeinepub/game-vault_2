import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

type Phase = "sunset" | "splash" | "fadeout";

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<Phase>("sunset");
  const [rootOpacity, setRootOpacity] = useState(1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 40s — transition to logo splash
    timers.push(setTimeout(() => setPhase("splash"), 40000));

    // 43s — begin root fade out
    timers.push(
      setTimeout(() => {
        setPhase("fadeout");
        setRootOpacity(0);
      }, 43000)
    );

    // 45s — call onComplete
    timers.push(setTimeout(() => onComplete(), 45000));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  // ── noise grain pattern ────────────────────────────────────────────────────
  const grainStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: 0.04,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
    backgroundSize: "128px 128px",
    backgroundRepeat: "repeat",
    pointerEvents: "none",
    zIndex: 20,
  };

  const isSunset = phase === "sunset";
  const isSplash = phase === "splash" || phase === "fadeout";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        overflow: "hidden",
        backgroundColor: "#000",
        opacity: rootOpacity,
        transition: phase === "fadeout" ? "opacity 2s ease-in-out" : undefined,
      }}
    >
      {/* ── Google Font import ────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Exo+2:wght@300;400&display=swap');

        @keyframes ken-burns {
          0%   { transform: scale(1.0); }
          100% { transform: scale(1.12); }
        }

        @keyframes text-breathe {
          0%, 100% { transform: scale(1.0); }
          50%       { transform: scale(1.03); }
        }

        @keyframes fade-in-up {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes tagline-fade-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 30px #ff6b35) drop-shadow(0 0 60px #e040fb) drop-shadow(0 0 120px #ff6b35); }
          50%       { filter: drop-shadow(0 0 50px #ff6b35) drop-shadow(0 0 100px #e040fb) drop-shadow(0 0 180px #ff6b35); }
        }

        @keyframes splash-fade-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* ── Phase 1: Sunset Scene ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: isSunset ? 1 : 0,
          transition: "opacity 1.5s ease-in-out",
          zIndex: 1,
        }}
      >
        {/* Background image with Ken Burns effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/assets/generated/sunset-loading-bg.dim_1920x1080.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            animation: "ken-burns 40s linear forwards",
            willChange: "transform",
          }}
        />

        {/* Dark gradient overlay — top transparent, bottom darkened */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Centered text content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {/* Game Vault graffiti logo */}
          <h1
            style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: "clamp(4rem, 10vw, 9rem)",
              color: "#fff",
              margin: 0,
              lineHeight: 1,
              textShadow:
                "0 0 20px #ff6b35, 0 0 40px #ff6b35, 0 0 80px #e040fb, 0 0 120px #e040fb, 0 0 200px #ff6b35",
              animation:
                "fade-in-up 2s ease-out both, text-breathe 3s ease-in-out 2s infinite",
              willChange: "transform, opacity",
            }}
          >
            Game Vault
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: "clamp(0.7rem, 1.5vw, 1rem)",
              fontVariant: "small-caps",
              letterSpacing: "0.3em",
              color: "#fff",
              margin: 0,
              textTransform: "uppercase",
              textShadow: "0 0 10px #ff6b35, 0 0 20px #e040fb",
              animation: "tagline-fade-in 1.5s ease-out 3s both",
            }}
          >
            Your Digital Gaming Universe
          </p>
        </div>
      </div>

      {/* ── Phase 2: Logo Splash ───────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, #1a0a2e 0%, #000 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: isSplash ? 1 : 0,
          transition: "opacity 1.5s ease-in-out",
          zIndex: 2,
        }}
      >
        <img
          src="/assets/generated/game-vault-logo-transparent.dim_800x300.png"
          alt="Game Vault"
          style={{
            width: "60vw",
            maxWidth: "600px",
            objectFit: "contain",
            display: "block",
            animation: isSplash ? "logo-pulse 2s ease-in-out infinite, splash-fade-in 1s ease-out both" : undefined,
          }}
        />
      </div>

      {/* ── Film grain overlay ─────────────────────────────────────────────── */}
      <div style={grainStyle} />
    </div>
  );
}
