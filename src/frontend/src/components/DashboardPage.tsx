import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, LogOut, ShoppingBag, Clock, Mail, Save, Loader2, Download, FileCode, FileArchive } from "lucide-react";
import { toast } from "sonner";
import type { Page } from "@/types";
import type { Order, UserProfile, Product } from "@/backend.d";

interface ProductFileInfo {
  fileName: string;
  fileType: string;
  fileId: bigint;
}

interface DashboardPageProps {
  userProfile: UserProfile;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onLoadOrders: (username: string) => Promise<Order[]>;
  onUpdateEmail: (newEmail: string) => Promise<void>;
  onListProductFiles?: (productId: bigint) => Promise<ProductFileInfo[]>;
  onDownloadFile?: (fileId: bigint) => Promise<Uint8Array>;
  products?: Product[];
}

function formatPrice(pricePence: bigint): string {
  const pounds = Number(pricePence) / 100;
  return `£${pounds.toFixed(2)}`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      bg: "oklch(0.7 0.18 85 / 0.15)",
      border: "oklch(0.7 0.18 85 / 0.4)",
      color: "oklch(0.85 0.19 85)",
      label: "Pending",
    },
    accepted: {
      bg: "oklch(0.55 0.2 145 / 0.15)",
      border: "oklch(0.55 0.2 145 / 0.4)",
      color: "oklch(0.65 0.2 145)",
      label: "Accepted",
    },
    declined: {
      bg: "oklch(0.65 0.25 25 / 0.15)",
      border: "oklch(0.65 0.25 25 / 0.4)",
      color: "oklch(0.7 0.25 25)",
      label: "Declined",
    },
  }[status.toLowerCase()] ?? {
    bg: "oklch(0.3 0.04 285 / 0.3)",
    border: "oklch(0.4 0.04 285 / 0.4)",
    color: "oklch(0.6 0.04 285)",
    label: status,
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold"
      style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}
    >
      {config.label}
    </span>
  );
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    paypal: "PayPal",
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    xbox: "Xbox Gift Card",
    amazon: "Amazon Gift Card",
    etsy: "Etsy Gift Card",
  };
  return labels[method.toLowerCase()] ?? method;
}

function FileTypeBadge({ fileType }: { fileType: string }) {
  const isLua = fileType.toLowerCase() === "lua";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-bold"
      style={{
        background: isLua ? "oklch(0.62 0.27 355 / 0.15)" : "oklch(0.55 0.2 145 / 0.15)",
        color: isLua ? "oklch(0.75 0.22 355)" : "oklch(0.65 0.2 145)",
        border: `1px solid ${isLua ? "oklch(0.62 0.27 355 / 0.4)" : "oklch(0.55 0.2 145 / 0.4)"}`,
      }}
    >
      {isLua ? <FileCode className="w-3 h-3" /> : <FileArchive className="w-3 h-3" />}
      {fileType.toUpperCase()}
    </span>
  );
}

