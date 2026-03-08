import type {
  Ad,
  Membership,
  Order,
  PaymentSettings,
  Product,
  UserProfile,
} from "@/backend.d";
import { AdminPage } from "@/components/AdminPage";
import { AuthPage } from "@/components/AuthPage";
import { BasketPage } from "@/components/BasketPage";
import { CheckoutPage } from "@/components/CheckoutPage";
import { DashboardPage } from "@/components/DashboardPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navbar } from "@/components/Navbar";
import { ProductDetailPage } from "@/components/ProductDetailPage";
import { StorePage } from "@/components/StorePage";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import type { BasketItem, Page } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export default function App() {
  const { actor } = useActor();
  const { clear: clearIdentity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [showLoading, setShowLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("store");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ---- Queries ----
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<
    Product[]
  >({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listAvailableProducts();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    retry: 1,
    staleTime: 30_000,
  });

  const { data: packages = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listActivePackages();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    retry: 1,
    staleTime: 30_000,
  });

  const { data: paymentSettings = null } = useQuery<PaymentSettings | null>({
    queryKey: ["paymentSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPaymentSettings();
    },
    enabled: !!actor,
    retry: false,
  });

  // Active ads (shown to non-members)
  const { data: activeAds = [] } = useQuery<Ad[]>({
    queryKey: ["activeAds"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listActiveAds();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    retry: 1,
  });

  // Membership status (only when user is logged in)
  const { data: hasActiveMembership = false, refetch: refetchMembership } =
    useQuery<boolean>({
      queryKey: ["activeMembership", userProfile?.username],
      queryFn: async () => {
        if (!actor || !userProfile) return false;
        try {
          return await actor.checkActiveMembership(userProfile.username);
        } catch {
          return false;
        }
      },
      enabled: !!actor && !!userProfile,
      retry: false,
    });

  const { data: membershipStatus = null, refetch: refetchMembershipStatus } =
    useQuery<Membership | null>({
      queryKey: ["membershipStatus", userProfile?.username],
      queryFn: async () => {
        if (!actor || !userProfile) return null;
        try {
          return await actor.getMembershipStatus(userProfile.username);
        } catch {
          return null;
        }
      },
      enabled: !!actor && !!userProfile,
      retry: false,
    });

  // ---- Navigation ----
  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAdminNavigate = useCallback(
    (page: string) => {
      navigate(page as Page);
    },
    [navigate],
  );

  // ---- Basket handlers ----
  const addToBasket = useCallback((item: Omit<BasketItem, "quantity">) => {
    setBasket((prev) => {
      const existing = prev.find((b) => b.id === item.id);
      if (existing) {
        return prev.map((b) =>
          b.id === item.id ? { ...b, quantity: b.quantity + 1 } : b,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromBasket = useCallback((id: bigint) => {
    setBasket((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateQuantity = useCallback((id: bigint, qty: number) => {
    if (qty < 1) return;
    setBasket((prev) =>
      prev.map((b) => (b.id === id ? { ...b, quantity: qty } : b)),
    );
  }, []);

  const clearBasket = useCallback(() => {
    setBasket([]);
  }, []);

  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  // ---- Handlers ----
  const handleRegister = useCallback(
    async (username: string, email: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.registerUser(username, email);
      await actor.saveCallerUserProfile({ username, email });
    },
    [actor],
  );

  const handleLoginLookup =
    useCallback(async (): Promise<UserProfile | null> => {
      if (!actor) throw new Error("Not connected");
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    }, [actor]);

  const handleLogout = useCallback(() => {
    setUserProfile(null);
    clearIdentity();
  }, [clearIdentity]);

  const handlePlaceOrder = useCallback(
    async (
      itemName: string,
      price: bigint,
      paymentMethod: string,
      paymentReference: string,
      couponCode: string | null,
      deliveryEmail: string,
    ): Promise<bigint> => {
      if (!actor) throw new Error("Not connected");
      if (!userProfile) throw new Error("Not logged in");
      return actor.placeOrder(
        userProfile.username,
        itemName,
        price,
        paymentMethod,
        paymentReference,
        couponCode,
        deliveryEmail,
      );
    },
    [actor, userProfile],
  );

  const handleUpdateEmail = useCallback(
    async (newEmail: string) => {
      if (!actor || !userProfile) return;
      const updated = { ...userProfile, email: newEmail };
      await actor.saveCallerUserProfile(updated);
      setUserProfile(updated);
    },
    [actor, userProfile],
  );

  const handleLoadOrders = useCallback(
    async (username: string): Promise<Order[]> => {
      if (!actor) return [];
      try {
        return await actor.getCustomerOrders(username);
      } catch {
        return [];
      }
    },
    [actor],
  );

  const handlePurchaseMembership = useCallback(
    async (
      paymentMethod: string,
      paymentReference: string,
    ): Promise<bigint> => {
      if (!actor) throw new Error("Not connected");
      if (!userProfile) throw new Error("Not logged in");
      const id = await actor.purchaseMembership(
        userProfile.username,
        paymentMethod,
        paymentReference,
      );
      // Invalidate membership queries so status refreshes
      void queryClient.invalidateQueries({
        queryKey: ["activeMembership", userProfile.username],
      });
      void queryClient.invalidateQueries({
        queryKey: ["membershipStatus", userProfile.username],
      });
      void refetchMembership();
      void refetchMembershipStatus();
      return id;
    },
    [
      actor,
      userProfile,
      queryClient,
      refetchMembership,
      refetchMembershipStatus,
    ],
  );

  // Backend object for admin panel — memoised on actor to prevent infinite re-render loops
  // in AdminPage sub-tabs whose useCallbacks depend on this object.
  const adminBackend = useMemo(
    () => ({
      isCallerAdmin: () =>
        actor ? actor.isCallerAdmin() : Promise.resolve(false),
      listAvailableProducts: () =>
        actor ? actor.listAvailableProducts() : Promise.resolve([]),
      createProduct: (
        name: string,
        desc: string,
        price: bigint,
        cat: string,
        imageUrl: string,
      ) =>
        actor
          ? actor.createProduct(name, desc, price, cat, imageUrl)
          : Promise.resolve(BigInt(0)),
      updateProduct: (
        id: bigint,
        name: string,
        desc: string,
        price: bigint,
        cat: string,
        imageUrl: string,
        avail: boolean,
      ) =>
        actor
          ? actor.updateProduct(id, name, desc, price, cat, imageUrl, avail)
          : Promise.resolve(),
      deleteProduct: (id: bigint) =>
        actor ? actor.deleteProduct(id) : Promise.resolve(),
      listActivePackages: () =>
        actor ? actor.listActivePackages() : Promise.resolve([]),
      createPackage: (
        name: string,
        desc: string,
        price: bigint,
        features: string[],
      ) =>
        actor
          ? actor.createPackage(name, desc, price, features)
          : Promise.resolve(BigInt(0)),
      updatePackage: (
        id: bigint,
        name: string,
        desc: string,
        price: bigint,
        features: string[],
        active: boolean,
      ) =>
        actor
          ? actor.updatePackage(id, name, desc, price, features, active)
          : Promise.resolve(),
      deletePackage: (id: bigint) =>
        actor ? actor.deletePackage(id) : Promise.resolve(),
      listAllOrders: () =>
        actor ? actor.listAllOrders() : Promise.resolve([]),
      updateOrderStatus: (username: string, orderId: bigint, status: string) =>
        actor
          ? actor.updateOrderStatus(username, orderId, status)
          : Promise.resolve(),
      getPaymentSettings: () =>
        actor ? actor.getPaymentSettings() : Promise.resolve(null),
      savePaymentSettings: (settings: PaymentSettings) =>
        actor ? actor.savePaymentSettings(settings) : Promise.resolve(),
      listAllCoupons: () =>
        actor ? actor.listAllCoupons() : Promise.resolve([]),
      createCoupon: (
        code: string,
        type: string,
        value: bigint,
        maxUses: bigint,
        isActive: boolean,
      ) =>
        actor
          ? actor.createCoupon(code, type, value, maxUses, isActive)
          : Promise.resolve(),
      updateCoupon: (
        code: string,
        type: string,
        value: bigint,
        maxUses: bigint,
        isActive: boolean,
      ) =>
        actor
          ? actor.updateCoupon(code, type, value, maxUses, isActive)
          : Promise.resolve(),
      deleteCoupon: (code: string) =>
        actor ? actor.deleteCoupon(code) : Promise.resolve(),
      attachFileToProduct: (
        productId: bigint,
        fileName: string,
        fileType: string,
        fileData: Uint8Array,
      ) =>
        actor
          ? actor.attachFileToProduct(productId, fileName, fileType, fileData)
          : Promise.resolve(BigInt(0)),
      removeFileFromProduct: (productId: bigint, fileId: bigint) =>
        actor
          ? actor.removeFileFromProduct(productId, fileId)
          : Promise.resolve(),
      listProductFilesAdmin: (productId: bigint) =>
        actor ? actor.listProductFilesAdmin(productId) : Promise.resolve([]),
      // Ads
      listAllAds: () => (actor ? actor.listAllAds() : Promise.resolve([])),
      createAd: (
        adType: string,
        title: string,
        desc: string,
        imageUrl: string,
        linkUrl: string,
      ) =>
        actor
          ? actor.createAd(adType, title, desc, imageUrl, linkUrl)
          : Promise.resolve(BigInt(0)),
      updateAd: (
        id: bigint,
        adType: string,
        title: string,
        desc: string,
        imageUrl: string,
        linkUrl: string,
        isActive: boolean,
      ) =>
        actor
          ? actor.updateAd(id, adType, title, desc, imageUrl, linkUrl, isActive)
          : Promise.resolve(),
      deleteAd: (id: bigint) =>
        actor ? actor.deleteAd(id) : Promise.resolve(),
      // Memberships
      listAllMemberships: () =>
        actor ? actor.listAllMemberships() : Promise.resolve([]),
      // Promotions
      listAllPromotionRequests: () =>
        actor ? actor.listAllPromotionRequests() : Promise.resolve([]),
      updatePromotionRequestStatus: (id: bigint, status: string) =>
        actor
          ? actor.updatePromotionRequestStatus(id, status)
          : Promise.resolve(),
    }),
    [actor],
  );

  const handleSubmitPromotion = useCallback(
    async (
      submitterUsername: string,
      promotionType: string,
      link: string,
      description: string,
      imageUrl: string,
    ): Promise<bigint> => {
      if (!actor) throw new Error("Not connected");
      return actor.submitPromotionRequest(
        submitterUsername,
        promotionType,
        link,
        description,
        imageUrl,
      );
    },
    [actor],
  );

  const handleListProductFiles = useCallback(
    (productId: bigint) =>
      actor ? actor.listProductFiles(productId) : Promise.resolve([]),
    [actor],
  );

  const handleListFilesByName = useCallback(
    (productName: string) =>
      actor ? actor.listProductFilesByName(productName) : Promise.resolve([]),
    [actor],
  );

  const handleDownloadFile = useCallback(
    (fileId: bigint) =>
      actor
        ? actor.downloadProductFile(fileId)
        : Promise.resolve(new Uint8Array()),
    [actor],
  );

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
            background:
              "radial-gradient(ellipse at top, oklch(0.14 0.08 285) 0%, oklch(0.09 0.04 285) 60%)",
          }}
        >
          <AdminPage
            onNavigate={(page) => {
              setShowAdminPinModal(false);
              handleAdminNavigate(page);
            }}
            backend={adminBackend}
            onAdsChanged={() => {
              void queryClient.invalidateQueries({ queryKey: ["activeAds"] });
            }}
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
          background:
            "radial-gradient(ellipse at top, oklch(0.14 0.08 285) 0%, oklch(0.09 0.04 285) 60%)",
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
          basketCount={basketCount}
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
              onSelectCheckoutItem={(item) => {
                setBasket([{ ...item, quantity: 1 }]);
                navigate("checkout");
              }}
              onAddToBasket={addToBasket}
              userProfile={userProfile}
              activeAds={activeAds}
              hasActiveMembership={hasActiveMembership}
              membershipStatus={membershipStatus}
              paymentSettings={paymentSettings}
              onPurchaseMembership={handlePurchaseMembership}
              onSubmitPromotion={handleSubmitPromotion}
            />
          )}

          {/* Product detail */}
          {currentPage === "product-detail" && selectedProduct && (
            <ProductDetailPage
              product={selectedProduct}
              onNavigate={navigate}
              onSelectCheckoutItem={(item) => {
                setBasket([{ ...item, quantity: 1 }]);
                navigate("checkout");
              }}
              onAddToBasket={addToBasket}
              userProfile={userProfile}
            />
          )}

          {/* Basket */}
          {currentPage === "basket" && (
            <BasketPage
              basket={basket}
              onNavigate={navigate}
              onUpdateQuantity={updateQuantity}
              onRemoveFromBasket={removeFromBasket}
              onProceedToCheckout={() => navigate("checkout")}
              userProfile={userProfile}
            />
          )}

          {/* Checkout */}
          {currentPage === "checkout" && basket.length > 0 && (
            <CheckoutPage
              items={basket}
              paymentSettings={paymentSettings}
              onNavigate={navigate}
              onPlaceOrder={handlePlaceOrder}
              onClearBasket={clearBasket}
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
              onListFilesByName={handleListFilesByName}
              onDownloadFile={handleDownloadFile}
              products={products}
              membershipStatus={membershipStatus}
              hasActiveMembership={hasActiveMembership}
              paymentSettings={paymentSettings}
              onPurchaseMembership={handlePurchaseMembership}
            />
          )}

          {/* Redirect if trying to access dashboard without login */}
          {currentPage === "dashboard" && !userProfile && (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-foreground/60 font-body mb-4">
                  Please log in to view your account
                </p>
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

          {/* Redirect if checkout without items */}
          {currentPage === "checkout" && basket.length === 0 && (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-foreground/60 font-body mb-4">
                  Your basket is empty
                </p>
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
