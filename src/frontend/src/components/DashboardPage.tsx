import type {
  Membership,
  Order,
  PaymentSettings,
  Product,
  UserProfile,
} from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Page } from "@/types";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Crown,
  Download,
  FileArchive,
  FileCode,
  Loader2,
  LogOut,
  Mail,
  Save,
  ShoppingBag,
  UserCircle,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SiBitcoin, SiEthereum, SiPaypal } from "react-icons/si";
import { toast } from "sonner";

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
  onListFilesByName?: (productName: string) => Promise<ProductFileInfo[]>;
  onDownloadFile?: (fileId: bigint) => Promise<Uint8Array>;
  products?: Product[];
  membershipStatus?: Membership | null;
  hasActiveMembership?: boolean;
  paymentSettings?: PaymentSettings | null;
  onPurchaseMembership?: (
    paymentMethod: string,
    paymentRef: string,
  ) => Promise<bigint>;
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
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
      }}
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
        background: isLua
          ? "oklch(0.62 0.27 355 / 0.15)"
          : "oklch(0.55 0.2 145 / 0.15)",
        color: isLua ? "oklch(0.75 0.22 355)" : "oklch(0.65 0.2 145)",
        border: `1px solid ${isLua ? "oklch(0.62 0.27 355 / 0.4)" : "oklch(0.55 0.2 145 / 0.4)"}`,
      }}
    >
      {isLua ? (
        <FileCode className="w-3 h-3" />
      ) : (
        <FileArchive className="w-3 h-3" />
      )}
      {fileType.toUpperCase()}
    </span>
  );
}

