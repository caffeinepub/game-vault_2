import type { Product } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CheckoutItem, Page } from "@/types";
import { ArrowLeft, Download, Gamepad2, ShoppingBag } from "lucide-react";

interface ProductDetailPageProps {
  product: Product;
  onNavigate: (page: Page) => void;
  onSelectCheckoutItem: (item: CheckoutItem) => void;
  userProfile: { username: string; email: string } | null;
}

function formatPrice(pricePence: bigint): string {
  const pounds = Number(pricePence) / 100;
  return `£${pounds.toFixed(2)}`;
}

function getCategoryLabel(category: string) {
  if (category === "download_file") return "Download File";
  if (category === "game_account") return "Game Account";
  return category;
}

export function ProductDetailPage({
  product,
  onNavigate,
  onSelectCheckoutItem,
  userProfile,
}: ProductDetailPageProps) {
  const handleBuyNow = () => {
    if (!userProfile) {
      onNavigate("auth");
      return;
    }
    onSelectCheckoutItem({
      id: product.id,
      name: product.name,
      price: product.price,
    });
    onNavigate("checkout");
  };

  const isDownload = product.category === "download_file";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => onNavigate("store")}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-body text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Store
        </button>

        {/* Product layout */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          style={{ animation: "fade-in-up 0.5s ease-out both" }}
        >
          {/* Product image */}
          <div
            className="glass-card overflow-hidden aspect-video lg:aspect-square flex items-center justify-center"
            style={{ minHeight: "320px" }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                style={{
                  background: isDownload
                    ? "linear-gradient(135deg, oklch(0.2 0.08 45), oklch(0.15 0.05 285))"
                    : "linear-gradient(135deg, oklch(0.2 0.08 355), oklch(0.15 0.05 285))",
                }}
              >
                <span className="text-8xl">{isDownload ? "💾" : "🎮"}</span>
                <span className="text-foreground/40 font-body text-sm">
                  {getCategoryLabel(product.category)}
                </span>
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col justify-center gap-6">
            <div>
              <Badge
                className="font-body text-sm font-semibold mb-3 flex items-center gap-1.5 w-fit"
                style={{
                  background: isDownload
                    ? "oklch(0.7 0.22 45 / 0.2)"
                    : "oklch(0.62 0.27 355 / 0.2)",
                  color: isDownload
                    ? "oklch(0.7 0.22 45)"
                    : "oklch(0.62 0.27 355)",
                  border: `1px solid ${isDownload ? "oklch(0.7 0.22 45 / 0.4)" : "oklch(0.62 0.27 355 / 0.4)"}`,
                }}
              >
                {isDownload ? (
                  <Download className="w-3.5 h-3.5" />
                ) : (
                  <Gamepad2 className="w-3.5 h-3.5" />
                )}
                {getCategoryLabel(product.category)}
              </Badge>

              <h1
                className="font-display text-4xl sm:text-5xl leading-tight mb-4"
                style={{
                  color: "white",
                  textShadow: "0 0 20px oklch(0.62 0.27 355 / 0.4)",
                }}
              >
                {product.name}
              </h1>

              <p className="text-foreground/70 font-body text-base leading-relaxed">
                {product.description ||
                  "Premium digital gaming content. Delivered within 3-7 business days after purchase."}
              </p>
            </div>

            {/* Delivery info */}
            <div
              className="glass-card p-4"
              style={{ borderColor: "oklch(0.7 0.22 45 / 0.3)" }}
            >
              <h3 className="font-body font-semibold text-foreground/90 mb-2 flex items-center gap-2">
                <ShoppingBag
                  className="w-4 h-4"
                  style={{ color: "oklch(0.7 0.22 45)" }}
                />
                How it works
              </h3>
              <ul className="space-y-2 text-foreground/60 font-body text-sm">
                <li className="flex items-start gap-2">
                  <span style={{ color: "oklch(0.62 0.27 355)" }}>①</span>
                  Place your order and choose a payment method
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "oklch(0.62 0.27 355)" }}>②</span>
                  Complete your payment with the provided details
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "oklch(0.62 0.27 355)" }}>③</span>
                  Admin reviews and approves your order
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "oklch(0.62 0.27 355)" }}>④</span>
                  Receive your digital content by email within 3-7 days
                </li>
              </ul>
            </div>

            {/* Price & CTA */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-foreground/40 font-body text-xs uppercase tracking-widest mb-1">
                  Price
                </p>
                <span
                  className="font-display text-5xl"
                  style={{
                    color: "oklch(0.85 0.19 85)",
                    textShadow: "0 0 15px oklch(0.85 0.19 85 / 0.6)",
                  }}
                >
                  {formatPrice(product.price)}
                </span>
              </div>

              <Button
                className="btn-gradient text-white font-body font-bold text-base px-8 py-6 h-auto flex-1 max-w-xs"
                onClick={handleBuyNow}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
