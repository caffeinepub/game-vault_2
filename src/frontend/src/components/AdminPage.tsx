import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Shield, ShieldCheck, Package, ShoppingBag,
  CreditCard, Plus, Trash2, Edit, Check, X, ChevronRight,
  ArrowLeft, Save, Tag, ToggleLeft, ToggleRight, Mail, Paperclip, Upload, FileCode, FileArchive,
  Megaphone, Users, Image, AlignLeft, ExternalLink, Globe, Youtube, Building2, Copy, ClipboardCheck,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import type { Product, Package as BackendPackage, Order, PaymentSettings, Coupon, Ad, Membership, PromotionRequest } from "@/backend.d";

interface ProductFileInfo {
  fileName: string;
  fileType: string;
  fileId: bigint;
}

interface AdminPageProps {
  onNavigate: (page: string) => void;
  onAdsChanged?: () => void;
  onSwitchToAdsTab?: () => void;
  backend: {
    isCallerAdmin: () => Promise<boolean>;
    listAvailableProducts: () => Promise<Product[]>;
    createProduct: (name: string, desc: string, price: bigint, cat: string, imageUrl: string) => Promise<bigint>;
    updateProduct: (id: bigint, name: string, desc: string, price: bigint, cat: string, imageUrl: string, avail: boolean) => Promise<void>;
    deleteProduct: (id: bigint) => Promise<void>;
    listActivePackages: () => Promise<BackendPackage[]>;
    createPackage: (name: string, desc: string, price: bigint, features: string[]) => Promise<bigint>;
    updatePackage: (id: bigint, name: string, desc: string, price: bigint, features: string[], active: boolean) => Promise<void>;
    deletePackage: (id: bigint) => Promise<void>;
    listAllOrders: () => Promise<Array<[string, Order[]]>>;
    updateOrderStatus: (username: string, orderId: bigint, status: string) => Promise<void>;
    getPaymentSettings: () => Promise<PaymentSettings | null>;
    savePaymentSettings: (settings: PaymentSettings) => Promise<void>;
    listAllCoupons: () => Promise<Coupon[]>;
    createCoupon: (code: string, type: string, value: bigint, maxUses: bigint, isActive: boolean) => Promise<void>;
    updateCoupon: (code: string, type: string, value: bigint, maxUses: bigint, isActive: boolean) => Promise<void>;
    deleteCoupon: (code: string) => Promise<void>;
    attachFileToProduct: (productId: bigint, fileName: string, fileType: string, fileData: Uint8Array) => Promise<bigint>;
    removeFileFromProduct: (productId: bigint, fileId: bigint) => Promise<void>;
    listProductFilesAdmin: (productId: bigint) => Promise<ProductFileInfo[]>;
    // Ads
    listAllAds: () => Promise<Ad[]>;
    createAd: (adType: string, title: string, desc: string, imageUrl: string, linkUrl: string) => Promise<bigint>;
    updateAd: (id: bigint, adType: string, title: string, desc: string, imageUrl: string, linkUrl: string, isActive: boolean) => Promise<void>;
    deleteAd: (id: bigint) => Promise<void>;
    // Memberships
    listAllMemberships: () => Promise<Membership[]>;
    // Promotions
    listAllPromotionRequests: () => Promise<PromotionRequest[]>;
    updatePromotionRequestStatus: (id: bigint, status: string) => Promise<void>;
  };
}

type AdminTab = "orders" | "products" | "subscriptions" | "payments" | "coupons" | "ads" | "memberships" | "promotions";
type PinState = "idle" | "entered" | "verified" | "denied";

const CORRECT_PIN = "2006";

function formatPrice(pricePence: bigint): string {
  return `£${(Number(pricePence) / 100).toFixed(2)}`;
}

function parsePriceToPence(str: string): bigint {
  const parsed = Math.round(parseFloat(str) * 100);
  return BigInt(isNaN(parsed) ? 0 : parsed);
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    pending: { bg: "oklch(0.7 0.18 85 / 0.15)", color: "oklch(0.85 0.19 85)", border: "oklch(0.7 0.18 85 / 0.4)" },
    accepted: { bg: "oklch(0.55 0.2 145 / 0.15)", color: "oklch(0.65 0.2 145)", border: "oklch(0.55 0.2 145 / 0.4)" },
    declined: { bg: "oklch(0.65 0.25 25 / 0.15)", color: "oklch(0.7 0.25 25)", border: "oklch(0.65 0.25 25 / 0.4)" },
  }[status.toLowerCase()] ?? { bg: "oklch(0.2 0.04 285 / 0.3)", color: "oklch(0.5 0.04 285)", border: "oklch(0.3 0.04 285)" };

  return (
    <span
      className="px-2 py-0.5 rounded-full font-body text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {status}
    </span>
  );
}

