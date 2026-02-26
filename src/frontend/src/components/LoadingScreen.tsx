import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

type Scene = 1 | 2 | 3 | 4 | "fadeout";

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [scene, setScene] = useState<Scene>(1);
  const [rootOpacity, setRootOpacity] = useState(1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Scene 1 starts immediately
    // Scene 2 at 15s
    timers.push(setTimeout(() => setScene(2), 15000));
    // Scene 3 at 35s
    timers.push(setTimeout(() => setScene(3), 35000));
    // Scene 4 at 50s
    timers.push(setTimeout(() => setScene(4), 50000));
    // Fade out at 55s
    timers.push(
      setTimeout(() => {
        setScene("fadeout");
        setRootOpacity(0);
      }, 55000)
    );
    // Complete at 60s
    timers.push(setTimeout(() => onComplete(), 60000));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const sceneNum = scene === "fadeout" ? 4 : (scene as number);
  const isVisible = (n: number) => sceneNum >= n;

  // Scene 1: exterior
  const s1Scale = scene === 1 || scene === "fadeout" ? 1.15 : 1;

  // Scene 2: interior
  const s2Opacity = isVisible(2) ? 1 : 0;
  const s2Scale = scene === 2 || scene === "fadeout" ? 1.2 : sceneNum > 2 ? 1.2 : 1.0;

  // Scene 3: iPhone
  const s3Opacity = isVisible(3) ? 1 : 0;
  const s3Scale = scene === 3 || scene === "fadeout" ? 1.05 : sceneNum > 3 ? 1.05 : 0.85;

  // Scene 4: phone screen overlay
  const s4Opacity = isVisible(4) ? 1 : 0;

  // ── noise grain pattern (film grain) ─────────────────────────────────────
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        overflow: "hidden",
        backgroundColor: "#000",
        opacity: rootOpacity,
        transition: scene === "fadeout" ? "opacity 5s ease-in-out" : undefined,
      }}
    >
      {/* ── Scene 1: Apple Store Exterior ───────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('/assets/generated/apple-store-exterior.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: `scale(${s1Scale})`,
          transition: "transform 15s linear, opacity 2.5s ease-in-out",
          opacity: scene === 1 || scene === "fadeout" ? 1 : 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Warm atmospheric glow overlay on scene 1 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 60% 40%, oklch(0.65 0.2 50 / 0.35) 0%, transparent 55%), radial-gradient(ellipse at 30% 70%, oklch(0.45 0.18 320 / 0.25) 0%, transparent 50%)",
          opacity: scene === 1 ? 1 : 0,
          transition: "opacity 2.5s ease-in-out",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Scene 2: Apple Store Interior ───────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('/assets/generated/apple-store-interior.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: `scale(${s2Scale})`,
          transition: "transform 20s linear, opacity 2.5s ease-in-out",
          opacity: s2Opacity,
          willChange: "transform, opacity",
          zIndex: 3,
        }}
      />

      {/* Parallax table overlay (slightly slower than bg) — Scene 2 depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 55%, oklch(0.12 0.04 285 / 0.55) 85%, oklch(0.08 0.02 285 / 0.8) 100%)",
          opacity: isVisible(2) ? 1 : 0,
          transition: "opacity 2.5s ease-in-out",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />

      {/* Warm interior atmospheric light — Scene 2 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 25%, oklch(0.9 0.12 75 / 0.18) 0%, transparent 60%)",
          opacity: isVisible(2) ? 1 : 0,
          transition: "opacity 2.5s ease-in-out",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* ── Scene 3: iPhone 17 on Display ───────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: s3Opacity,
          transition: "opacity 2.5s ease-in-out",
          zIndex: 6,
          backgroundColor: "#000",
        }}
      >
        {/* Dark ambient scene bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, oklch(0.18 0.06 285) 0%, oklch(0.05 0.02 285) 70%)",
          }}
        />

        {/* Neon halo behind phone */}
        <div
          style={{
            position: "absolute",
            width: "420px",
            height: "560px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, oklch(0.55 0.28 320 / 0.45) 0%, oklch(0.6 0.25 355 / 0.2) 35%, oklch(0.65 0.22 40 / 0.1) 55%, transparent 70%)",
            animation: "halo-pulse 2.8s ease-in-out infinite",
            zIndex: 1,
          }}
        />

        {/* iPhone image */}
        <div
          style={{
            position: "relative",
            transform: `scale(${s3Scale})`,
            transition: "transform 15s ease-out",
            zIndex: 2,
            willChange: "transform",
          }}
        >
          <img
            src="/assets/generated/iphone-17-display.dim_800x1200.png"
            alt="iPhone 17"
            style={{
              height: "80vh",
              maxHeight: "600px",
              width: "auto",
              objectFit: "contain",
              display: "block",
              filter: `drop-shadow(0 0 40px oklch(0.62 0.27 355 / 0.5)) drop-shadow(0 0 80px oklch(0.7 0.22 45 / 0.3))`,
            }}
          />

          {/* ── Scene 4: Phone Screen Overlay ─────────────────────────── */}
          <div
            style={{
              position: "absolute",
              // Target the screen area on the iPhone image — centered, upper portion
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "52%",
              height: "68%",
              borderRadius: "28px",
              overflow: "hidden",
              opacity: s4Opacity,
              transition: "opacity 2s ease-in-out",
              zIndex: 3,
            }}
          >
            {/* Screen background — sunset gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(160deg, oklch(0.09 0.04 290) 0%, oklch(0.14 0.08 310) 35%, oklch(0.22 0.1 355) 65%, oklch(0.28 0.12 30) 100%)",
              }}
            />

            {/* Screen atmospheric glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse at 50% 40%, oklch(0.62 0.27 355 / 0.2) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, oklch(0.7 0.22 45 / 0.25) 0%, transparent 50%)",
              }}
            />

            {/* Screen content: logo + tagline */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "16px",
              }}
            >
              <img
                src="/assets/generated/game-vault-logo-transparent.dim_800x300.png"
                alt="Game Vault"
                style={{
                  width: "90%",
                  maxWidth: "240px",
                  objectFit: "contain",
                  filter:
                    "drop-shadow(0 0 20px oklch(0.65 0.3 355)) drop-shadow(0 0 40px oklch(0.7 0.25 30)) drop-shadow(0 0 8px oklch(0.9 0.2 60))",
                  animation: s4Opacity === 1 ? "logo-pulse 2.5s ease-in-out infinite" : undefined,
                }}
              />

              <p
                style={{
                  color: "oklch(0.9 0.05 30)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  textShadow:
                    "0 0 8px oklch(0.7 0.22 45 / 0.9), 0 0 16px oklch(0.62 0.27 355 / 0.5)",
                  textAlign: "center",
                  fontFamily: "'Exo 2', sans-serif",
                  opacity: s4Opacity,
                  transition: "opacity 1s ease-in-out 1s",
                  margin: 0,
                }}
              >
                Your Digital Gaming Universe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cinematic letterbox bars ────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "8%",
          backgroundColor: "#000",
          zIndex: 15,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "8%",
          backgroundColor: "#000",
          zIndex: 15,
          pointerEvents: "none",
        }}
      />

      {/* ── Film grain overlay ───────────────────────────────────────────── */}
      <div style={grainStyle} />

      {/* ── Scene 1 text overlay: fade in teaser ────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          opacity: scene === 1 ? 1 : 0,
          transition: "opacity 2s ease-in-out",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            color: "oklch(0.95 0.03 75)",
            fontSize: "0.7rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            textShadow: "0 0 12px oklch(0.9 0.1 75 / 0.8)",
            fontFamily: "'Exo 2', sans-serif",
            animation: scene === 1 ? "fade-in 1.5s 1s ease-out both" : undefined,
          }}
        >
          Entering the vault&hellip;
        </p>
      </div>

      {/* ── Scene 2 text overlay ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          opacity: scene === 2 ? 1 : 0,
          transition: "opacity 2s ease-in-out",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            color: "oklch(0.95 0.03 75)",
            fontSize: "0.7rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            textShadow: "0 0 12px oklch(0.9 0.1 75 / 0.8)",
            fontFamily: "'Exo 2', sans-serif",
          }}
        >
          The future of gaming is here&hellip;
        </p>
      </div>

      {/* ── Scene 3 text overlay ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          opacity: scene === 3 ? 1 : 0,
          transition: "opacity 2s ease-in-out",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            color: "oklch(0.95 0.03 75)",
            fontSize: "0.7rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            textShadow: "0 0 12px oklch(0.9 0.1 75 / 0.8)",
            fontFamily: "'Exo 2', sans-serif",
          }}
        >
          Loading your experience&hellip;
        </p>
      </div>

      {/* ── Global keyframes injected via style tag (CSS-only, no lib) ─── */}
      <style>{`
        @keyframes halo-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
