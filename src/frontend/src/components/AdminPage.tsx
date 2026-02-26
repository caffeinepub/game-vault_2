import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, Shield, ShieldCheck, Package, ShoppingBag,
  CreditCard, Plus, Trash2, Edit, Check, X, ChevronRight,
  ArrowLeft, Save
} from "lucide-react";
import { toast } from "sonner";
import type { Product, Package as BackendPackage, Order, PaymentSettings } from "@/backend.d";

interface AdminPageProps {
  onNavigate: (page: string) => void;
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
  };
}

type AdminTab = "orders" | "products" | "subscriptions" | "payments";
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

function ProductsTab({ backend }: { backend: AdminPageProps["backend"] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
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
      } else {
        await backend.createProduct(form.name.trim(), form.description.trim(), price, form.category, form.imageUrl.trim());
        toast.success("Product created!");
      }
      resetForm();
      void loadProducts();
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
        <DialogContent className="font-body max-w-lg" style={{ background: "oklch(0.13 0.05 285)", border: "1px solid oklch(0.3 0.08 285)" }}>
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
export function AdminPage({ onNavigate, backend }: AdminPageProps) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  const handlePinSuccess = async () => {
    setIsCheckingAdmin(true);
    try {
      const isAdmin = await backend.isCallerAdmin();
      if (isAdmin) {
        setIsAuthed(true);
      } else {
        toast.error("Access Denied: Your identity does not have admin privileges.");
        setIsAuthed(false);
      }
    } catch {
      // If not logged in, still allow PIN-based access for now
      setIsAuthed(true);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  if (!isAuthed) {
    return (
      <>
        {isCheckingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "oklch(0.09 0.04 285 / 0.8)", backdropFilter: "blur(4px)" }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "oklch(0.62 0.27 355)" }} />
          </div>
        )}
        <PinGate onSuccess={handlePinSuccess} onCancel={() => onNavigate("store")} />
      </>
    );
  }

  const TAB_CONFIG: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
    { id: "subscriptions", label: "Subscriptions", icon: <ChevronRight className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" /> },
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
        <Tabs defaultValue="orders" style={{ animation: "fade-in-up 0.4s 0.1s ease-out both" }}>
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
          </div>
        </Tabs>
      </div>
    </div>
  );
}
