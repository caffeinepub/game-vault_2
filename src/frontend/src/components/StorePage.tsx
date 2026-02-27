import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Gamepad2, Download, Star, ChevronRight, Zap, Car, Code, Search, X, Crown, ExternalLink, CheckCircle2, Loader2, Copy, ClipboardCheck } from "lucide-react";
import { SiPaypal, SiBitcoin, SiEthereum } from "react-icons/si";
import { toast } from "sonner";
import type { Page, CheckoutItem } from "@/types";
import type { Product, Package, Ad, Membership, PaymentSettings } from "@/backend.d";

interface StorePageProps {
  products: Product[];
  packages: Package[];
  isLoadingProducts: boolean;
  isLoadingPackages: boolean;
  onNavigate: (page: Page, data?: unknown) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCheckoutItem: (item: CheckoutItem) => void;
  userProfile: { username: string; email: string } | null;
  activeAds?: Ad[];
  hasActiveMembership?: boolean;
  membershipStatus?: Membership | null;
  paymentSettings?: PaymentSettings | null;
  onPurchaseMembership?: (paymentMethod: string, paymentRef: string) => Promise<bigint>;
}

function formatPrice(pricePence: bigint): string {
  const pounds = Number(pricePence) / 100;
  return `£${pounds.toFixed(2)}`;
}

function getCategoryIcon(category: string) {
  if (category === "download_file") return <Download className="w-3 h-3" />;
  if (category === "cpm_services") return <Car className="w-3 h-3" />;
  if (category === "cpm_lua_scripts") return <Code className="w-3 h-3" />;
  return <Gamepad2 className="w-3 h-3" />;
}

function getCategoryLabel(category: string) {
  if (category === "download_file") return "Download";
  if (category === "game_account") return "Game Account";
  if (category === "cpm_services") return "CPM Gg Services";
  if (category === "cpm_lua_scripts") return "CPM Gg Lua Scripts";
  return category;
}

