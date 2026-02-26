import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navbar } from "@/components/Navbar";
import { StorePage } from "@/components/StorePage";
import { ProductDetailPage } from "@/components/ProductDetailPage";
import { CheckoutPage } from "@/components/CheckoutPage";
import { AuthPage } from "@/components/AuthPage";
import { DashboardPage } from "@/components/DashboardPage";
import { AdminPage } from "@/components/AdminPage";
import { useQuery } from "@tanstack/react-query";
import type { Page, CheckoutItem } from "@/types";
import type { Product, UserProfile, PaymentSettings, Order } from "@/backend.d";

export default function App() {
  const { actor, isFetching: isActorFetching } = useActor();
  const { clear: clearIdentity } = useInternetIdentity();

  const [showLoading, setShowLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("store");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ---- Queries ----
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAvailableProducts();
    },
    enabled: !!actor && !isActorFetching,
  });

  const { data: packages = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listActivePackages();
    },
    enabled: !!actor && !isActorFetching,
  });

  const { data: paymentSettings = null } = useQuery<PaymentSettings | null>({
    queryKey: ["paymentSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPaymentSettings();
    },
    enabled: !!actor && !isActorFetching,
  });

  // ---- Navigation ----
  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAdminNavigate = useCallback((page: string) => {
    navigate(page as Page);
  }, [navigate]);

  // ---- Handlers ----
  const handleRegister = useCallback(async (username: string, email: string) => {
    if (!actor) throw new Error("Not connected");
    await actor.registerUser(username, email);
    await actor.saveCallerUserProfile({ username, email });
  }, [actor]);

  const handleLoginLookup = useCallback(async (): Promise<UserProfile | null> => {
    if (!actor) throw new Error("Not connected");
    return actor.getCallerUserProfile();
  }, [actor]);

  const handleLogout = useCallback(() => {
    setUserProfile(null);
    clearIdentity();
  }, [clearIdentity]);

  const handlePlaceOrder = useCallback(async (
    itemName: string,
    price: bigint,
    paymentMethod: string,
    paymentReference: string,
    couponCode: string | null,
    deliveryEmail: string
  ): Promise<bigint> => {
    if (!actor) throw new Error("Not connected");
    if (!userProfile) throw new Error("Not logged in");
    return actor.placeOrder(userProfile.username, itemName, price, paymentMethod, paymentReference, couponCode, deliveryEmail);
  }, [actor, userProfile]);

  const handleUpdateEmail = useCallback(async (newEmail: string) => {
    if (!actor || !userProfile) return;
    const updated = { ...userProfile, email: newEmail };
    await actor.saveCallerUserProfile(updated);
    setUserProfile(updated);
  }, [actor, userProfile]);

  const handleLoadOrders = useCallback(async (username: string): Promise<Order[]> => {
    if (!actor) return [];
    return actor.getCustomerOrders(username);
  }, [actor]);

  // Backend object for admin panel
  const adminBackend = {
    isCallerAdmin: () => actor ? actor.isCallerAdmin() : Promise.resolve(false),
    listAvailableProducts: () => actor ? actor.listAvailableProducts() : Promise.resolve([]),
    createProduct: (name: string, desc: string, price: bigint, cat: string, imageUrl: string) =>
      actor ? actor.createProduct(name, desc, price, cat, imageUrl) : Promise.resolve(BigInt(0)),
    updateProduct: (id: bigint, name: string, desc: string, price: bigint, cat: string, imageUrl: string, avail: boolean) =>
      actor ? actor.updateProduct(id, name, desc, price, cat, imageUrl, avail) : Promise.resolve(),
    deleteProduct: (id: bigint) => actor ? actor.deleteProduct(id) : Promise.resolve(),
    listActivePackages: () => actor ? actor.listActivePackages() : Promise.resolve([]),
    createPackage: (name: string, desc: string, price: bigint, features: string[]) =>
      actor ? actor.createPackage(name, desc, price, features) : Promise.resolve(BigInt(0)),
    updatePackage: (id: bigint, name: string, desc: string, price: bigint, features: string[], active: boolean) =>
      actor ? actor.updatePackage(id, name, desc, price, features, active) : Promise.resolve(),
    deletePackage: (id: bigint) => actor ? actor.deletePackage(id) : Promise.resolve(),
    listAllOrders: () => actor ? actor.listAllOrders() : Promise.resolve([]),
    updateOrderStatus: (username: string, orderId: bigint, status: string) =>
      actor ? actor.updateOrderStatus(username, orderId, status) : Promise.resolve(),
    getPaymentSettings: () => actor ? actor.getPaymentSettings() : Promise.resolve(null),
    savePaymentSettings: (settings: PaymentSettings) =>
      actor ? actor.savePaymentSettings(settings) : Promise.resolve(),
    listAllCoupons: () => actor ? actor.listAllCoupons() : Promise.resolve([]),
    createCoupon: (code: string, type: string, value: bigint, maxUses: bigint, isActive: boolean) =>
      actor ? actor.createCoupon(code, type, value, maxUses, isActive) : Promise.resolve(),
    updateCoupon: (code: string, type: string, value: bigint, maxUses: bigint, isActive: boolean) =>
      actor ? actor.updateCoupon(code, type, value, maxUses, isActive) : Promise.resolve(),
    deleteCoupon: (code: string) => actor ? actor.deleteCoupon(code) : Promise.resolve(),
    attachFileToProduct: (productId: bigint, fileName: string, fileType: string, fileData: Uint8Array) =>
      actor ? actor.attachFileToProduct(productId, fileName, fileType, fileData) : Promise.resolve(BigInt(0)),
    removeFileFromProduct: (productId: bigint, fileId: bigint) =>
      actor ? actor.removeFileFromProduct(productId, fileId) : Promise.resolve(),
    listProductFilesAdmin: (productId: bigint) =>
      actor ? actor.listProductFilesAdmin(productId) : Promise.resolve([]),
  };

  const handleListProductFiles = useCallback((productId: bigint) =>
    actor ? actor.listProductFiles(productId) : Promise.resolve([]),
  [actor]);

  const handleDownloadFile = useCallback((fileId: bigint) =>
    actor ? actor.downloadProductFile(fileId) : Promise.resolve(new Uint8Array()),
  [actor]);

  // ---- Loading screen ----
  if (showLoading) {
    return (
      <>
        <LoadingScreen onComplete={() => setShowLoading(false)} />
        <Toaster />
      </>
    );
  }

  // ---- Admin page (no navbar) ----
  if (currentPage === "admin" || showAdminPinModal) {
    return (
      <>
        <div
          className="min-h-screen"
          style={{
            background: "radial-gradient(ellipse at top, oklch(0.14 0.08 285) 0%, oklch(0.09 0.04 285) 60%)",
          }}
        >
          <AdminPage
            onNavigate={(page) => {
              setShowAdminPinModal(false);
              handleAdminNavigate(page);
            }}
            backend={adminBackend}
          />
        </div>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "radial-gradient(ellipse at top, oklch(0.14 0.08 285) 0%, oklch(0.09 0.04 285) 60%)",
        }}
      >
        <Navbar
          currentPage={currentPage}
          onNavigate={navigate}
          userProfile={userProfile}
          onAdminClick={() => navigate("admin")}
          onLogout={handleLogout}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen((v) => !v)}
        />

        <main className="flex-1">
          {/* Store page */}
          {currentPage === "store" && (
            <StorePage
              products={products}
              packages={packages}
              isLoadingProducts={isLoadingProducts}
              isLoadingPackages={isLoadingPackages}
              onNavigate={navigate}
              onSelectProduct={setSelectedProduct}
              onSelectCheckoutItem={setCheckoutItem}
              userProfile={userProfile}
            />
          )}

          {/* Product detail */}
          {currentPage === "product-detail" && selectedProduct && (
            <ProductDetailPage
              product={selectedProduct}
              onNavigate={navigate}
              onSelectCheckoutItem={setCheckoutItem}
              userProfile={userProfile}
            />
          )}

          {/* Checkout */}
          {currentPage === "checkout" && checkoutItem && (
            <CheckoutPage
              item={checkoutItem}
              paymentSettings={paymentSettings}
              onNavigate={navigate}
              onPlaceOrder={handlePlaceOrder}
              userProfile={userProfile}
            />
          )}

          {/* Auth */}
          {currentPage === "auth" && (
            <AuthPage
              onNavigate={navigate}
              onRegister={handleRegister}
              onLoginLookup={handleLoginLookup}
              onSetUserProfile={setUserProfile}
            />
          )}

          {/* Dashboard */}
          {currentPage === "dashboard" && userProfile && (
            <DashboardPage
              userProfile={userProfile}
              onNavigate={navigate}
              onLogout={handleLogout}
              onLoadOrders={handleLoadOrders}
              onUpdateEmail={handleUpdateEmail}
              onListProductFiles={handleListProductFiles}
              onDownloadFile={handleDownloadFile}
              products={products}
            />
          )}

          {/* Redirect if trying to access dashboard without login */}
          {currentPage === "dashboard" && !userProfile && (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-foreground/60 font-body mb-4">Please log in to view your account</p>
                <button
                  type="button"
                  className="btn-gradient text-white font-body font-semibold px-6 py-2 rounded-lg"
                  onClick={() => navigate("auth")}
                >
                  Login
                </button>
              </div>
            </div>
          )}

          {/* Redirect if checkout without item */}
          {currentPage === "checkout" && !checkoutItem && (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-foreground/60 font-body mb-4">No item selected for checkout</p>
                <button
                  type="button"
                  className="btn-gradient text-white font-body font-semibold px-6 py-2 rounded-lg"
                  onClick={() => navigate("store")}
                >
                  Browse Store
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      <Toaster />
    </>
  );
}
