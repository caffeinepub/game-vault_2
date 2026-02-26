import { useEffect, useState } from "react";
import {
  ShoppingBag,
  UserCircle,
  LogIn,
  LogOut,
  Shield,
  X,
  ChevronRight,
  Car,
  Code,
} from "lucide-react";
import type { Page } from "@/types";
import type { UserProfile } from "@/backend.d";

interface AuroraMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  onAdminClick: () => void;
}

interface BladeItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accentColor: string;
  isActive?: boolean;
  visible: boolean;
}

export function AuroraMenu({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  userProfile,
  onLogout,
  onAdminClick,
}: AuroraMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [bladesVisible, setBladesVisible] = useState<boolean[]>([]);

  const blades: BladeItem[] = [
    {
      id: "store",
      label: "Store",
      icon: <ShoppingBag className="w-5 h-5" />,
      onClick: () => { onNavigate("store"); onClose(); },
      accentColor: "oklch(0.62 0.27 355)",
      isActive: currentPage === "store",
      visible: true,
    },
    {
      id: "cpm-services",
      label: "CPM Gg Services",
      icon: <Car className="w-5 h-5" />,
      onClick: () => {
        onNavigate("store");
        onClose();
        setTimeout(() => {
          document.getElementById("cpm-services")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      },
      accentColor: "oklch(0.72 0.25 25)",
      isActive: false,
      visible: true,
    },
    {
      id: "cpm-lua",
      label: "CPM Lua Scripts",
      icon: <Code className="w-5 h-5" />,
      onClick: () => {
        onNavigate("store");
        onClose();
        setTimeout(() => {
          document.getElementById("cpm-lua-scripts")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      },
      accentColor: "oklch(0.75 0.18 190)",
      isActive: false,
      visible: true,
    },
    {
      id: "profile",
      label: "My Profile",
      icon: <UserCircle className="w-5 h-5" />,
      onClick: () => { onNavigate("dashboard"); onClose(); },
      accentColor: "oklch(0.72 0.22 330)",
      isActive: currentPage === "dashboard",
      visible: !!userProfile,
    },
    {
      id: "login",
      label: "Login",
      icon: <LogIn className="w-5 h-5" />,
      onClick: () => { onNavigate("auth"); onClose(); },
      accentColor: "oklch(0.75 0.18 55)",
      isActive: currentPage === "auth",
      visible: !userProfile,
    },
    {
      id: "signout",
      label: "Sign Out",
      icon: <LogOut className="w-5 h-5" />,
      onClick: () => { onLogout(); onClose(); },
      accentColor: "oklch(0.65 0.20 25)",
      isActive: false,
      visible: !!userProfile,
    },
    {
      id: "admin",
      label: "Admin Panel",
      icon: <Shield className="w-5 h-5" />,
      onClick: () => { onAdminClick(); onClose(); },
      accentColor: "oklch(0.75 0.18 55)",
      isActive: currentPage === "admin",
      visible: true,
    },
  ].filter((b) => b.visible);

  const bladeCount = blades.length;

  // Mount panel first, then stagger blades in
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setBladesVisible(new Array(bladeCount).fill(false));
      const timers = Array.from({ length: bladeCount }, (_, i) =>
        setTimeout(() => {
          setBladesVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 80 + i * 80)
      );
      return () => timers.forEach(clearTimeout);
    } else {
      setBladesVisible([]);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, bladeCount]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Close menu"
        style={{
          position: "fixed",
          inset: 0,
          background: "oklch(0.05 0.02 285 / 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 49,
          opacity: isOpen ? 1 : 0,
          transition: "opacity 300ms ease",
          border: "none",
          cursor: "default",
        }}
      />

      {/* Sliding Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "300px",
          zIndex: 50,
          background: "oklch(0.10 0.05 285 / 0.96)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid oklch(0.62 0.27 355 / 0.25)",
          boxShadow: "-8px 0 40px oklch(0.62 0.27 355 / 0.15), -2px 0 0 oklch(0.62 0.27 355 / 0.3)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Left gradient edge — Aurora signature */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "3px",
            background:
              "linear-gradient(to bottom, oklch(0.62 0.27 355), oklch(0.72 0.22 330), oklch(0.75 0.18 55), oklch(0.62 0.27 355))",
          }}
        />

        {/* Panel Header */}
        <div
          style={{
            padding: "20px 20px 16px 24px",
            borderBottom: "1px solid oklch(0.62 0.27 355 / 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "oklch(0.62 0.27 355)",
                textShadow: "0 0 12px oklch(0.62 0.27 355 / 0.8)",
                display: "block",
              }}
            >
              MENU
            </span>
            {userProfile && (
              <span
                style={{
                  fontSize: "12px",
                  color: "oklch(0.6 0.04 285)",
                  fontFamily: "var(--font-body)",
                  marginTop: "2px",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "200px",
                }}
              >
                {userProfile.username}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "oklch(0.15 0.05 285)",
              border: "1px solid oklch(0.62 0.27 355 / 0.3)",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              color: "oklch(0.7 0.04 285)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget;
              btn.style.borderColor = "oklch(0.62 0.27 355 / 0.8)";
              btn.style.color = "oklch(0.62 0.27 355)";
              btn.style.boxShadow = "0 0 8px oklch(0.62 0.27 355 / 0.4)";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget;
              btn.style.borderColor = "oklch(0.62 0.27 355 / 0.3)";
              btn.style.color = "oklch(0.7 0.04 285)";
              btn.style.boxShadow = "none";
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Blades */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {blades.map((blade, i) => (
            <AuroraBlade
              key={blade.id}
              blade={blade}
              visible={bladesVisible[i] ?? false}
              delay={i * 80}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px 16px",
            borderTop: "1px solid oklch(0.62 0.27 355 / 0.1)",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              color: "oklch(0.4 0.03 285)",
              textAlign: "center",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.05em",
            }}
          >
            GAME VAULT
          </p>
        </div>
      </div>
    </>
  );
}

function AuroraBlade({
  blade,
  visible,
}: {
  blade: BladeItem;
  visible: boolean;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={blade.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        width: "100%",
        padding: "14px 20px 14px 24px",
        background: blade.isActive
          ? `${blade.accentColor.replace(")", " / 0.12)").replace("oklch(", "oklch(")}`
          : hovered
          ? "oklch(0.15 0.04 285)"
          : "transparent",
        borderBottom: "1px solid oklch(0.62 0.27 355 / 0.08)",
        borderLeft: blade.isActive || hovered
          ? `4px solid ${blade.accentColor}`
          : "4px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 180ms ease",
        transform: visible ? "translateX(0)" : "translateX(40px)",
        opacity: visible ? 1 : 0,
        boxShadow:
          hovered
            ? `inset 0 0 20px ${blade.accentColor.replace(")", " / 0.08)").replace("oklch(", "oklch(")}`
            : "none",
      }}
    >
      {/* Icon */}
      <span
        style={{
          color: blade.isActive || hovered ? blade.accentColor : "oklch(0.55 0.04 285)",
          textShadow: hovered ? `0 0 10px ${blade.accentColor}` : "none",
          transition: "all 180ms ease",
          flexShrink: 0,
        }}
      >
        {blade.icon}
      </span>

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          fontWeight: blade.isActive ? 600 : 500,
          color: blade.isActive
            ? blade.accentColor
            : hovered
            ? "oklch(0.92 0.02 285)"
            : "oklch(0.72 0.04 285)",
          letterSpacing: "0.02em",
          textShadow: blade.isActive
            ? `0 0 12px ${blade.accentColor}`
            : hovered
            ? `0 0 8px ${blade.accentColor}`
            : "none",
          transition: "all 180ms ease",
        }}
      >
        {blade.label}
      </span>

      {/* Chevron */}
      <ChevronRight
        className="w-4 h-4"
        style={{
          color: hovered ? blade.accentColor : "oklch(0.35 0.03 285)",
          transform: hovered ? "translateX(3px)" : "translateX(0)",
          transition: "all 180ms ease",
          flexShrink: 0,
        }}
      />
    </button>
  );
}
