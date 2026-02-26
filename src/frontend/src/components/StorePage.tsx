import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Gamepad2, Download, Star, ChevronRight, Zap, Car, Code, Search, X } from "lucide-react";
import type { Page, CheckoutItem } from "@/types";
import type { Product, Package } from "@/backend.d";

interface StorePageProps {
  products: Product[];
  packages: Package[];
  isLoadingProducts: boolean;
  isLoadingPackages: boolean;
  onNavigate: (page: Page, data?: unknown) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCheckoutItem: (item: CheckoutItem) => void;
  userProfile: { username: string; email: string } | null;
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
}: StorePageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
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
