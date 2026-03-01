import type { UserProfile } from "@/backend.d";
import { AuroraMenu } from "@/components/AuroraMenu";
import { Button } from "@/components/ui/button";
import type { Page } from "@/types";
import { Gamepad2, Menu, ShoppingBag, UserCircle } from "lucide-react";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userProfile: UserProfile | null;
  onAdminClick: () => void;
  onLogout: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function Navbar({
  currentPage,
  onNavigate,
  userProfile,
  onAdminClick,
  onLogout,
  isMenuOpen,
  onMenuToggle,
}: NavbarProps) {
  return (
    <>
      <header className="sticky top-0 z-40 w-full">
        <div
          className="border-b"
          style={{
            background: "oklch(0.09 0.04 285 / 0.85)",
            backdropFilter: "blur(16px)",
            borderColor: "oklch(0.62 0.27 355 / 0.2)",
          }}
        >
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <button
              type="button"
              onClick={() => onNavigate("store")}
              className="shrink-0 focus:outline-none"
            >
              <img
                src="/assets/generated/game-vault-logo-transparent.dim_800x300.png"
                alt="Game Vault"
                className="h-10 w-auto logo-glow-sm"
                style={{ maxWidth: "160px", objectFit: "contain" }}
              />
            </button>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink
                icon={<ShoppingBag className="w-4 h-4" />}
                label="Store"
                active={currentPage === "store"}
                onClick={() => onNavigate("store")}
              />
              <NavLink
                icon={<Gamepad2 className="w-4 h-4" />}
                label="Subscriptions"
                active={false}
                onClick={() => {
                  onNavigate("store");
                  setTimeout(() => {
                    document
                      .getElementById("subscriptions")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              />
              {userProfile && (
                <NavLink
                  icon={<UserCircle className="w-4 h-4" />}
                  label="My Account"
                  active={currentPage === "dashboard"}
                  onClick={() => onNavigate("dashboard")}
                />
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {userProfile ? (
                <button
                  type="button"
                  onClick={() => onNavigate("dashboard")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-body font-medium text-foreground/80 hover:text-foreground transition-colors"
                  style={{ background: "oklch(0.18 0.06 285)" }}
                >
                  <UserCircle
                    className="w-4 h-4"
                    style={{ color: "oklch(0.62 0.27 355)" }}
                  />
                  <span className="hidden sm:inline max-w-24 truncate">
                    {userProfile.username}
                  </span>
                </button>
              ) : (
                <Button
                  size="sm"
                  className="btn-gradient text-white font-body font-semibold"
                  onClick={() => onNavigate("auth")}
                >
                  <UserCircle className="w-4 h-4 mr-1.5" />
                  Login
                </Button>
              )}

              {/* Aurora Menu Trigger */}
              <button
                type="button"
                onClick={onMenuToggle}
                className="p-2 rounded-lg transition-all"
                aria-label="Open navigation menu"
                style={{
                  background: isMenuOpen
                    ? "oklch(0.62 0.27 355 / 0.15)"
                    : "oklch(0.15 0.05 285)",
                  border: `1px solid ${isMenuOpen ? "oklch(0.62 0.27 355 / 0.6)" : "oklch(0.62 0.27 355 / 0.25)"}`,
                  color: isMenuOpen
                    ? "oklch(0.62 0.27 355)"
                    : "oklch(0.7 0.04 285)",
                  boxShadow: isMenuOpen
                    ? "0 0 12px oklch(0.62 0.27 355 / 0.3)"
                    : "none",
                }}
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Aurora Menu */}
      <AuroraMenu
        isOpen={isMenuOpen}
        onClose={onMenuToggle}
        currentPage={currentPage}
        onNavigate={onNavigate}
        userProfile={userProfile}
        onLogout={onLogout}
        onAdminClick={onAdminClick}
      />
    </>
  );
}

function NavLink({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all"
      style={{
        color: active ? "oklch(0.62 0.27 355)" : "oklch(0.7 0.04 285)",
        background: active ? "oklch(0.62 0.27 355 / 0.1)" : "transparent",
        textShadow: active ? "0 0 8px oklch(0.62 0.27 355 / 0.7)" : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