export function StorePage({
  products,
  packages,
  isLoadingProducts,
  isLoadingPackages,
  onNavigate,
  onSelectProduct,
  onSelectCheckoutItem,
  userProfile,
  activeAds = [],
  hasActiveMembership = false,
  membershipStatus = null,
  paymentSettings = null,
  onPurchaseMembership,
}: StorePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());
  const [showMembershipCheckout, setShowMembershipCheckout] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const visibleAds = activeAds.filter((ad) => !dismissedAds.has(ad.id.toString()));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Ads banner — shown only to non-members */}
      {!hasActiveMembership && visibleAds.length > 0 && (
        <div
          className="w-full"
          style={{
            background: "oklch(0.11 0.04 285)",
            borderBottom: "1px solid oklch(0.7 0.22 45 / 0.2)",
          }}
        >
          {visibleAds.map((ad) => (
            <AdBanner
              key={ad.id.toString()}
              ad={ad}
              onDismiss={() => setDismissedAds((prev) => new Set([...prev, ad.id.toString()]))}
            />
          ))}
        </div>
      )}

      {/* Hero section */}
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(220px, 35vw, 420px)" }}>
        <img
          src="/assets/generated/hero-banner.dim_1200x400.jpg"
          alt="Game Vault Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, oklch(0.09 0.04 285 / 0.9) 0%, oklch(0.09 0.04 285 / 0.4) 60%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 sm:px-8">
            <div style={{ animation: "fade-in-up 0.7s 0.1s ease-out both" }}>
              <p
                className="text-xs font-body uppercase tracking-[0.3em] mb-2 font-semibold"
                style={{ color: "oklch(0.7 0.22 45)" }}
              >
                🎮 Digital Gaming Store
              </p>
              <h1
                className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight mb-4"
                style={{
                  color: "white",
                  textShadow: "0 0 30px oklch(0.62 0.27 355 / 0.6), 0 2px 8px rgba(0,0,0,0.8)",
                }}
              >
                Level Up Your
                <br />
                <span style={{ color: "oklch(0.7 0.22 45)", textShadow: "0 0 20px oklch(0.7 0.22 45 / 0.7)" }}>
                  Game Collection
                </span>
              </h1>
              <p className="text-foreground/70 font-body text-sm sm:text-base max-w-md">
                Premium digital game accounts & downloads. Instant access to your favourite titles.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Search bar */}
        <div className="flex justify-center mb-10">
          <div
            className="relative w-full max-w-lg"
            style={{ animation: "fade-in-up 0.5s 0.2s ease-out both" }}
          >
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "oklch(0.62 0.27 355 / 0.7)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-11 pr-10 py-3 rounded-xl font-body text-sm text-foreground placeholder:text-foreground/40 outline-none transition-all duration-200"
              style={{
                background: "oklch(0.14 0.05 285 / 0.85)",
                border: "1px solid oklch(0.62 0.27 355 / 0.2)",
                backdropFilter: "blur(12px)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid oklch(0.62 0.27 355 / 0.6)";
                e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.62 0.27 355 / 0.12), 0 0 20px oklch(0.62 0.27 355 / 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid oklch(0.62 0.27 355 / 0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-white/10"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-foreground/50" />
              </button>
            )}
          </div>
        </div>

        {/* No results message */}
        {searchQuery && filteredProducts.length === 0 && !isLoadingProducts && (
          <div
            className="glass-card p-12 text-center mb-16"
            style={{ animation: "fade-in 0.3s ease-out both" }}
          >
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-body font-bold text-foreground text-lg mb-2">
              No products found
            </h3>
            <p className="text-foreground/50 font-body text-sm">
              No products found for &ldquo;<span style={{ color: "oklch(0.7 0.22 45)" }}>{searchQuery}</span>&rdquo;
            </p>
          </div>
        )}

        {/* Products section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="font-display text-3xl sm:text-4xl"
                style={{ color: "white", textShadow: "0 0 15px oklch(0.62 0.27 355 / 0.5)" }}
              >
                Featured Products
              </h2>
              <p className="text-foreground/60 font-body text-sm mt-1">
                Game accounts & downloadable content
              </p>
            </div>
            <ShoppingBag className="w-8 h-8 opacity-30" style={{ color: "oklch(0.62 0.27 355)" }} />
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(["a", "b", "c", "d", "e", "f"] as const).map((sk) => (
                <div key={`skel-${sk}`} className="glass-card p-4 space-y-3">
                  <Skeleton className="w-full h-40 rounded-lg" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-3/4" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-1/2" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-9 w-full" style={{ background: "oklch(0.2 0.04 285)" }} />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 && !searchQuery ? (
            <EmptyState
              icon="🎮"
              title="No products yet"
              description="The admin hasn't added any products yet. Check back soon!"
            />
          ) : filteredProducts.length === 0 ? null : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, i) => (
                <ProductCard
                  key={product.id.toString()}
                  product={product}
                  index={i}
                  onViewDetail={() => {
                    onSelectProduct(product);
                    onNavigate("product-detail");
                  }}
                  onBuyNow={() => {
                    if (!userProfile) {
                      onNavigate("auth");
                      return;
                    }
                    onSelectCheckoutItem({ id: product.id, name: product.name, price: product.price });
                    onNavigate("checkout");
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* CPM Gg Services section */}
        <section id="cpm-services" className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="font-display text-3xl sm:text-4xl"
                style={{ color: "white", textShadow: "0 0 15px oklch(0.72 0.25 25 / 0.5)" }}
              >
                Car Parking Multiplayer Gg Services
              </h2>
              <p className="text-foreground/60 font-body text-sm mt-1">
                Premium CPM account services &amp; boosting
              </p>
            </div>
            <Car className="w-8 h-8 opacity-30" style={{ color: "oklch(0.72 0.25 25)" }} />
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(["a", "b", "c"] as const).map((sk) => (
                <div key={`cpm-svc-skel-${sk}`} className="glass-card p-4 space-y-3">
                  <Skeleton className="w-full h-40 rounded-lg" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-3/4" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-1/2" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-9 w-full" style={{ background: "oklch(0.2 0.04 285)" }} />
                </div>
              ))}
            </div>
          ) : filteredProducts.filter((p) => p.category === "cpm_services").length === 0 && !searchQuery ? (
            <EmptyState
              icon="🚗"
              title="No CPM Services yet"
              description="Check back soon for Car Parking Multiplayer services!"
            />
          ) : filteredProducts.filter((p) => p.category === "cpm_services").length === 0 ? null : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts
                .filter((p) => p.category === "cpm_services")
                .map((product, i) => (
                  <ProductCard
                    key={product.id.toString()}
                    product={product}
                    index={i}
                    onViewDetail={() => {
                      onSelectProduct(product);
                      onNavigate("product-detail");
                    }}
                    onBuyNow={() => {
                      if (!userProfile) {
                        onNavigate("auth");
                        return;
                      }
                      onSelectCheckoutItem({ id: product.id, name: product.name, price: product.price });
                      onNavigate("checkout");
                    }}
                  />
                ))}
            </div>
          )}
        </section>

        {/* CPM Lua Scripts section */}
        <section id="cpm-lua-scripts" className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="font-display text-3xl sm:text-4xl"
                style={{ color: "white", textShadow: "0 0 15px oklch(0.75 0.18 190 / 0.5)" }}
              >
                Car Parking Multiplayer Gg Lua Scripts
              </h2>
              <p className="text-foreground/60 font-body text-sm mt-1">
                Custom Lua scripts for Car Parking Multiplayer
              </p>
            </div>
            <Code className="w-8 h-8 opacity-30" style={{ color: "oklch(0.75 0.18 190)" }} />
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(["a", "b", "c"] as const).map((sk) => (
                <div key={`cpm-lua-skel-${sk}`} className="glass-card p-4 space-y-3">
                  <Skeleton className="w-full h-40 rounded-lg" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-3/4" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-1/2" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-9 w-full" style={{ background: "oklch(0.2 0.04 285)" }} />
                </div>
              ))}
            </div>
          ) : filteredProducts.filter((p) => p.category === "cpm_lua_scripts").length === 0 && !searchQuery ? (
            <EmptyState
              icon="💻"
              title="No Lua Scripts yet"
              description="Lua scripts for Car Parking Multiplayer coming soon!"
            />
          ) : filteredProducts.filter((p) => p.category === "cpm_lua_scripts").length === 0 ? null : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts
                .filter((p) => p.category === "cpm_lua_scripts")
                .map((product, i) => (
                  <ProductCard
                    key={product.id.toString()}
                    product={product}
                    index={i}
                    onViewDetail={() => {
                      onSelectProduct(product);
                      onNavigate("product-detail");
                    }}
                    onBuyNow={() => {
                      if (!userProfile) {
                        onNavigate("auth");
                        return;
                      }
                      onSelectCheckoutItem({ id: product.id, name: product.name, price: product.price });
                      onNavigate("checkout");
                    }}
                  />
                ))}
            </div>
          )}
        </section>

        {/* Ad-Free Membership section */}
        <section id="membership" className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="font-display text-3xl sm:text-4xl"
                style={{ color: "white", textShadow: "0 0 15px oklch(0.82 0.18 80 / 0.5)" }}
              >
                Ad-Free Membership
              </h2>
              <p className="text-foreground/60 font-body text-sm mt-1">
                Browse without interruptions — just £0.05/month
              </p>
            </div>
            <Crown className="w-8 h-8 opacity-30" style={{ color: "oklch(0.82 0.18 80)" }} />
          </div>

          {hasActiveMembership ? (
            <div
              className="glass-card p-6 max-w-md"
              style={{
                borderColor: "oklch(0.82 0.18 80 / 0.4)",
                boxShadow: "0 0 30px oklch(0.82 0.18 80 / 0.1)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.82 0.18 80 / 0.2)", border: "2px solid oklch(0.82 0.18 80 / 0.5)" }}
                >
                  <Crown className="w-6 h-6" style={{ color: "oklch(0.82 0.18 80)" }} />
                </div>
                <div>
                  <p
                    className="font-body font-bold text-base mb-1"
                    style={{ color: "oklch(0.82 0.18 80)" }}
                  >
                    ✓ Ad-Free Member
                  </p>
                  {membershipStatus && (
                    <p className="text-foreground/60 font-body text-sm">
                      Active until{" "}
                      <span className="font-semibold text-foreground/80">
                        {new Date(Number(membershipStatus.expiresAt) / 1_000_000).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                  <p className="text-foreground/40 font-body text-xs mt-1">
                    Repurchase next month to continue enjoying an ad-free experience.
                  </p>
                </div>
              </div>
            </div>
          ) : showMembershipCheckout ? (
            <MembershipCheckout
              paymentSettings={paymentSettings}
              userProfile={userProfile}
              onPurchase={onPurchaseMembership}
              onCancel={() => setShowMembershipCheckout(false)}
              onSuccess={() => setShowMembershipCheckout(false)}
              onNavigate={onNavigate}
            />
          ) : (
            <div
              className="glass-card p-6 max-w-md"
              style={{
                borderColor: "oklch(0.82 0.18 80 / 0.25)",
                boxShadow: "0 0 20px oklch(0.82 0.18 80 / 0.07)",
              }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.82 0.18 80 / 0.15)", border: "2px solid oklch(0.82 0.18 80 / 0.35)" }}
                >
                  <Crown className="w-6 h-6" style={{ color: "oklch(0.82 0.18 80)" }} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className="font-display text-3xl"
                      style={{ color: "oklch(0.82 0.18 80)", textShadow: "0 0 12px oklch(0.82 0.18 80 / 0.4)" }}
                    >
                      £0.05
                    </span>
                    <span className="font-body text-foreground/50 text-sm">/ month</span>
                  </div>
                  <ul className="space-y-1">
                    {["Remove all ads for 30 days", "One-time payment — no auto-renewal", "Instant activation"].map((feat) => (
                      <li key={feat} className="flex items-center gap-1.5 font-body text-sm text-foreground/70">
                        <Star className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.82 0.18 80)" }} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                className="w-full font-body font-bold text-sm"
                style={{
                  background: "linear-gradient(135deg, oklch(0.7 0.2 75), oklch(0.78 0.18 90))",
                  color: "oklch(0.12 0.04 285)",
                  boxShadow: "0 0 20px oklch(0.82 0.18 80 / 0.3)",
                }}
                onClick={() => {
                  if (!userProfile) {
                    onNavigate("auth");
                    return;
                  }
                  setShowMembershipCheckout(true);
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Buy Ad-Free Membership
              </Button>
            </div>
          )}
        </section>

        {/* Subscriptions section */}
        <section id="subscriptions" className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="font-display text-3xl sm:text-4xl"
                style={{ color: "white", textShadow: "0 0 15px oklch(0.7 0.22 45 / 0.5)" }}
              >
                Bonus Content
              </h2>
              <p className="text-foreground/60 font-body text-sm mt-1">
                Monthly bonus packages — pay once, enjoy all month
              </p>
            </div>
            <Zap className="w-8 h-8 opacity-30" style={{ color: "oklch(0.7 0.22 45)" }} />
          </div>

          {isLoadingPackages ? (
            <div className="flex gap-6 overflow-hidden">
              {(["x", "y", "z"] as const).map((sk) => (
                <div key={`pkg-skel-${sk}`} className="glass-card p-5 min-w-64 space-y-3">
                  <Skeleton className="h-5 w-3/4" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-full" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-4 w-2/3" style={{ background: "oklch(0.2 0.04 285)" }} />
                  <Skeleton className="h-9 w-full mt-4" style={{ background: "oklch(0.2 0.04 285)" }} />
                </div>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <EmptyState
              icon="⚡"
              title="No packages yet"
              description="Monthly bonus content packages coming soon!"
            />
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {packages.map((pkg, i) => (
                <PackageCard
                  key={pkg.id.toString()}
                  pkg={pkg}
                  index={i}
                  onSubscribe={() => {
                    if (!userProfile) {
                      onNavigate("auth");
                      return;
                    }
                    onSelectCheckoutItem({ id: pkg.id, name: pkg.name, price: pkg.price, isPackage: true });
                    onNavigate("checkout");
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer
        className="border-t mt-auto"
        style={{ borderColor: "oklch(0.62 0.27 355 / 0.15)", background: "oklch(0.08 0.03 285)" }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img
              src="/assets/generated/game-vault-logo-transparent.dim_800x300.png"
              alt="Game Vault"
              className="h-8 w-auto logo-glow-sm"
            />
            <div className="flex items-center gap-4 text-foreground/40 font-body text-sm">
              <span>© 2026. Built with ❤️ using{" "}
                <a
                  href="https://caffeine.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground/70 transition-colors"
                >
                  caffeine.ai
                </a>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-foreground/30 hover:text-foreground/50 font-body text-xs transition-colors flex items-center gap-1"
            >
              Admin Panel <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({
  product,
  index,
  onViewDetail,
  onBuyNow,
}: {
  product: Product;
  index: number;
  onViewDetail: () => void;
  onBuyNow: () => void;
}) {
  return (
    <article
      className="glass-card overflow-hidden group cursor-pointer"
      style={{
        animation: `fade-in-up 0.5s ${index * 0.07}s ease-out both`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px oklch(0.62 0.27 355 / 0.2), 0 0 0 1px oklch(0.62 0.27 355 / 0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Product image */}
      <button
        type="button"
        className="relative h-44 overflow-hidden w-full text-left"
        onClick={onViewDetail}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ProductPlaceholder category={product.category} />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(0deg, oklch(0.13 0.05 285 / 0.8) 0%, transparent 50%)" }}
        />
        <Badge
          className="absolute top-3 left-3 text-white font-body text-xs font-semibold flex items-center gap-1"
          style={{
            background: product.category === "download_file"
              ? "oklch(0.7 0.22 45 / 0.9)"
              : "oklch(0.62 0.27 355 / 0.9)",
          }}
        >
          {getCategoryIcon(product.category)}
          {getCategoryLabel(product.category)}
        </Badge>
      </button>

      {/* Content */}
      <div className="p-4">
        <button
          type="button"
          className="font-body font-bold text-base text-foreground mb-1 line-clamp-1 text-left w-full hover:underline"
          onClick={onViewDetail}
        >
          {product.name}
        </button>
        <p className="text-foreground/50 font-body text-sm line-clamp-2 mb-4 min-h-10">
          {product.description || "Digital gaming content"}
        </p>

        <div className="flex items-center justify-between">
          <span
            className="font-display text-xl"
            style={{ color: "oklch(0.85 0.19 85)", textShadow: "0 0 10px oklch(0.85 0.19 85 / 0.5)" }}
          >
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            className="btn-gradient text-white font-body font-semibold text-xs"
            onClick={onBuyNow}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </article>
  );
}

function ProductPlaceholder({ category }: { category: string }) {
  const isDownload = category === "download_file";
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{
        background: isDownload
          ? "linear-gradient(135deg, oklch(0.2 0.08 45), oklch(0.15 0.05 285))"
          : "linear-gradient(135deg, oklch(0.2 0.08 355), oklch(0.15 0.05 285))",
      }}
    >
      <span className="text-5xl">{isDownload ? "💾" : "🎮"}</span>
      <span className="text-foreground/40 font-body text-xs">{getCategoryLabel(category)}</span>
    </div>
  );
}

function PackageCard({
  pkg,
  index,
  onSubscribe,
}: {
  pkg: Package;
  index: number;
  onSubscribe: () => void;
}) {
  return (
    <article
      className="glass-card shrink-0 snap-start w-72 sm:w-80 p-5 flex flex-col"
      style={{
        animation: `slide-in-right 0.5s ${index * 0.1}s ease-out both`,
        borderColor: "oklch(0.7 0.22 45 / 0.3)",
        boxShadow: "0 4px 20px oklch(0.7 0.22 45 / 0.1)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <Badge
            className="text-xs font-body mb-2"
            style={{ background: "oklch(0.7 0.22 45 / 0.2)", color: "oklch(0.7 0.22 45)", border: "1px solid oklch(0.7 0.22 45 / 0.3)" }}
          >
            Monthly
          </Badge>
          <h3 className="font-body font-bold text-foreground text-base">{pkg.name}</h3>
        </div>
        <span
          className="font-display text-2xl ml-2 shrink-0"
          style={{ color: "oklch(0.85 0.19 85)", textShadow: "0 0 10px oklch(0.85 0.19 85 / 0.5)" }}
        >
          {formatPrice(pkg.price)}
        </span>
      </div>

      <p className="text-foreground/50 font-body text-sm mb-4 flex-1">{pkg.description}</p>

      {pkg.features.length > 0 && (
        <ul className="space-y-1.5 mb-5">
          {pkg.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-foreground/70 font-body text-sm">
              <Star className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.7 0.22 45)" }} />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <Button className="btn-gradient text-white font-body font-semibold w-full mt-auto" onClick={onSubscribe}>
        Subscribe This Month
      </Button>
    </article>
  );
}

function AdBanner({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3 container mx-auto"
      style={{ animation: "fade-in 0.3s ease-out both" }}
    >
      {ad.adType === "image" && ad.imageUrl ? (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-10 w-auto rounded object-cover shrink-0 max-w-24"
          />
          <div className="min-w-0">
            <p className="font-body font-semibold text-sm text-foreground truncate">{ad.title}</p>
            {ad.description && (
              <p className="text-foreground/50 font-body text-xs truncate">{ad.description}</p>
            )}
          </div>
          {ad.linkUrl && (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 font-body text-xs font-semibold px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
              style={{ background: "oklch(0.7 0.22 45 / 0.15)", color: "oklch(0.7 0.22 45)", border: "1px solid oklch(0.7 0.22 45 / 0.3)" }}
            >
              <ExternalLink className="w-3 h-3" />
              Visit
            </a>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.7 0.22 45 / 0.2)" }}
          >
            <span className="text-xs">📢</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-body font-semibold text-sm text-foreground">{ad.title}</span>
            {ad.description && (
              <span className="text-foreground/50 font-body text-xs ml-2">{ad.description}</span>
            )}
          </div>
          {ad.linkUrl && (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 font-body text-xs font-semibold px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
              style={{ background: "oklch(0.7 0.22 45 / 0.15)", color: "oklch(0.7 0.22 45)", border: "1px solid oklch(0.7 0.22 45 / 0.3)" }}
            >
              <ExternalLink className="w-3 h-3" />
              Visit
            </a>
          )}
        </div>
      )}

      <span
        className="text-foreground/30 font-body text-xs mr-6"
        style={{ color: "oklch(0.7 0.22 45 / 0.5)" }}
      >
        AD
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Dismiss ad"
      >
        <X className="w-3.5 h-3.5 text-foreground/40" />
      </button>
    </div>
  );
}

type MembershipPaymentMethod = "paypal" | "bitcoin" | "ethereum" | "xbox" | "amazon" | "etsy";

const MEMBERSHIP_PAYMENT_OPTIONS: Array<{
  id: MembershipPaymentMethod;
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
    placeholder: "Bitcoin transaction ID (TxID)",
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
    getAddress: (s) => s.xboxInstructions || "Contact admin for Xbox gift card instructions",
    placeholder: "Xbox gift card code",
    isCrypto: false,
  },
  {
    id: "amazon",
    label: "Amazon Gift Card",
    icon: <span>📦</span>,
    color: "oklch(0.7 0.18 60)",
    getAddress: (s) => s.amazonInstructions || "Contact admin for Amazon gift card instructions",
    placeholder: "Amazon gift card code",
    isCrypto: false,
  },
  {
    id: "etsy",
    label: "Etsy Gift Card",
    icon: <span>🛍️</span>,
    color: "oklch(0.65 0.2 30)",
    getAddress: (s) => s.etsyInstructions || "Contact admin for Etsy gift card instructions",
    placeholder: "Etsy gift card code",
    isCrypto: false,
  },
];

function MembershipCheckout({
  paymentSettings,
  userProfile,
  onPurchase,
  onCancel,
  onSuccess,
  onNavigate,
}: {
  paymentSettings: PaymentSettings | null;
  userProfile: { username: string; email: string } | null;
  onPurchase?: (paymentMethod: string, paymentRef: string) => Promise<bigint>;
  onCancel: () => void;
  onSuccess: () => void;
  onNavigate: (page: Page) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<MembershipPaymentMethod | null>(null);
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
    if (!selectedMethod) { toast.error("Please select a payment method"); return; }
    if (!paymentRef.trim()) { toast.error("Please enter your payment reference"); return; }
    if (!userProfile) { onNavigate("auth"); return; }
    if (!onPurchase) { toast.error("Purchase not available"); return; }

    setIsPlacing(true);
    try {
      await onPurchase(selectedMethod, paymentRef.trim());
      setPurchased(true);
      toast.success("Membership purchased! Ads are now hidden.");
      setTimeout(() => { onSuccess(); }, 3000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to purchase membership. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (purchased) {
    return (
      <div
        className="glass-card p-8 max-w-md text-center"
        style={{ borderColor: "oklch(0.82 0.18 80 / 0.5)", animation: "scale-in 0.3s ease-out both" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "oklch(0.82 0.18 80 / 0.2)", border: "2px solid oklch(0.82 0.18 80 / 0.5)" }}
        >
          <Crown className="w-8 h-8" style={{ color: "oklch(0.82 0.18 80)" }} />
        </div>
        <h3 className="font-display text-2xl text-white mb-2">Membership Active!</h3>
        <p className="text-foreground/60 font-body text-sm">
          You're now an ad-free member for 30 days. Enjoy the store!
        </p>
      </div>
    );
  }

  const selectedOpt = MEMBERSHIP_PAYMENT_OPTIONS.find((o) => o.id === selectedMethod);
  const address = selectedOpt && paymentSettings ? selectedOpt.getAddress(paymentSettings) : "";

  return (
    <div
      className="glass-card p-6 max-w-lg"
      style={{ borderColor: "oklch(0.82 0.18 80 / 0.3)", animation: "fade-in-up 0.3s ease-out both" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body font-bold text-foreground flex items-center gap-2">
          <Crown className="w-4 h-4" style={{ color: "oklch(0.82 0.18 80)" }} />
          Buy Ad-Free Membership
          <span
            className="font-display text-xl ml-1"
            style={{ color: "oklch(0.82 0.18 80)" }}
          >
            £0.05
          </span>
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-foreground/40"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Payment method selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {MEMBERSHIP_PAYMENT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelectedMethod(opt.id)}
            className="flex items-center gap-2 p-2.5 rounded-lg font-body text-xs font-medium transition-all text-left"
            style={{
              background: selectedMethod === opt.id
                ? `oklch(${opt.color.replace("oklch(", "").split(")")[0]} / 0.15)`
                : "oklch(0.15 0.05 285 / 0.6)",
              border: `1px solid ${selectedMethod === opt.id ? opt.color : "oklch(0.3 0.08 285)"}`,
              color: selectedMethod === opt.id ? opt.color : "oklch(0.6 0.04 285)",
            }}
          >
            <span style={{ color: opt.color }}>{opt.icon}</span>
            {opt.label}
            {selectedMethod === opt.id && (
              <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: opt.color }} />
            )}
          </button>
        ))}
      </div>

      {/* Address/instructions */}
      {selectedMethod && address && (
        <div
          className="rounded-lg p-3 mb-3"
          style={{ background: "oklch(0.08 0.04 285)", border: `1px solid ${selectedOpt?.color ?? "oklch(0.3 0.08 285)"} / 0.25)` }}
        >
          {selectedOpt?.isCrypto ? (
            <div className="flex items-center gap-2">
              <code className="font-body text-xs break-all flex-1" style={{ color: selectedOpt?.color }}>
                {address}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(address, "addr")}
                className="shrink-0 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                {copiedField === "addr"
                  ? <ClipboardCheck className="w-4 h-4" style={{ color: "oklch(0.65 0.2 145)" }} />
                  : <Copy className="w-4 h-4 text-foreground/40" />
                }
              </button>
            </div>
          ) : (
            <p className="font-body text-xs text-foreground/70 leading-relaxed">{address}</p>
          )}
        </div>
      )}

      {selectedMethod && selectedOpt?.isCrypto && address && (
        <button
          type="button"
          onClick={() => handleCopy(address, "addr-btn")}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 mb-3 font-body font-semibold text-sm transition-all"
          style={{
            background: copiedField === "addr-btn" ? "oklch(0.55 0.2 145 / 0.15)" : `oklch(${(selectedOpt?.color ?? "oklch(0.6 0.15 285)").replace("oklch(", "").split(")")[0]} / 0.12)`,
            border: `1.5px solid ${copiedField === "addr-btn" ? "oklch(0.55 0.2 145 / 0.5)" : `oklch(${(selectedOpt?.color ?? "oklch(0.6 0.15 285)").replace("oklch(", "").split(")")[0]} / 0.4)`}`,
            color: copiedField === "addr-btn" ? "oklch(0.65 0.2 145)" : selectedOpt?.color,
          }}
        >
          {copiedField === "addr-btn" ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedField === "addr-btn" ? "Copied!" : `Copy ${selectedMethod === "paypal" ? "PayPal Username" : selectedMethod === "bitcoin" ? "Bitcoin Address" : "Ethereum Address"}`}
        </button>
      )}

      {/* Payment reference */}
      {selectedMethod && (
        <div className="mb-4">
          <label htmlFor="membership-payment-ref" className="font-body text-xs text-foreground/50 uppercase tracking-wider mb-1.5 block">
            Payment Reference <span style={{ color: "oklch(0.62 0.27 355)" }}>*</span>
          </label>
          <input
            id="membership-payment-ref"
            type="text"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder={selectedOpt?.placeholder ?? "Payment reference"}
            className="w-full px-3 py-2.5 rounded-lg font-body text-sm text-foreground placeholder:text-foreground/30 outline-none"
            style={{
              background: "oklch(0.15 0.05 285)",
              border: "1px solid oklch(0.3 0.08 285)",
            }}
          />
        </div>
      )}

      <Button
        className="w-full font-body font-bold text-sm"
        style={{
          background: "linear-gradient(135deg, oklch(0.7 0.2 75), oklch(0.78 0.18 90))",
          color: "oklch(0.12 0.04 285)",
        }}
        onClick={() => void handlePurchase()}
        disabled={isPlacing || !selectedMethod || !paymentRef.trim()}
      >
        {isPlacing
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
          : <><Crown className="w-4 h-4 mr-2" />Confirm Purchase — £0.05</>
        }
      </Button>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div
      className="glass-card p-12 text-center"
      style={{ animation: "fade-in 0.5s ease-out both" }}
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="font-body font-bold text-foreground text-lg mb-2">{title}</h3>
      <p className="text-foreground/50 font-body text-sm">{description}</p>
    </div>
  );
}