function OrderDownloadSection({
  order,
  products,
  onListProductFiles,
  onDownloadFile,
}: {
  order: Order;
  products: Product[];
  onListProductFiles: (productId: bigint) => Promise<ProductFileInfo[]>;
  onDownloadFile: (fileId: bigint) => Promise<Uint8Array>;
}) {
  const [files, setFiles] = useState<ProductFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<bigint | null>(null);

  const loadFiles = useCallback(async () => {
    // find the matching product by name
    const product = products.find(
      (p) => p.name.toLowerCase() === order.itemName.toLowerCase()
    );
    if (!product) {
      setIsLoading(false);
      return;
    }
    try {
      const result = await onListProductFiles(product.id);
      setFiles(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [products, order.itemName, onListProductFiles]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const handleDownload = async (file: ProductFileInfo) => {
    setDownloadingId(file.fileId);
    try {
      const data = await onDownloadFile(file.fileId);
      const mimeType = file.fileType.toLowerCase() === "apk"
        ? "application/vnd.android.package-archive"
        : "text/plain";
      // Copy into a plain ArrayBuffer to satisfy strict Blob typing
      const arrayCopy = new Uint8Array(data).buffer as ArrayBuffer;
      const blob = new Blob([arrayCopy], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloading ${file.fileName}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "oklch(0.65 0.2 145)" }} />
        <span className="text-xs font-body text-foreground/40">Checking for files...</span>
      </div>
    );
  }

  if (files.length === 0) return null;

  return (
    <div
      className="mt-3 rounded-lg p-3 space-y-2"
      style={{ background: "oklch(0.55 0.2 145 / 0.07)", border: "1px solid oklch(0.55 0.2 145 / 0.25)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Download className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.2 145)" }} />
        <span className="font-body font-semibold text-xs" style={{ color: "oklch(0.65 0.2 145)" }}>
          Download Files
        </span>
      </div>
      {files.map((file) => (
        <div key={file.fileId.toString()} className="flex items-center gap-2">
          <FileTypeBadge fileType={file.fileType} />
          <span className="flex-1 font-body text-xs text-foreground/60 truncate">{file.fileName}</span>
          <Button
            size="sm"
            onClick={() => void handleDownload(file)}
            disabled={downloadingId === file.fileId}
            className="h-7 px-2 font-body font-semibold text-xs shrink-0"
            style={{
              background: "oklch(0.55 0.2 145 / 0.2)",
              border: "1px solid oklch(0.55 0.2 145 / 0.4)",
              color: "oklch(0.65 0.2 145)",
            }}
          >
            {downloadingId === file.fileId
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Download className="w-3 h-3" />
            }
            <span className="ml-1">{downloadingId === file.fileId ? "..." : "Download"}</span>
          </Button>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage({
  userProfile,
  onNavigate,
  onLogout,
  onLoadOrders,
  onUpdateEmail,
  onListProductFiles,
  onDownloadFile,
  products = [],
}: DashboardPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Email update state
  const [emailInput, setEmailInput] = useState(userProfile.email);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoadingOrders(true);
    onLoadOrders(userProfile.username)
      .then((loaded) => {
        if (mounted) {
          setOrders(loaded.sort((a, b) => Number(b.timestamp - a.timestamp)));
          setIsLoadingOrders(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          toast.error("Failed to load orders");
          setIsLoadingOrders(false);
        }
      });
    return () => { mounted = false; };
  }, [userProfile.username, onLoadOrders]);

  const handleLogout = () => {
    onLogout();
    toast.success("Logged out successfully");
    onNavigate("store");
  };

  const handleSaveEmail = async () => {
    if (!emailInput.trim()) {
      toast.error("Email address cannot be empty");
      return;
    }
    setIsSavingEmail(true);
    try {
      await onUpdateEmail(emailInput.trim());
      toast.success("Email updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update email");
    } finally {
      setIsSavingEmail(false);
    }
  };

  const pendingCount = orders.filter((o) => o.status.toLowerCase() === "pending").length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div
          className="glass-card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ animation: "fade-in-up 0.5s ease-out both" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, oklch(0.62 0.27 355 / 0.3), oklch(0.7 0.22 45 / 0.3))",
                border: "2px solid oklch(0.62 0.27 355 / 0.4)",
              }}
            >
              <UserCircle className="w-8 h-8" style={{ color: "oklch(0.62 0.27 355)" }} />
            </div>
            <div>
              <h1
                className="font-display text-3xl"
                style={{ color: "white", textShadow: "0 0 15px oklch(0.62 0.27 355 / 0.4)" }}
              >
                {userProfile.username}
              </h1>
              <p className="text-foreground/50 font-body text-sm flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {userProfile.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="font-body text-foreground/60 hover:text-foreground border"
              style={{ borderColor: "oklch(0.3 0.08 285)" }}
              onClick={() => onNavigate("store")}
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              Shop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-body text-destructive/80 hover:text-destructive border"
              style={{ borderColor: "oklch(0.65 0.25 25 / 0.3)" }}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Log Out
            </Button>
          </div>
        </div>

        {/* Update delivery email */}
        <div
          className="glass-card p-5 mb-6"
          style={{ animation: "fade-in-up 0.5s 0.08s ease-out both" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4" style={{ color: "oklch(0.62 0.27 355)" }} />
            <h2 className="font-body font-bold text-sm text-foreground/80">Delivery Email</h2>
          </div>
          <p className="text-foreground/40 font-body text-xs mb-3">
            Order details and digital content will be sent to this address.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSaveEmail(); }}
              placeholder="your@email.com"
              className="font-body flex-1"
              style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }}
            />
            <Button
              size="sm"
              onClick={() => void handleSaveEmail()}
              disabled={isSavingEmail || emailInput.trim() === userProfile.email}
              className="font-body font-semibold shrink-0"
              style={{
                background: "oklch(0.62 0.27 355 / 0.2)",
                border: "1px solid oklch(0.62 0.27 355 / 0.5)",
                color: "oklch(0.75 0.22 355)",
              }}
            >
              {isSavingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8"
          style={{ animation: "fade-in-up 0.5s 0.1s ease-out both" }}
        >
          <StatCard label="Total Orders" value={orders.length.toString()} icon="📦" />
          <StatCard
            label="Pending"
            value={pendingCount.toString()}
            icon="⏳"
            highlight={pendingCount > 0}
          />
          <StatCard
            label="Completed"
            value={orders.filter((o) => o.status.toLowerCase() === "accepted").length.toString()}
            icon="✅"
          />
        </div>

        {/* Orders table */}
        <div style={{ animation: "fade-in-up 0.5s 0.2s ease-out both" }}>
          <h2 className="font-display text-2xl mb-4" style={{ color: "white" }}>
            Purchase History
          </h2>

          {isLoadingOrders ? (
            <div className="glass-card p-4 space-y-4">
              {(["a", "b", "c"] as const).map((sk) => (
                <div key={sk} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" style={{ background: "oklch(0.2 0.04 285)" }} />
                    <Skeleton className="h-3 w-1/4" style={{ background: "oklch(0.2 0.04 285)" }} />
                  </div>
                  <Skeleton className="h-6 w-20" style={{ background: "oklch(0.2 0.04 285)" }} />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "oklch(0.62 0.27 355)" }} />
              <h3 className="font-body font-bold text-foreground mb-2">No orders yet</h3>
              <p className="text-foreground/50 font-body text-sm mb-4">Browse the store to find something you like!</p>
              <Button
                className="btn-gradient text-white font-body font-semibold"
                onClick={() => onNavigate("store")}
              >
                Browse Store
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isAccepted = order.status.toLowerCase() === "accepted";
                const canDownload = isAccepted && !!onListProductFiles && !!onDownloadFile && products.length > 0;
                return (
                  <div
                    key={order.orderId.toString()}
                    className="glass-card p-4"
                  >
                    {/* Main order row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-foreground text-sm truncate">{order.itemName}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-foreground/50 font-body">
                          <span style={{ color: "oklch(0.85 0.19 85)" }}>{formatPrice(order.price)}</span>
                          <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(order.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>

                    {/* Download section for accepted orders */}
                    {canDownload && (
                      <OrderDownloadSection
                        order={order}
                        products={products}
                        onListProductFiles={onListProductFiles}
                        onDownloadFile={onDownloadFile}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="glass-card p-4 flex items-center gap-3"
      style={highlight ? { borderColor: "oklch(0.85 0.19 85 / 0.4)", boxShadow: "0 0 10px oklch(0.85 0.19 85 / 0.1)" } : {}}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p
          className="font-display text-2xl leading-none"
          style={{ color: highlight ? "oklch(0.85 0.19 85)" : "white" }}
        >
          {value}
        </p>
        <p className="font-body text-xs text-foreground/50 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export { Badge };
