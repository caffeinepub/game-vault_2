import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserCircle, Mail, User, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import type { Page } from "@/types";
import type { UserProfile } from "@/backend.d";

interface AuthPageProps {
  onNavigate: (page: Page) => void;
  onRegister: (username: string, email: string) => Promise<void>;
  onLoginLookup: () => Promise<UserProfile | null>;
  onSetUserProfile: (profile: UserProfile) => void;
}

export function AuthPage({ onNavigate, onRegister, onLoginLookup, onSetUserProfile }: AuthPageProps) {
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const hasTriedAutoLogin = useRef(false);

  const isConnected = !!identity;
  const isConnecting = loginStatus === "logging-in";

  // Auto-login: if the user already has an identity (returning session), try to look up their profile silently
  useEffect(() => {
    if (isInitializing || hasTriedAutoLogin.current) return;
    if (!isConnected) return;
    hasTriedAutoLogin.current = true;
    setIsAutoLoggingIn(true);
    onLoginLookup()
      .then((profile) => {
        if (profile) {
          onSetUserProfile(profile);
          toast.success(`Welcome back, ${profile.username}! 🎮`);
          onNavigate("store");
        }
      })
      .catch((err) => {
        // Silent failure — just show normal login UI
        console.error("Auto-login failed:", err);
      })
      .finally(() => {
        setIsAutoLoggingIn(false);
      });
  }, [isInitializing, isConnected, onLoginLookup, onSetUserProfile, onNavigate]);

  const handleConnect = async () => {
    try {
      await login();
    } catch {
      toast.error("Failed to connect. Please try again.");
    }
  };

  const handleRegister = async () => {
    if (!identity) {
      toast.error("Please connect your identity first");
      return;
    }
    if (!regUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }
    if (!regEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsRegistering(true);
    try {
      await onRegister(regUsername.trim(), regEmail.trim());
      onSetUserProfile({ username: regUsername.trim(), email: regEmail.trim() });
      toast.success("Account created! Welcome to Game Vault 🎮");
      onNavigate("store");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("already taken")) {
        toast.error("That username is already taken. Please choose a different one.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async () => {
    if (!identity) {
      toast.error("Please connect your identity first");
      return;
    }

    setIsLoggingIn(true);
    try {
      const profile = await onLoginLookup();
      if (profile) {
        onSetUserProfile(profile);
        toast.success(`Welcome back, ${profile.username}! 🎮`);
        onNavigate("store");
      } else {
        toast.error("No account found for this identity. Please register instead.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isInitializing || isAutoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.62 0.27 355)" }} />
          {isAutoLoggingIn && (
            <p className="text-foreground/50 font-body text-sm">Signing you in...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md"
        style={{ animation: "scale-in 0.4s ease-out both" }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/generated/game-vault-logo-transparent.dim_800x300.png"
            alt="Game Vault"
            className="h-16 w-auto mx-auto logo-glow mb-4"
          />
          <p className="text-foreground/50 font-body text-sm">
            Your digital gaming universe
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          {/* Identity connection */}
          {!isConnected && (
            <div className="mb-6 p-4 rounded-lg text-center" style={{ background: "oklch(0.62 0.27 355 / 0.1)", border: "1px solid oklch(0.62 0.27 355 / 0.3)" }}>
              <p className="text-foreground/70 font-body text-sm mb-3">
                First, connect your identity to get started
              </p>
              <Button
                className="btn-gradient text-white font-body font-semibold"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" />Connect Identity</>
                )}
              </Button>
            </div>
          )}

          {isConnected && (
            <div
              className="mb-6 p-3 rounded-lg flex items-center gap-3"
              style={{ background: "oklch(0.55 0.2 145 / 0.1)", border: "1px solid oklch(0.55 0.2 145 / 0.3)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.55 0.2 145 / 0.2)" }}
              >
                <UserCircle className="w-4 h-4" style={{ color: "oklch(0.65 0.2 145)" }} />
              </div>
              <div>
                <p className="font-body text-xs text-foreground/50">Connected as</p>
                <p className="font-body text-sm text-foreground font-medium truncate max-w-48">
                  {identity.getPrincipal().toString().slice(0, 20)}...
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="login">
            <TabsList
              className="w-full mb-6 font-body"
              style={{ background: "oklch(0.1 0.04 285)" }}
            >
              <TabsTrigger value="login" className="flex-1 font-body">Login</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 font-body">Register</TabsTrigger>
            </TabsList>

            {/* Login tab */}
            <TabsContent value="login" className="space-y-6">
              <p className="text-foreground/60 font-body text-sm">
                Already have an account? Connect your identity and we'll look up your profile.
              </p>

              <Button
                className="btn-gradient text-white font-body font-bold w-full py-5 h-auto"
                onClick={handleLogin}
                disabled={isLoggingIn || !isConnected}
              >
                {isLoggingIn ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Looking up account...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" />Login</>
                )}
              </Button>

              <p className="text-center text-foreground/40 font-body text-xs">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground/70 transition-colors"
                  onClick={() => {
                    const trigger = document.querySelector('[data-value="register"]') as HTMLButtonElement | null;
                    trigger?.click();
                  }}
                >
                  Register here
                </button>
              </p>
            </TabsContent>

            {/* Register tab */}
            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label className="font-body text-sm text-foreground/70 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" style={{ color: "oklch(0.62 0.27 355)" }} />
                  Username
                </Label>
                <Input
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="font-body"
                  style={{
                    background: "oklch(0.15 0.05 285)",
                    borderColor: "oklch(0.3 0.08 285)",
                    color: "white",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-body text-sm text-foreground/70 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" style={{ color: "oklch(0.62 0.27 355)" }} />
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="font-body"
                  style={{
                    background: "oklch(0.15 0.05 285)",
                    borderColor: "oklch(0.3 0.08 285)",
                    color: "white",
                  }}
                />
                <p className="text-foreground/40 font-body text-xs">
                  We'll send your digital content to this email.
                </p>
              </div>

              <Button
                className="btn-gradient text-white font-body font-bold w-full py-5 h-auto"
                onClick={handleRegister}
                disabled={isRegistering || !isConnected}
              >
                {isRegistering ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
                ) : (
                  <><UserCircle className="w-4 h-4 mr-2" />Create Account</>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onNavigate("store")}
              className="text-foreground/30 hover:text-foreground/60 font-body text-xs transition-colors"
            >
              ← Back to Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