function OrderDownloadSection({
  order,
  products,
  onListProductFiles,
  onListFilesByName,
  onDownloadFile,
}: {
  order: Order;
  products?: Product[];
  onListProductFiles?: (productId: bigint) => Promise<ProductFileInfo[]>;
  onListFilesByName?: (productName: string) => Promise<ProductFileInfo[]>;
  onDownloadFile: (fileId: bigint) => Promise<Uint8Array>;
}) {
  const [files, setFiles] = useState<ProductFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<bigint | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      if (onListFilesByName) {
        // Primary path: look up by product name — works even if the product
        // has been marked unavailable and is no longer in the products list.
        const result = await onListFilesByName(order.itemName);
        setFiles(result);
      } else if (onListProductFiles && products) {
        // Fallback: look up the product id from the products array first.
        const product = products.find(
          (p) =>
            p.name.trim().toLowerCase() === order.itemName.trim().toLowerCase(),
        );
        if (!product) {
          setIsLoading(false);
          return;
        }
        const result = await onListProductFiles(product.id);
        setFiles(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [onListFilesByName, onListProductFiles, products, order.itemName]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const handleDownload = async (file: ProductFileInfo) => {
    setDownloadingId(file.fileId);
    try {
      const data = await onDownloadFile(file.fileId);
      const mimeType =
        file.fileType.toLowerCase() === "apk"
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
        <Loader2
          className="w-3.5 h-3.5 animate-spin"
          style={{ color: "oklch(0.65 0.2 145)" }}
        />
        <span className="text-xs font-body text-foreground/40">
          Checking for files...
        </span>
      </div>
    );
  }

  if (files.length === 0) return null;

  return (
    <div
      className="mt-3 rounded-lg p-3 space-y-2"
      style={{
        background: "oklch(0.55 0.2 145 / 0.07)",
        border: "1px solid oklch(0.55 0.2 145 / 0.25)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Download
          className="w-3.5 h-3.5"
          style={{ color: "oklch(0.65 0.2 145)" }}
        />
        <span
          className="font-body font-semibold text-xs"
          style={{ color: "oklch(0.65 0.2 145)" }}
        >
          Download Files
        </span>
      </div>
      {files.map((file) => (
        <div key={file.fileId.toString()} className="flex items-center gap-2">
          <FileTypeBadge fileType={file.fileType} />
          <span className="flex-1 font-body text-xs text-foreground/60 truncate">
            {file.fileName}
          </span>
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
            {downloadingId === file.fileId ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            <span className="ml-1">
              {downloadingId === file.fileId ? "..." : "Download"}
            </span>
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
  onListFilesByName,
  onDownloadFile,
  products = [],
  membershipStatus = null,
  hasActiveMembership = false,
  paymentSettings = null,
  onPurchaseMembership,
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
    return () => {
      mounted = false;
    };
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

  const pendingCount = orders.filter(
    (o) => o.status.toLowerCase() === "pending",
  ).length;

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
                background:
                  "linear-gradient(135deg, oklch(0.62 0.27 355 / 0.3), oklch(0.7 0.22 45 / 0.3))",
                border: "2px solid oklch(0.62 0.27 355 / 0.4)",
              }}
            >
              <UserCircle
                className="w-8 h-8"
                style={{ color: "oklch(0.62 0.27 355)" }}
              />
            </div>
            <div>
              <h1
                className="font-display text-3xl"
                style={{
                  color: "white",
                  textShadow: "0 0 15px oklch(0.62 0.27 355 / 0.4)",
                }}
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
            <Mail
              className="w-4 h-4"
              style={{ color: "oklch(0.62 0.27 355)" }}
            />
            <h2 className="font-body font-bold text-sm text-foreground/80">
              Delivery Email
            </h2>
          </div>
          <p className="text-foreground/40 font-body text-xs mb-3">
            Order details and digital content will be sent to this address.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveEmail();
              }}
              placeholder="your@email.com"
              className="font-body flex-1"
              style={{
                background: "oklch(0.15 0.05 285)",
                borderColor: "oklch(0.3 0.08 285)",
                color: "white",
              }}
            />
            <Button
              size="sm"
              onClick={() => void handleSaveEmail()}
              disabled={
                isSavingEmail || emailInput.trim() === userProfile.email
              }
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
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
          style={{ animation: "fade-in-up 0.5s 0.1s ease-out both" }}
        >
          <StatCard
            label="Total Orders"
            value={orders.length.toString()}
            icon="📦"
          />
          <StatCard
            label="Pending"
            value={pendingCount.toString()}
            icon="⏳"
            highlight={pendingCount > 0}
          />
          <StatCard
            label="Completed"
            value={orders
              .filter((o) => o.status.toLowerCase() === "accepted")
              .length.toString()}
            icon="✅"
          />
        </div>

        {/* Membership section */}
        <div
          className="glass-card p-5 mb-8"
          style={{
            animation: "fade-in-up 0.5s 0.15s ease-out both",
            borderColor: hasActiveMembership
              ? "oklch(0.82 0.18 80 / 0.4)"
              : "oklch(0.3 0.08 285)",
            boxShadow: hasActiveMembership
              ? "0 0 20px oklch(0.82 0.18 80 / 0.08)"
              : "none",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown
              className="w-4 h-4"
              style={{ color: "oklch(0.82 0.18 80)" }}
            />
            <h2 className="font-body font-bold text-sm text-foreground/80">
              Ad-Free Membership
            </h2>
          </div>

          {hasActiveMembership ? (
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "oklch(0.82 0.18 80 / 0.2)",
                  border: "2px solid oklch(0.82 0.18 80 / 0.5)",
                }}
              >
                <Crown
                  className="w-5 h-5"
                  style={{ color: "oklch(0.82 0.18 80)" }}
                />
              </div>
              <div>
                <p
                  className="font-body font-bold text-sm mb-0.5"
                  style={{ color: "oklch(0.82 0.18 80)" }}
                >
                  ✓ Active Member
                </p>
                {membershipStatus && (
                  <p className="text-foreground/60 font-body text-sm">
                    Active until{" "}
                    <span className="font-semibold text-foreground/80">
                      {new Date(
                        Number(membershipStatus.expiresAt) / 1_000_000,
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}
                <p className="text-foreground/40 font-body text-xs mt-1">
                  You're browsing without ads. Repurchase next month to
                  continue.
                </p>
              </div>
            </div>
          ) : (
            <DashboardMembershipCheckout
              paymentSettings={paymentSettings}
              onPurchase={onPurchaseMembership}
            />
          )}
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
                  <Skeleton
                    className="h-10 w-10 rounded-lg"
                    style={{ background: "oklch(0.2 0.04 285)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <Skeleton
                      className="h-4 w-1/2"
                      style={{ background: "oklch(0.2 0.04 285)" }}
                    />
                    <Skeleton
                      className="h-3 w-1/4"
                      style={{ background: "oklch(0.2 0.04 285)" }}
                    />
                  </div>
                  <Skeleton
                    className="h-6 w-20"
                    style={{ background: "oklch(0.2 0.04 285)" }}
                  />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ShoppingBag
                className="w-12 h-12 mx-auto mb-4 opacity-30"
                style={{ color: "oklch(0.62 0.27 355)" }}
              />
              <h3 className="font-body font-bold text-foreground mb-2">
                No orders yet
              </h3>
              <p className="text-foreground/50 font-body text-sm mb-4">
                Browse the store to find something you like!
              </p>
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
                // Can download if the order is accepted AND we have either the
                // name-based lookup (preferred) or the id-based fallback, plus
                // a download handler.
                const canDownload =
                  isAccepted &&
                  !!onDownloadFile &&
                  (!!onListFilesByName || !!onListProductFiles);
                return (
                  <div
                    key={order.orderId.toString()}
                    className="glass-card p-4"
                  >
                    {/* Main order row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-foreground text-sm truncate">
                          {order.itemName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-foreground/50 font-body">
                          <span style={{ color: "oklch(0.85 0.19 85)" }}>
                            {formatPrice(order.price)}
                          </span>
                          <span>
                            {getPaymentMethodLabel(order.paymentMethod)}
                          </span>
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
                        onListFilesByName={onListFilesByName}
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
      style={
        highlight
          ? {
              borderColor: "oklch(0.85 0.19 85 / 0.4)",
              boxShadow: "0 0 10px oklch(0.85 0.19 85 / 0.1)",
            }
          : {}
      }
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

type DashMembershipPaymentMethod =
  | "paypal"
  | "bitcoin"
  | "ethereum"
  | "xbox"
  | "amazon"
  | "etsy";

const DASH_PAYMENT_OPTIONS: Array<{
  id: DashMembershipPaymentMethod;
  label: string;
  icon: React.ReactNode;
  color: string;
  getAddress: (s: PaymentSettings) => string;
  placeholder: string;
  isCrypto: boolean;
}> = [
  {
    id: "paypal",
    label: "PayPal",
    icon: <SiPaypal className="w-4 h-4" />,
    color: "oklch(0.55 0.2 240)",
    getAddress: (s) => s.paypalEmail,
    placeholder: "PayPal transaction ID",
    isCrypto: true,
  },
  {
    id: "bitcoin",
    label: "Bitcoin",
    icon: <SiBitcoin className="w-4 h-4" />,
    color: "oklch(0.75 0.18 60)",
    getAddress: (s) => s.bitcoinWallet,
    placeholder: "Bitcoin transaction ID",
    isCrypto: true,
  },
  {
    id: "ethereum",
    label: "Ethereum",
    icon: <SiEthereum className="w-4 h-4" />,
    color: "oklch(0.65 0.15 270)",
    getAddress: (s) => s.ethereumWallet,
    placeholder: "Ethereum transaction hash",
    isCrypto: true,
  },
  {
    id: "xbox",
    label: "Xbox Gift Card",
    icon: <span>🎮</span>,
    color: "oklch(0.55 0.2 145)",
    getAddress: (s) => s.xboxInstructions || "Contact admin",
    placeholder: "Xbox gift card code",
    isCrypto: false,
  },
  {
    id: "amazon",
    label: "Amazon Gift Card",
    icon: <span>📦</span>,
    color: "oklch(0.7 0.18 60)",
    getAddress: (s) => s.amazonInstructions || "Contact admin",
    placeholder: "Amazon gift card code",
    isCrypto: false,
  },
  {
    id: "etsy",
    label: "Etsy Gift Card",
    icon: <span>🛍️</span>,
    color: "oklch(0.65 0.2 30)",
    getAddress: (s) => s.etsyInstructions || "Contact admin",
    placeholder: "Etsy gift card code",
    isCrypto: false,
  },
];

function DashboardMembershipCheckout({
  paymentSettings,
  onPurchase,
}: {
  paymentSettings: PaymentSettings | null;
  onPurchase?: (paymentMethod: string, paymentRef: string) => Promise<bigint>;
}) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<DashMembershipPaymentMethod | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePurchase = async () => {
    if (!selectedMethod) {
      toast.error("Select a payment method");
      return;
    }
    if (!paymentRef.trim()) {
      toast.error("Enter payment reference");
      return;
    }
    if (!onPurchase) {
      toast.error("Purchase not available");
      return;
    }

    setIsPlacing(true);
    try {
      await onPurchase(selectedMethod, paymentRef.trim());
      setPurchased(true);
      toast.success("Membership purchased! Ads are now hidden.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to purchase. Try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (purchased) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{
          background: "oklch(0.82 0.18 80 / 0.1)",
          border: "1px solid oklch(0.82 0.18 80 / 0.3)",
        }}
      >
        <Crown className="w-5 h-5" style={{ color: "oklch(0.82 0.18 80)" }} />
        <p
          className="font-body text-sm"
          style={{ color: "oklch(0.82 0.18 80)" }}
        >
          Membership activated! Refresh to see ads removed.
        </p>
      </div>
    );
  }

  if (!showCheckout) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground/60 font-body text-sm">
            Browse without ads — just £0.05/month
          </p>
          <p className="text-foreground/40 font-body text-xs mt-0.5">
            One-time monthly purchase, no auto-renewal
          </p>
        </div>
        <Button
          size="sm"
          className="font-body font-bold text-sm shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.7 0.2 75), oklch(0.78 0.18 90))",
            color: "oklch(0.12 0.04 285)",
            boxShadow: "0 0 15px oklch(0.82 0.18 80 / 0.25)",
          }}
          onClick={() => setShowCheckout(true)}
        >
          <Crown className="w-3.5 h-3.5 mr-1.5" />
          Buy — £0.05
        </Button>
      </div>
    );
  }

  const selectedOpt = DASH_PAYMENT_OPTIONS.find((o) => o.id === selectedMethod);
  const address =
    selectedOpt && paymentSettings
      ? selectedOpt.getAddress(paymentSettings)
      : "";

  return (
    <div style={{ animation: "fade-in 0.2s ease-out both" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-sm text-foreground/70">
          Select payment method
        </p>
        <button
          type="button"
          onClick={() => setShowCheckout(false)}
          className="p-1 rounded text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {DASH_PAYMENT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelectedMethod(opt.id)}
            className="flex items-center gap-1.5 p-2 rounded-lg font-body text-xs font-medium transition-all text-left"
            style={{
              background:
                selectedMethod === opt.id
                  ? `oklch(${opt.color.replace("oklch(", "").split(")")[0]} / 0.15)`
                  : "oklch(0.15 0.05 285 / 0.6)",
              border: `1px solid ${selectedMethod === opt.id ? opt.color : "oklch(0.3 0.08 285)"}`,
              color:
                selectedMethod === opt.id ? opt.color : "oklch(0.6 0.04 285)",
            }}
          >
            <span style={{ color: opt.color }}>{opt.icon}</span>
            <span className="truncate">{opt.label}</span>
            {selectedMethod === opt.id && (
              <CheckCircle2
                className="w-3 h-3 ml-auto shrink-0"
                style={{ color: opt.color }}
              />
            )}
          </button>
        ))}
      </div>

      {selectedMethod && address && (
        <div
          className="rounded-lg p-2.5 mb-2.5 flex items-center gap-2"
          style={{
            background: "oklch(0.08 0.04 285)",
            border: `1px solid ${selectedOpt?.color ?? "oklch(0.3 0.08 285)"} / 0.25)`,
          }}
        >
          <code
            className="font-body text-xs break-all flex-1"
            style={{ color: selectedOpt?.color }}
          >
            {address}
          </code>
          {selectedOpt?.isCrypto && (
            <button
              type="button"
              onClick={() => handleCopy(address, "dash-addr")}
              className="shrink-0 p-1.5 rounded hover:bg-muted/50 transition-colors"
            >
              {copiedField === "dash-addr" ? (
                <ClipboardCheck
                  className="w-3.5 h-3.5"
                  style={{ color: "oklch(0.65 0.2 145)" }}
                />
              ) : (
                <Copy className="w-3.5 h-3.5 text-foreground/40" />
              )}
            </button>
          )}
        </div>
      )}

      {selectedMethod && (
        <div className="flex gap-2">
          <input
            type="text"
            id="dash-membership-ref"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder={selectedOpt?.placeholder ?? "Payment reference"}
            className="flex-1 px-3 py-2 rounded-lg font-body text-xs text-foreground placeholder:text-foreground/30 outline-none"
            style={{
              background: "oklch(0.15 0.05 285)",
              border: "1px solid oklch(0.3 0.08 285)",
            }}
          />
          <Button
            size="sm"
            className="font-body font-bold text-xs shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.7 0.2 75), oklch(0.78 0.18 90))",
              color: "oklch(0.12 0.04 285)",
            }}
            onClick={() => void handlePurchase()}
            disabled={isPlacing || !paymentRef.trim()}
          >
            {isPlacing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crown className="w-3.5 h-3.5" />
            )}
            <span className="ml-1">{isPlacing ? "..." : "Buy"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export { Badge };