// ---- PIN Gate ----
function PinGate({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState("");
  const [pinState, setPinState] = useState<PinState>("idle");

  const handleSubmit = () => {
    if (pin === CORRECT_PIN) {
      setPinState("verified");
      onSuccess();
    } else {
      setPinState("denied");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="glass-card p-8 w-full max-w-sm text-center"
        style={{ animation: "scale-in 0.3s ease-out both" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: pinState === "denied"
              ? "oklch(0.65 0.25 25 / 0.2)"
              : "oklch(0.62 0.27 355 / 0.15)",
            border: `2px solid ${pinState === "denied" ? "oklch(0.65 0.25 25 / 0.5)" : "oklch(0.62 0.27 355 / 0.4)"}`,
          }}
        >
          {pinState === "denied"
            ? <Shield className="w-7 h-7" style={{ color: "oklch(0.7 0.25 25)" }} />
            : <ShieldCheck className="w-7 h-7" style={{ color: "oklch(0.62 0.27 355)" }} />
          }
        </div>

        <h2 className="font-display text-2xl text-white mb-2">Admin Panel</h2>
        <p className="text-foreground/50 font-body text-sm mb-6">Enter your PIN to continue</p>

        {pinState === "denied" && (
          <p className="text-sm font-body mb-4" style={{ color: "oklch(0.7 0.25 25)" }}>
            Incorrect PIN. Please try again.
          </p>
        )}

        <div className="space-y-4">
          <Input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinState("idle"); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Enter PIN"
            maxLength={4}
            className="text-center text-2xl tracking-widest font-body"
            style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }}
          />

          <Button
            className="btn-gradient text-white font-body font-bold w-full"
            onClick={handleSubmit}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Enter Admin Panel
          </Button>

          <button
            type="button"
            onClick={onCancel}
            className="text-foreground/40 hover:text-foreground/70 font-body text-sm transition-colors flex items-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Orders Tab ----
function OrdersTab({ backend }: { backend: AdminPageProps["backend"] }) {
  const [allOrders, setAllOrders] = useState<Array<[string, Order[]]>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await backend.listAllOrders();
      setAllOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const handleStatus = async (username: string, orderId: bigint, status: string) => {
    const key = `${username}-${orderId.toString()}`;
    setUpdatingId(key);
    try {
      await backend.updateOrderStatus(username, orderId, status);
      toast.success(`Order ${status}`);
      void loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const allOrdersFlat = allOrders.flatMap(([username, orders]) =>
    orders.map((o) => ({ ...o, customerUsername: username }))
  ).sort((a, b) => Number(b.timestamp - a.timestamp));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {(["a", "b", "c"] as const).map((sk) => (
          <Skeleton key={sk} className="h-16 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />
        ))}
      </div>
    );
  }

  if (allOrdersFlat.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-body text-foreground/50">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allOrdersFlat.map((order) => {
        const key = `${order.customerUsername}-${order.orderId.toString()}`;
        const isPending = order.status.toLowerCase() === "pending";
        return (
          <div key={key} className="glass-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-body font-semibold text-foreground text-sm truncate">{order.itemName}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-foreground/50">
                  <span>👤 {order.customerUsername}</span>
                  {order.deliveryEmail && (
                    <a
                      href={`mailto:${order.deliveryEmail}`}
                      className="flex items-center gap-1 hover:underline"
                      style={{ color: "oklch(0.65 0.2 145)" }}
                      title="Send email to customer"
                    >
                      <Mail className="w-3 h-3" />
                      {order.deliveryEmail}
                    </a>
                  )}
                  <span style={{ color: "oklch(0.85 0.19 85)" }}>{formatPrice(order.price)}</span>
                  <span>💳 {order.paymentMethod}</span>
                  <span className="font-mono text-foreground/40 max-w-32 truncate" title={order.paymentReference}>
                    Ref: {order.paymentReference}
                  </span>
                </div>
              </div>

              {isPending && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleStatus(order.customerUsername, order.orderId, "accepted")}
                    disabled={updatingId === key}
                    className="font-body font-semibold text-white text-xs"
                    style={{ background: "oklch(0.55 0.2 145)", boxShadow: "none" }}
                  >
                    {updatingId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span className="ml-1">Accept</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatus(order.customerUsername, order.orderId, "declined")}
                    disabled={updatingId === key}
                    className="font-body font-semibold text-white text-xs"
                    style={{ background: "oklch(0.65 0.25 25)", boxShadow: "none" }}
                  >
                    {updatingId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    <span className="ml-1">Decline</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Products Tab ----
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

interface QueuedFile {
  file: File;
  fileType: string;
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

function ProductFilesSection({
  productId,
  backend,
}: {
  productId: bigint | null;
  backend: AdminPageProps["backend"];
}) {
  const [existingFiles, setExistingFiles] = useState<ProductFileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [removingFileId, setRemovingFileId] = useState<bigint | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async (id: bigint) => {
    setIsLoadingFiles(true);
    try {
      const files = await backend.listProductFilesAdmin(id);
      setExistingFiles(files);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attached files");
    } finally {
      setIsLoadingFiles(false);
    }
  }, [backend]);

  useEffect(() => {
    if (productId !== null) {
      void loadFiles(productId);
    } else {
      setExistingFiles([]);
    }
  }, [productId, loadFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid: QueuedFile[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (ext === "lua" || ext === "apk") {
        valid.push({ file, fileType: ext });
      } else {
        toast.error(`"${file.name}" is not a .lua or .apk file`);
      }
    }
    setQueuedFiles((prev) => [...prev, ...valid]);
    // reset input so same file can be re-queued if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeQueued = (idx: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (!productId || queuedFiles.length === 0) return;
    setIsUploading(true);
    try {
      await Promise.all(
        queuedFiles.map(async ({ file, fileType }) => {
          const buffer = await file.arrayBuffer();
          const data = new Uint8Array(buffer);
          await backend.attachFileToProduct(productId, file.name, fileType, data);
        })
      );
      toast.success(`${queuedFiles.length} file(s) uploaded!`);
      setQueuedFiles([]);
      void loadFiles(productId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveExisting = async (fileId: bigint) => {
    if (!productId) return;
    setRemovingFileId(fileId);
    try {
      await backend.removeFileFromProduct(productId, fileId);
      toast.success("File removed");
      void loadFiles(productId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove file");
    } finally {
      setRemovingFileId(null);
    }
  };

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ background: "oklch(0.11 0.04 285)", border: "1px solid oklch(0.25 0.06 285)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Paperclip className="w-4 h-4" style={{ color: "oklch(0.75 0.22 355)" }} />
        <span className="font-body font-semibold text-sm text-foreground/80">Attached Files</span>
        {productId === null && (
          <span className="text-foreground/40 font-body text-xs">(save the product first to attach files)</span>
        )}
      </div>

      {/* Existing files */}
      {productId !== null && (
        <>
          {isLoadingFiles ? (
            <div className="space-y-2">
              {(["a", "b"] as const).map((sk) => (
                <Skeleton key={sk} className="h-8 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />
              ))}
            </div>
          ) : existingFiles.length === 0 ? (
            <p className="text-foreground/40 font-body text-xs">No files attached yet</p>
          ) : (
            <div className="space-y-1.5">
              {existingFiles.map((f) => (
                <div
                  key={f.fileId.toString()}
                  className="flex items-center gap-2 px-3 py-2 rounded-md"
                  style={{ background: "oklch(0.16 0.05 285)" }}
                >
                  <FileTypeBadge fileType={f.fileType} />
                  <span className="flex-1 font-body text-xs text-foreground/70 truncate">{f.fileName}</span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveExisting(f.fileId)}
                    disabled={removingFileId === f.fileId}
                    className="p-1 rounded hover:bg-destructive/10 transition-colors shrink-0"
                    style={{ color: "oklch(0.7 0.25 25)" }}
                    title="Remove file"
                  >
                    {removingFileId === f.fileId
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Queued files for upload */}
      {queuedFiles.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-foreground/50 font-body text-xs font-semibold uppercase tracking-wider">Queued for upload:</p>
          {queuedFiles.map((qf, idx) => (
            <div
              key={`queued-${String(idx)}`}
              className="flex items-center gap-2 px-3 py-2 rounded-md"
              style={{ background: "oklch(0.7 0.22 45 / 0.08)", border: "1px dashed oklch(0.7 0.22 45 / 0.3)" }}
            >
              <FileTypeBadge fileType={qf.fileType} />
              <span className="flex-1 font-body text-xs text-foreground/70 truncate">{qf.file.name}</span>
              <button
                type="button"
                onClick={() => removeQueued(idx)}
                className="p-1 rounded hover:bg-destructive/10 transition-colors shrink-0 text-foreground/40 hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File input + upload button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".lua,.apk"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          id="product-file-input"
        />
        <label
          htmlFor="product-file-input"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md cursor-pointer font-body text-xs font-semibold transition-colors"
          style={{
            background: "oklch(0.16 0.05 285)",
            border: "1px dashed oklch(0.35 0.08 285)",
            color: "oklch(0.6 0.08 285)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Select .lua or .apk files
        </label>

        {queuedFiles.length > 0 && productId !== null && (
          <Button
            type="button"
            size="sm"
            onClick={() => void handleUpload()}
            disabled={isUploading}
            className="font-body font-semibold text-white shrink-0"
            style={{ background: "oklch(0.62 0.27 355 / 0.8)" }}
          >
            {isUploading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Upload className="w-3.5 h-3.5" />
            }
            <span className="ml-1">{isUploading ? "Uploading..." : `Upload ${queuedFiles.length}`}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function ProductsTab({ backend }: { backend: AdminPageProps["backend"] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [savedProductId, setSavedProductId] = useState<bigint | null>(null);
  const [form, setForm] = useState<ProductFormData>({
    name: "", description: "", price: "", category: "game_account", imageUrl: "", isAvailable: true,
  });

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await backend.listAvailableProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", category: "game_account", imageUrl: "", isAvailable: true });
    setEditingProduct(null);
    setSavedProductId(null);
    setShowForm(false);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: (Number(product.price) / 100).toFixed(2),
      category: product.category,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable,
    });
    setEditingProduct(product);
    setSavedProductId(product.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error("Valid price is required"); return; }

    setIsSaving(true);
    try {
      const price = parsePriceToPence(form.price);
      if (editingProduct) {
        await backend.updateProduct(editingProduct.id, form.name.trim(), form.description.trim(), price, form.category, form.imageUrl.trim(), form.isAvailable);
        toast.success("Product updated!");
        void loadProducts();
      } else {
        const newId = await backend.createProduct(form.name.trim(), form.description.trim(), price, form.category, form.imageUrl.trim());
        toast.success("Product created! You can now attach files below.");
        setSavedProductId(newId);
        void loadProducts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    setDeletingId(id);
    try {
      await backend.deleteProduct(id);
      toast.success("Product deleted");
      void loadProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const fileAttachProductId = editingProduct ? editingProduct.id : savedProductId;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body font-bold text-foreground">{products.length} Products</h3>
        <Button
          size="sm"
          className="btn-gradient text-white font-body font-semibold"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="font-body max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "oklch(0.13 0.05 285)", border: "1px solid oklch(0.3 0.08 285)" }}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Name *">
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Minecraft Account" className="input-dark" style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }} />
            </FormField>
            <FormField label="Description">
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the product..." className="resize-none" style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Price (£) *">
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="9.99" style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }} />
              </FormField>
              <FormField label="Category">
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "oklch(0.15 0.05 285)" }}>
                    <SelectItem value="game_account">Game Account</SelectItem>
                    <SelectItem value="download_file">Download File</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Image URL">
              <Input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }} />
            </FormField>
            {editingProduct && (
              <div className="flex items-center gap-3">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm((p) => ({ ...p, isAvailable: v }))} />
                <span className="font-body text-sm text-foreground/70">Available in store</span>
              </div>
            )}

            {/* Save button inline for new products before file section */}
            {!editingProduct && !savedProductId && (
              <Button
                className="btn-gradient text-white font-body font-semibold w-full"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Product &amp; Attach Files</>}
              </Button>
            )}

            {/* Files section – shown once product exists */}
            <ProductFilesSection
              productId={fileAttachProductId}
              backend={backend}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={resetForm} className="font-body text-foreground/60">
              {savedProductId && !editingProduct ? "Done" : "Cancel"}
            </Button>
            {(editingProduct || savedProductId) && (
              <Button className="btn-gradient text-white font-body font-semibold" onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {(["a", "b"] as const).map((sk) => <Skeleton key={sk} className="h-16 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-body text-foreground/50 mb-4">No products yet</p>
          <Button className="btn-gradient text-white font-body font-semibold" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add First Product
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id.toString()} className="glass-card p-4 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg shrink-0 overflow-hidden"
                style={{ background: "oklch(0.18 0.06 285)" }}
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    {product.category === "download_file" ? "💾" : "🎮"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-foreground text-sm truncate">{product.name}</p>
                <div className="flex gap-3 text-xs font-body text-foreground/50 mt-0.5">
                  <span style={{ color: "oklch(0.85 0.19 85)" }}>{formatPrice(product.price)}</span>
                  <span>{product.category === "download_file" ? "Download" : "Account"}</span>
                  <span style={{ color: product.isAvailable ? "oklch(0.65 0.2 145)" : "oklch(0.7 0.25 25)" }}>
                    {product.isAvailable ? "✓ Available" : "✕ Unavailable"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="p-2 rounded-lg hover:bg-muted/40 transition-colors"
                  style={{ color: "oklch(0.62 0.27 355)" }}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  style={{ color: "oklch(0.7 0.25 25)" }}
                  title="Delete"
                >
                  {deletingId === product.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Subscriptions Tab ----
interface PackageFormData {
  name: string;
  description: string;
  price: string;
  features: string[];
  isActive: boolean;
}

function SubscriptionsTab({ backend }: { backend: AdminPageProps["backend"] }) {
  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState<BackendPackage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const [form, setForm] = useState<PackageFormData>({
    name: "", description: "", price: "", features: [], isActive: true,
  });

  const loadPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await backend.listActivePackages();
      setPackages(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load packages");
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  useEffect(() => { void loadPackages(); }, [loadPackages]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", features: [], isActive: true });
    setEditingPkg(null);
    setShowForm(false);
    setNewFeature("");
  };

  const openEdit = (pkg: BackendPackage) => {
    setForm({
      name: pkg.name,
      description: pkg.description,
      price: (Number(pkg.price) / 100).toFixed(2),
      features: [...pkg.features],
      isActive: pkg.isActive,
    });
    setEditingPkg(pkg);
    setShowForm(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm((p) => ({ ...p, features: [...p.features, newFeature.trim()] }));
      setNewFeature("");
    }
  };

  const removeFeature = (idx: number) => {
    setForm((p) => ({ ...p, features: p.features.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Package name is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error("Valid price is required"); return; }

    setIsSaving(true);
    try {
      const price = parsePriceToPence(form.price);
      if (editingPkg) {
        await backend.updatePackage(editingPkg.id, form.name.trim(), form.description.trim(), price, form.features, form.isActive);
        toast.success("Package updated!");
      } else {
        await backend.createPackage(form.name.trim(), form.description.trim(), price, form.features);
        toast.success("Package created!");
      }
      resetForm();
      void loadPackages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save package");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    setDeletingId(id);
    try {
      await backend.deletePackage(id);
      toast.success("Package deleted");
      void loadPackages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete package");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body font-bold text-foreground">{packages.length} Packages</h3>
        <Button
          size="sm"
          className="btn-gradient text-white font-body font-semibold"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Package
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="font-body max-w-lg" style={{ background: "oklch(0.13 0.05 285)", border: "1px solid oklch(0.3 0.08 285)" }}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">
              {editingPkg ? "Edit Package" : "Add New Package"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Name *">
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Monthly" style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }} />
            </FormField>
            <FormField label="Description">
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What's included..." className="resize-none" style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }} />
            </FormField>
            <FormField label="Price (£) *">
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="9.99" style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }} />
            </FormField>

            {/* Features */}
            <FormField label="Features">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addFeature(); }}
                    placeholder="Add a feature..."
                    style={{ background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" }}
                  />
                  <Button type="button" size="sm" onClick={addFeature} className="btn-gradient text-white shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.features.map((feat, idx) => (
                  <div key={`${feat}-${String(idx)}`} className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "oklch(0.18 0.05 285)" }}>
                    <span className="flex-1 font-body text-sm text-foreground/80">{feat}</span>
                    <button type="button" onClick={() => removeFeature(idx)} className="text-foreground/40 hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </FormField>

            {editingPkg && (
              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                <span className="font-body text-sm text-foreground/70">Active (visible in store)</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={resetForm} className="font-body text-foreground/60">Cancel</Button>
            <Button className="btn-gradient text-white font-body font-semibold" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {(["a", "b"] as const).map((sk) => <Skeleton key={sk} className="h-16 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-body text-foreground/50 mb-4">No packages yet</p>
          <Button className="btn-gradient text-white font-body font-semibold" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add First Package
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id.toString()} className="glass-card p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-body font-semibold text-foreground text-sm">{pkg.name}</p>
                  <span
                    className="px-1.5 py-0.5 rounded-full font-body text-xs"
                    style={{ background: pkg.isActive ? "oklch(0.55 0.2 145 / 0.15)" : "oklch(0.2 0.04 285 / 0.3)", color: pkg.isActive ? "oklch(0.65 0.2 145)" : "oklch(0.5 0.04 285)" }}
                  >
                    {pkg.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p style={{ color: "oklch(0.85 0.19 85)" }} className="font-body text-xs mb-1">{formatPrice(pkg.price)}/month</p>
                {pkg.features.length > 0 && (
                  <p className="text-foreground/40 font-body text-xs">{pkg.features.slice(0, 2).join(", ")}{pkg.features.length > 2 ? "..." : ""}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openEdit(pkg)} className="p-2 rounded-lg hover:bg-muted/40 transition-colors" style={{ color: "oklch(0.62 0.27 355)" }} title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pkg.id)}
                  disabled={deletingId === pkg.id}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  style={{ color: "oklch(0.7 0.25 25)" }}
                  title="Delete"
                >
                  {deletingId === pkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Payment Settings Tab ----
function PaymentSettingsTab({ backend }: { backend: AdminPageProps["backend"] }) {
  const [settings, setSettings] = useState<PaymentSettings>({
    paypalEmail: "", bitcoinWallet: "", ethereumWallet: "",
    xboxInstructions: "", amazonInstructions: "", etsyInstructions: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    backend.getPaymentSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load payment settings");
      })
      .finally(() => setIsLoading(false));
  }, [backend]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await backend.savePaymentSettings(settings);
      toast.success("Payment settings saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {(["a", "b", "c", "d", "e", "f"] as const).map((sk) => (
          <Skeleton key={sk} className="h-10 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />
        ))}
      </div>
    );
  }

  const inputStyle = { background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" };
  const textareaStyle = { ...inputStyle };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="PayPal Email">
          <Input
            value={settings.paypalEmail}
            onChange={(e) => setSettings((p) => ({ ...p, paypalEmail: e.target.value }))}
            placeholder="your@paypal.com"
            type="email"
            style={inputStyle}
          />
        </FormField>
        <FormField label="Bitcoin Wallet Address">
          <Input
            value={settings.bitcoinWallet}
            onChange={(e) => setSettings((p) => ({ ...p, bitcoinWallet: e.target.value }))}
            placeholder="bc1q..."
            style={inputStyle}
          />
        </FormField>
        <FormField label="Ethereum Wallet Address">
          <Input
            value={settings.ethereumWallet}
            onChange={(e) => setSettings((p) => ({ ...p, ethereumWallet: e.target.value }))}
            placeholder="0x..."
            style={inputStyle}
          />
        </FormField>
      </div>

      <div className="space-y-4">
        <h3 className="font-body font-semibold text-foreground/70 text-sm uppercase tracking-widest">
          Gift Card Instructions
        </h3>

        <FormField label="Xbox Gift Card (UK) Instructions">
          <Textarea
            value={settings.xboxInstructions}
            onChange={(e) => setSettings((p) => ({ ...p, xboxInstructions: e.target.value }))}
            placeholder="Instructions for how customers should use Xbox gift cards..."
            className="resize-none"
            rows={3}
            style={textareaStyle}
          />
        </FormField>

        <FormField label="Amazon Gift Card (UK) Instructions">
          <Textarea
            value={settings.amazonInstructions}
            onChange={(e) => setSettings((p) => ({ ...p, amazonInstructions: e.target.value }))}
            placeholder="Instructions for how customers should use Amazon gift cards..."
            className="resize-none"
            rows={3}
            style={textareaStyle}
          />
        </FormField>

        <FormField label="Etsy Gift Card (UK) Instructions">
          <Textarea
            value={settings.etsyInstructions}
            onChange={(e) => setSettings((p) => ({ ...p, etsyInstructions: e.target.value }))}
            placeholder="Instructions for how customers should use Etsy gift cards..."
            className="resize-none"
            rows={3}
            style={textareaStyle}
          />
        </FormField>
      </div>

      <Button
        className="btn-gradient text-white font-body font-bold py-5 h-auto px-8"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" />Save Payment Settings</>
        )}
      </Button>
    </div>
  );
}

// ---- Coupons Tab ----
interface CouponFormData {
  code: string;
  discountType: string;
  discountValue: string;
  maxUses: string;
  isActive: boolean;
}

function CouponsTab({ backend }: { backend: AdminPageProps["backend"] }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const [form, setForm] = useState<CouponFormData>({
    code: "", discountType: "percentage", discountValue: "", maxUses: "", isActive: true,
  });

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await backend.listAllCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  useEffect(() => { void loadCoupons(); }, [loadCoupons]);

  const resetForm = () => {
    setForm({ code: "", discountType: "percentage", discountValue: "", maxUses: "", isActive: true });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const openEdit = (coupon: Coupon) => {
    const rawValue = coupon.discountType === "percentage"
      ? coupon.discountValue.toString()
      : (Number(coupon.discountValue) / 100).toFixed(2);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: rawValue,
      maxUses: coupon.maxUses === 0n ? "" : coupon.maxUses.toString(),
      isActive: coupon.isActive,
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error("Coupon code is required"); return; }
    if (!form.discountValue || isNaN(parseFloat(form.discountValue))) { toast.error("Valid discount value is required"); return; }

    const rawValue = parseFloat(form.discountValue);
    let discountValue: bigint;
    if (form.discountType === "percentage") {
      if (rawValue <= 0 || rawValue > 100) { toast.error("Percentage must be between 1 and 100"); return; }
      discountValue = BigInt(Math.round(rawValue));
    } else {
      if (rawValue <= 0) { toast.error("Discount amount must be greater than 0"); return; }
      discountValue = BigInt(Math.round(rawValue * 100));
    }
    const maxUses = form.maxUses.trim() ? BigInt(Math.max(0, parseInt(form.maxUses, 10))) : 0n;
    const code = form.code.trim().toUpperCase();

    setIsSaving(true);
    try {
      if (editingCoupon) {
        await backend.updateCoupon(code, form.discountType, discountValue, maxUses, form.isActive);
        toast.success("Coupon updated!");
      } else {
        await backend.createCoupon(code, form.discountType, discountValue, maxUses, form.isActive);
        toast.success("Coupon created!");
      }
      resetForm();
      void loadCoupons();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save coupon");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    setDeletingCode(code);
    try {
      await backend.deleteCoupon(code);
      toast.success("Coupon deleted");
      void loadCoupons();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete coupon");
    } finally {
      setDeletingCode(null);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingCode(coupon.code);
    try {
      await backend.updateCoupon(coupon.code, coupon.discountType, coupon.discountValue, coupon.maxUses, !coupon.isActive);
      toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
      void loadCoupons();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle coupon");
    } finally {
      setTogglingCode(null);
    }
  };

  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue.toString()}% off`;
    }
    return `£${(Number(coupon.discountValue) / 100).toFixed(2)} off`;
  };

  const inputStyle = { background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body font-bold text-foreground">{coupons.length} Coupons</h3>
        <Button
          size="sm"
          className="btn-gradient text-white font-body font-semibold"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Coupon
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="font-body max-w-lg" style={{ background: "oklch(0.13 0.05 285)", border: "1px solid oklch(0.3 0.08 285)" }}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
              <Tag className="w-5 h-5" style={{ color: "oklch(0.62 0.27 355)" }} />
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Coupon Code *">
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE10"
                disabled={!!editingCoupon}
                style={editingCoupon ? { ...inputStyle, opacity: 0.6 } : inputStyle}
                className="uppercase font-mono tracking-widest"
              />
              {!editingCoupon && (
                <p className="text-foreground/40 font-body text-xs mt-1">Code will be uppercased automatically</p>
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Discount Type *">
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm((p) => ({ ...p, discountType: v, discountValue: "" }))}
                >
                  <SelectTrigger style={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "oklch(0.15 0.05 285)" }}>
                    <SelectItem value="percentage">Percentage Off (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off (£)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={`Value (${form.discountType === "percentage" ? "%" : "£"}) *`}>
                <Input
                  type="number"
                  min="0"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  step={form.discountType === "percentage" ? "1" : "0.01"}
                  value={form.discountValue}
                  onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                  placeholder={form.discountType === "percentage" ? "e.g. 10" : "e.g. 5.00"}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Max Uses (leave blank for unlimited)">
              <Input
                type="number"
                min="0"
                step="1"
                value={form.maxUses}
                onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                placeholder="Unlimited"
                style={inputStyle}
              />
            </FormField>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
              <span className="font-body text-sm text-foreground/70">
                {form.isActive ? "Active (customers can use this coupon)" : "Inactive (coupon disabled)"}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={resetForm} className="font-body text-foreground/60">Cancel</Button>
            <Button className="btn-gradient text-white font-body font-semibold" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                : <><Save className="w-4 h-4 mr-2" />Save Coupon</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {(["a", "b", "c"] as const).map((sk) => (
            <Skeleton key={sk} className="h-16 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-body text-foreground/50 mb-4">No coupons yet</p>
          <Button className="btn-gradient text-white font-body font-semibold" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Create First Coupon
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div key={coupon.code} className="glass-card p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.62 0.27 355 / 0.12)", border: "1px solid oklch(0.62 0.27 355 / 0.3)" }}
              >
                <Tag className="w-4 h-4" style={{ color: "oklch(0.62 0.27 355)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono font-bold text-sm text-foreground tracking-wider">{coupon.code}</span>
                  <Badge
                    className="font-body text-xs px-1.5 py-0.5"
                    style={{
                      background: coupon.isActive ? "oklch(0.55 0.2 145 / 0.15)" : "oklch(0.2 0.04 285 / 0.4)",
                      color: coupon.isActive ? "oklch(0.65 0.2 145)" : "oklch(0.5 0.04 285)",
                      border: `1px solid ${coupon.isActive ? "oklch(0.55 0.2 145 / 0.4)" : "oklch(0.3 0.04 285)"}`,
                    }}
                  >
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs font-body text-foreground/50">
                  <span style={{ color: "oklch(0.85 0.19 85)" }}>{formatCouponValue(coupon)}</span>
                  <span>
                    Used: {coupon.usedCount.toString()}{coupon.maxUses > 0n ? ` / ${coupon.maxUses.toString()}` : " (unlimited)"}
                  </span>
                  <span>{coupon.discountType === "percentage" ? "Percentage" : "Fixed Amount"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle active */}
                <button
                  type="button"
                  onClick={() => void handleToggleActive(coupon)}
                  disabled={togglingCode === coupon.code}
                  className="p-2 rounded-lg hover:bg-muted/40 transition-colors"
                  style={{ color: coupon.isActive ? "oklch(0.65 0.2 145)" : "oklch(0.5 0.04 285)" }}
                  title={coupon.isActive ? "Deactivate" : "Activate"}
                >
                  {togglingCode === coupon.code
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : coupon.isActive
                      ? <ToggleRight className="w-4 h-4" />
                      : <ToggleLeft className="w-4 h-4" />
                  }
                </button>
                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEdit(coupon)}
                  className="p-2 rounded-lg hover:bg-muted/40 transition-colors"
                  style={{ color: "oklch(0.62 0.27 355)" }}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => void handleDelete(coupon.code)}
                  disabled={deletingCode === coupon.code}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  style={{ color: "oklch(0.7 0.25 25)" }}
                  title="Delete"
                >
                  {deletingCode === coupon.code
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Ads Tab ----
interface AdFormData {
  adType: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

function AdsTab({ backend, onAdsChanged, preFillData, onPreFillConsumed }: {
  backend: AdminPageProps["backend"];
  onAdsChanged?: () => void;
  preFillData?: PreFillAdData | null;
  onPreFillConsumed?: () => void;
}) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [togglingId, setTogglingId] = useState<bigint | null>(null);
  const [form, setForm] = useState<AdFormData>({
    adType: "text", title: "", description: "", imageUrl: "", linkUrl: "", isActive: true,
  });

  // Consume pre-fill data when provided (e.g. from promotion request)
  useEffect(() => {
    if (preFillData) {
      setForm({
        adType: preFillData.adType,
        title: preFillData.title,
        description: preFillData.description,
        imageUrl: preFillData.imageUrl,
        linkUrl: preFillData.linkUrl,
        isActive: true,
      });
      setEditingAd(null);
      setShowForm(true);
      onPreFillConsumed?.();
    }
  }, [preFillData, onPreFillConsumed]);

  const loadAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await backend.listAllAds();
      setAds(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ads");
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  useEffect(() => { void loadAds(); }, [loadAds]);

  const resetForm = () => {
    setForm({ adType: "text", title: "", description: "", imageUrl: "", linkUrl: "", isActive: true });
    setEditingAd(null);
    setShowForm(false);
  };

  const openEdit = (ad: Ad) => {
    setForm({
      adType: ad.adType,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      isActive: ad.isActive,
    });
    setEditingAd(ad);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Ad title is required"); return; }
    if (form.adType === "image" && !form.imageUrl.trim()) { toast.error("Image URL is required for image ads"); return; }

    setIsSaving(true);
    try {
      if (editingAd) {
        await backend.updateAd(editingAd.id, form.adType, form.title.trim(), form.description.trim(), form.imageUrl.trim(), form.linkUrl.trim(), form.isActive);
        toast.success("Ad updated!");
      } else {
        await backend.createAd(form.adType, form.title.trim(), form.description.trim(), form.imageUrl.trim(), form.linkUrl.trim());
        toast.success("Ad created!");
      }
      resetForm();
      void loadAds();
      onAdsChanged?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save ad");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    setDeletingId(id);
    try {
      await backend.deleteAd(id);
      toast.success("Ad deleted");
      void loadAds();
      onAdsChanged?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete ad");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (ad: Ad) => {
    setTogglingId(ad.id);
    try {
      await backend.updateAd(ad.id, ad.adType, ad.title, ad.description, ad.imageUrl, ad.linkUrl, !ad.isActive);
      toast.success(ad.isActive ? "Ad deactivated" : "Ad activated");
      void loadAds();
      onAdsChanged?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle ad");
    } finally {
      setTogglingId(null);
    }
  };

  const inputStyle = { background: "oklch(0.15 0.05 285)", borderColor: "oklch(0.3 0.08 285)", color: "white" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body font-bold text-foreground">{ads.length} Ads</h3>
        <Button
          size="sm"
          className="btn-gradient text-white font-body font-semibold"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Ad
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="font-body max-w-lg" style={{ background: "oklch(0.13 0.05 285)", border: "1px solid oklch(0.3 0.08 285)" }}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
              <Megaphone className="w-5 h-5" style={{ color: "oklch(0.7 0.22 45)" }} />
              {editingAd ? "Edit Ad" : "Create Ad"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Ad Type *">
              <Select value={form.adType} onValueChange={(v) => setForm((p) => ({ ...p, adType: v, imageUrl: "" }))}>
                <SelectTrigger style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "oklch(0.15 0.05 285)" }}>
                  <SelectItem value="text">
                    <span className="flex items-center gap-2"><AlignLeft className="w-4 h-4" /> Text Ad</span>
                  </SelectItem>
                  <SelectItem value="image">
                    <span className="flex items-center gap-2"><Image className="w-4 h-4" /> Image Ad</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Title *">
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ad headline..." style={inputStyle} />
            </FormField>

            <FormField label="Description">
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ad description or body text..." className="resize-none" rows={3} style={inputStyle} />
            </FormField>

            {form.adType === "image" && (
              <FormField label="Image URL *">
                <Input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://example.com/banner.jpg" style={inputStyle} />
              </FormField>
            )}

            <FormField label="Link URL (optional)">
              <Input value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
            </FormField>

            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
              <span className="font-body text-sm text-foreground/70">
                {form.isActive ? "Active (showing on store)" : "Inactive (hidden from store)"}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={resetForm} className="font-body text-foreground/60">Cancel</Button>
            <Button className="btn-gradient text-white font-body font-semibold" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                : <><Save className="w-4 h-4 mr-2" />Save Ad</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {(["a", "b", "c"] as const).map((sk) => (
            <Skeleton key={sk} className="h-16 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-body text-foreground/50 mb-4">No ads yet</p>
          <Button className="btn-gradient text-white font-body font-semibold" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Create First Ad
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id.toString()} className="glass-card p-4 flex items-start gap-3">
              {/* Type icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: ad.adType === "image" ? "oklch(0.55 0.2 240 / 0.15)" : "oklch(0.7 0.22 45 / 0.15)",
                  border: `1px solid ${ad.adType === "image" ? "oklch(0.55 0.2 240 / 0.35)" : "oklch(0.7 0.22 45 / 0.35)"}`,
                }}
              >
                {ad.adType === "image"
                  ? <Image className="w-4 h-4" style={{ color: "oklch(0.65 0.2 240)" }} />
                  : <AlignLeft className="w-4 h-4" style={{ color: "oklch(0.7 0.22 45)" }} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-body font-semibold text-foreground text-sm truncate">{ad.title}</span>
                  <Badge
                    className="font-body text-xs px-1.5 py-0.5"
                    style={{
                      background: ad.adType === "image" ? "oklch(0.55 0.2 240 / 0.15)" : "oklch(0.7 0.22 45 / 0.15)",
                      color: ad.adType === "image" ? "oklch(0.65 0.2 240)" : "oklch(0.7 0.22 45)",
                      border: `1px solid ${ad.adType === "image" ? "oklch(0.55 0.2 240 / 0.35)" : "oklch(0.7 0.22 45 / 0.35)"}`,
                    }}
                  >
                    {ad.adType === "image" ? "Image" : "Text"}
                  </Badge>
                  <Badge
                    className="font-body text-xs px-1.5 py-0.5"
                    style={{
                      background: ad.isActive ? "oklch(0.55 0.2 145 / 0.15)" : "oklch(0.2 0.04 285 / 0.4)",
                      color: ad.isActive ? "oklch(0.65 0.2 145)" : "oklch(0.5 0.04 285)",
                      border: `1px solid ${ad.isActive ? "oklch(0.55 0.2 145 / 0.4)" : "oklch(0.3 0.04 285)"}`,
                    }}
                  >
                    {ad.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {ad.description && (
                  <p className="text-foreground/50 font-body text-xs truncate">{ad.description}</p>
                )}
                {ad.linkUrl && (
                  <p className="text-foreground/30 font-body text-xs flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3" />
                    {ad.linkUrl}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => void handleToggle(ad)}
                  disabled={togglingId === ad.id}
                  className="p-2 rounded-lg hover:bg-muted/40 transition-colors"
                  style={{ color: ad.isActive ? "oklch(0.65 0.2 145)" : "oklch(0.5 0.04 285)" }}
                  title={ad.isActive ? "Deactivate" : "Activate"}
                >
                  {togglingId === ad.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : ad.isActive
                      ? <ToggleRight className="w-4 h-4" />
                      : <ToggleLeft className="w-4 h-4" />
                  }
                </button>
                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEdit(ad)}
                  className="p-2 rounded-lg hover:bg-muted/40 transition-colors"
                  style={{ color: "oklch(0.62 0.27 355)" }}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => void handleDelete(ad.id)}
                  disabled={deletingId === ad.id}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  style={{ color: "oklch(0.7 0.25 25)" }}
                  title="Delete"
                >
                  {deletingId === ad.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Memberships Tab ----
function formatDateFromNano(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function MembershipsTab({ backend }: { backend: AdminPageProps["backend"] }) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    backend.listAllMemberships()
      .then((data) => setMemberships(data.sort((a, b) => Number(b.purchasedAt - a.purchasedAt))))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load memberships");
      })
      .finally(() => setIsLoading(false));
  }, [backend]);

  const nowNano = BigInt(Date.now()) * 1_000_000n;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {(["a", "b", "c"] as const).map((sk) => (
          <Skeleton key={sk} className="h-16 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />
        ))}
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-body text-foreground/50">No memberships yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {memberships.map((m) => {
        const isActive = m.expiresAt > nowNano;
        return (
          <div key={m.membershipId.toString()} className="glass-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-body font-semibold text-foreground text-sm">{m.customerUsername}</span>
                  <Badge
                    className="font-body text-xs px-1.5 py-0.5"
                    style={{
                      background: isActive ? "oklch(0.55 0.2 145 / 0.15)" : "oklch(0.2 0.04 285 / 0.4)",
                      color: isActive ? "oklch(0.65 0.2 145)" : "oklch(0.5 0.04 285)",
                      border: `1px solid ${isActive ? "oklch(0.55 0.2 145 / 0.4)" : "oklch(0.3 0.04 285)"}`,
                    }}
                  >
                    {isActive ? "Active" : "Expired"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs font-body text-foreground/50">
                  <span>Purchased: {formatDateFromNano(m.purchasedAt)}</span>
                  <span style={{ color: isActive ? "oklch(0.65 0.2 145)" : "oklch(0.7 0.25 25)" }}>
                    Expires: {formatDateFromNano(m.expiresAt)}
                  </span>
                  <span>💳 {m.paymentMethod}</span>
                  <span className="font-mono text-foreground/40 max-w-32 truncate" title={m.paymentReference}>
                    Ref: {m.paymentReference}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Promotion Requests Tab ----
interface PreFillAdData {
  adType: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

function PromotionRequestsTab({
  backend,
  onPreFillAd,
}: {
  backend: AdminPageProps["backend"];
  onPreFillAd: (data: PreFillAdData) => void;
}) {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<bigint | null>(null);
  const [copiedId, setCopiedId] = useState<bigint | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await backend.listAllPromotionRequests();
      setRequests(data.sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load promotion requests");
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const handleUpdateStatus = async (id: bigint, status: string) => {
    setUpdatingId(id);
    try {
      await backend.updatePromotionRequestStatus(id, status);
      toast.success(`Request ${status}`);
      void loadRequests();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update request status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateAdFromPromotion = async (req: PromotionRequest) => {
    // Copy details to clipboard
    const text = `Type: ${req.promotionType}\nLink: ${req.link}\nDescription: ${req.description}${req.imageUrl ? `\nImage: ${req.imageUrl}` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Pre-fill the ads form
    const adData: PreFillAdData = {
      adType: req.imageUrl ? "image" : "text",
      title: req.link,
      description: req.description,
      imageUrl: req.imageUrl,
      linkUrl: req.link,
    };
    onPreFillAd(adData);
    toast.success("Ad form pre-filled! Go to Ads section to publish.");
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {(["a", "b", "c"] as const).map((sk) => (
          <Skeleton key={sk} className="h-24 w-full" style={{ background: "oklch(0.18 0.04 285)" }} />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-body text-foreground/50">No promotion requests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const isPending = req.status.toLowerCase() === "pending";
        const isYoutube = req.promotionType.toLowerCase() === "youtube";
        return (
          <div key={req.id.toString()} className="glass-card p-4">
            <div className="flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Type badge */}
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-xs font-semibold"
                    style={isYoutube
                      ? { background: "oklch(0.65 0.25 25 / 0.15)", color: "oklch(0.75 0.22 25)", border: "1px solid oklch(0.65 0.25 25 / 0.4)" }
                      : { background: "oklch(0.55 0.2 240 / 0.15)", color: "oklch(0.7 0.18 240)", border: "1px solid oklch(0.55 0.2 240 / 0.4)" }
                    }
                  >
                    {isYoutube
                      ? <Youtube className="w-3 h-3" />
                      : <Building2 className="w-3 h-3" />
                    }
                    {isYoutube ? "YouTube" : "Business"}
                  </span>
                  {/* Status badge */}
                  <StatusBadge status={req.status} />
                  {/* Submitter */}
                  <span className="font-body text-xs text-foreground/50">👤 {req.submitterUsername}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => void handleUpdateStatus(req.id, "accepted")}
                        disabled={updatingId === req.id}
                        className="font-body font-semibold text-white text-xs"
                        style={{ background: "oklch(0.55 0.2 145)", boxShadow: "none" }}
                      >
                        {updatingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span className="ml-1">Accept</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleUpdateStatus(req.id, "declined")}
                        disabled={updatingId === req.id}
                        className="font-body font-semibold text-white text-xs"
                        style={{ background: "oklch(0.65 0.25 25)", boxShadow: "none" }}
                      >
                        {updatingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        <span className="ml-1">Decline</span>
                      </Button>
                    </>
                  )}
                  {/* Create Ad from Promotion */}
                  <Button
                    size="sm"
                    onClick={() => void handleCreateAdFromPromotion(req)}
                    className="font-body font-semibold text-white text-xs"
                    style={{
                      background: copiedId === req.id
                        ? "oklch(0.55 0.2 145 / 0.8)"
                        : "linear-gradient(135deg, oklch(0.62 0.27 355 / 0.8), oklch(0.55 0.2 285 / 0.8))",
                      boxShadow: "none",
                    }}
                  >
                    {copiedId === req.id
                      ? <><ClipboardCheck className="w-3.5 h-3.5" /><span className="ml-1">Copied!</span></>
                      : <><Copy className="w-3.5 h-3.5" /><span className="ml-1">Create Ad</span></>
                    }
                  </Button>
                </div>
              </div>

              {/* Link */}
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.62 0.27 355 / 0.6)" }} />
                <a
                  href={req.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-xs hover:underline truncate max-w-sm"
                  style={{ color: "oklch(0.7 0.18 240)" }}
                >
                  {req.link}
                </a>
              </div>

              {/* Description */}
              <p className="text-foreground/60 font-body text-sm leading-relaxed">{req.description}</p>

              {/* Image (if any) */}
              {req.imageUrl && (
                <div className="flex items-center gap-3">
                  <img
                    src={req.imageUrl}
                    alt="Promotion"
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                    style={{ border: "1px solid oklch(0.3 0.08 285)" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="font-body text-xs text-foreground/40 truncate">{req.imageUrl}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Helper ----
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-sm text-foreground/60">{label}</Label>
      {children}
    </div>
  );
}

// ---- Main AdminPage ----
export function AdminPage({ onNavigate, backend, onAdsChanged }: AdminPageProps) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [adPreFillData, setAdPreFillData] = useState<PreFillAdData | null>(null);

  const handlePinSuccess = () => {
    setIsAuthed(true);
  };

  const handlePreFillAd = (data: PreFillAdData) => {
    setAdPreFillData(data);
    setActiveTab("ads");
  };

  if (!isAuthed) {
    return <PinGate onSuccess={handlePinSuccess} onCancel={() => onNavigate("store")} />;
  }

  const TAB_CONFIG: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
    { id: "subscriptions", label: "Subs", icon: <ChevronRight className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" /> },
    { id: "coupons", label: "Coupons", icon: <Tag className="w-4 h-4" /> },
    { id: "ads", label: "Ads", icon: <Megaphone className="w-4 h-4" /> },
    { id: "memberships", label: "Members", icon: <Users className="w-4 h-4" /> },
    { id: "promotions", label: "Promos", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div
          className="flex items-center justify-between mb-8"
          style={{ animation: "fade-in-up 0.4s ease-out both" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.62 0.27 355 / 0.2)", border: "1px solid oklch(0.62 0.27 355 / 0.4)" }}
            >
              <ShieldCheck className="w-5 h-5" style={{ color: "oklch(0.62 0.27 355)" }} />
            </div>
            <div>
              <h1 className="font-display text-3xl text-white" style={{ textShadow: "0 0 15px oklch(0.62 0.27 355 / 0.4)" }}>
                Admin Panel
              </h1>
              <p className="text-foreground/40 font-body text-xs">Game Vault Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("store")}
            className="flex items-center gap-1.5 text-foreground/50 hover:text-foreground font-body text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Store
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)} style={{ animation: "fade-in-up 0.4s 0.1s ease-out both" }}>
          <TabsList
            className="w-full mb-6 h-auto flex-wrap gap-1 p-1 font-body"
            style={{ background: "oklch(0.12 0.04 285)" }}
          >
            {TAB_CONFIG.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 min-w-fit font-body flex items-center gap-1.5 data-[state=active]:text-foreground"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="glass-card p-5">
            <TabsContent value="orders">
              <OrdersTab backend={backend} />
            </TabsContent>
            <TabsContent value="products">
              <ProductsTab backend={backend} />
            </TabsContent>
            <TabsContent value="subscriptions">
              <SubscriptionsTab backend={backend} />
            </TabsContent>
            <TabsContent value="payments">
              <PaymentSettingsTab backend={backend} />
            </TabsContent>
            <TabsContent value="coupons">
              <CouponsTab backend={backend} />
            </TabsContent>
            <TabsContent value="ads">
              <AdsTab
                backend={backend}
                onAdsChanged={onAdsChanged}
                preFillData={adPreFillData}
                onPreFillConsumed={() => setAdPreFillData(null)}
              />
            </TabsContent>
            <TabsContent value="memberships">
              <MembershipsTab backend={backend} />
            </TabsContent>
            <TabsContent value="promotions">
              <PromotionRequestsTab backend={backend} onPreFillAd={handlePreFillAd} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
