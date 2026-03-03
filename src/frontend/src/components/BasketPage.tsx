import { Button } from "@/components/ui/button";
import type { BasketItem, Page } from "@/types";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

interface BasketPageProps {
  basket: BasketItem[];
  onNavigate: (page: Page) => void;
  onUpdateQuantity: (id: bigint, qty: number) => void;
  onRemoveFromBasket: (id: bigint) => void;
  onProceedToCheckout: () => void;
  userProfile: { username: string; email: string } | null;
}

function formatPrice(pricePence: bigint): string {
  const pounds = Number(pricePence) / 100;
  return `£${pounds.toFixed(2)}`;
}

export function BasketPage({
  basket,
  onNavigate,
  onUpdateQuantity,
  onRemoveFromBasket,
  onProceedToCheckout,
  userProfile,
}: BasketPageProps) {
  const grandTotal = basket.reduce(
    (sum, item) => sum + item.price * BigInt(item.quantity),
    0n,
  );

  const itemCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen" data-ocid="basket.page">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back button */}
        <button
          type="button"
          onClick={() => onNavigate("store")}
          data-ocid="basket.link"
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-body text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Continue Shopping
        </button>

        {/* Header */}
        <div
          className="flex items-center gap-3 mb-8"
          style={{ animation: "fade-in-up 0.4s ease-out both" }}
        >
          <ShoppingCart
            className="w-8 h-8"
            style={{ color: "oklch(0.62 0.27 355)" }}
          />
          <div>
            <h1
              className="font-display text-4xl"
              style={{
                color: "white",
                textShadow: "0 0 20px oklch(0.62 0.27 355 / 0.4)",
              }}
            >
              Your Basket
            </h1>
            {itemCount > 0 && (
              <p className="text-foreground/50 font-body text-sm mt-0.5">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </div>

        {basket.length === 0 ? (
          /* Empty state */
          <div
            data-ocid="basket.empty_state"
            className="glass-card p-16 text-center"
            style={{ animation: "fade-in-up 0.5s ease-out both" }}
          >
            <ShoppingCart
              className="w-16 h-16 mx-auto mb-6 opacity-20"
              style={{ color: "oklch(0.62 0.27 355)" }}
            />
            <h2 className="font-display text-2xl text-white mb-3">
              Your basket is empty
            </h2>
            <p className="text-foreground/50 font-body text-sm mb-8 max-w-sm mx-auto">
              Browse the store and add products to your basket to get started.
            </p>
            <Button
              className="btn-gradient text-white font-body font-semibold"
              onClick={() => onNavigate("store")}
              data-ocid="basket.primary_button"
            >
              Browse Store
            </Button>
          </div>
        ) : (
          <div style={{ animation: "fade-in-up 0.4s ease-out both" }}>
            {/* Basket items */}
            <div
              className="glass-card mb-6 overflow-hidden"
              data-ocid="basket.list"
            >
              {basket.map((item, index) => (
                <BasketRow
                  key={item.id.toString()}
                  item={item}
                  index={index + 1}
                  isLast={index === basket.length - 1}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveFromBasket}
                />
              ))}
            </div>

            {/* Order summary */}
            <div
              className="glass-card p-6 mb-6"
              style={{
                borderColor: "oklch(0.62 0.27 355 / 0.25)",
                boxShadow: "0 0 20px oklch(0.62 0.27 355 / 0.08)",
              }}
            >
              <h2 className="font-body font-bold text-sm uppercase tracking-widest text-foreground/50 mb-4">
                Order Summary
              </h2>

              <div className="space-y-2 mb-4">
                {basket.map((item) => (
                  <div
                    key={item.id.toString()}
                    className="flex items-center justify-between"
                  >
                    <span className="font-body text-sm text-foreground/70 line-clamp-1 flex-1 mr-4">
                      {item.name}{" "}
                      {item.quantity > 1 && (
                        <span className="text-foreground/40">
                          × {item.quantity}
                        </span>
                      )}
                    </span>
                    <span className="font-body text-sm text-foreground/80 shrink-0">
                      {formatPrice(item.price * BigInt(item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="border-t pt-4 flex items-center justify-between"
                style={{ borderColor: "oklch(0.25 0.06 285)" }}
              >
                <span className="font-body font-bold text-foreground">
                  Total
                </span>
                <span
                  className="font-display text-3xl"
                  style={{
                    color: "oklch(0.85 0.19 85)",
                    textShadow: "0 0 12px oklch(0.85 0.19 85 / 0.5)",
                  }}
                >
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                className="font-body text-foreground/60 hover:text-foreground sm:w-auto"
                onClick={() => onNavigate("store")}
                data-ocid="basket.secondary_button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>

              <Button
                className="btn-gradient text-white font-body font-bold text-base flex-1 py-6 h-auto"
                onClick={() => {
                  if (!userProfile) {
                    onNavigate("auth");
                    return;
                  }
                  onProceedToCheckout();
                }}
                data-ocid="basket.primary_button"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Proceed to Checkout — {formatPrice(grandTotal)}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BasketRow({
  item,
  index,
  isLast,
  onUpdateQuantity,
  onRemove,
}: {
  item: BasketItem;
  index: number;
  isLast: boolean;
  onUpdateQuantity: (id: bigint, qty: number) => void;
  onRemove: (id: bigint) => void;
}) {
  const subtotal = item.price * BigInt(item.quantity);

  return (
    <div
      data-ocid={`basket.item.${index}`}
      className="flex items-center gap-4 p-4"
      style={{
        borderBottom: isLast ? "none" : "1px solid oklch(0.25 0.06 285)",
      }}
    >
      {/* Product icon / placeholder */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-xl"
        style={{
          background: item.isPackage
            ? "oklch(0.7 0.22 45 / 0.15)"
            : "oklch(0.62 0.27 355 / 0.15)",
          border: `1px solid ${item.isPackage ? "oklch(0.7 0.22 45 / 0.3)" : "oklch(0.62 0.27 355 / 0.3)"}`,
        }}
      >
        {item.isPackage ? "⚡" : "🎮"}
      </div>

      {/* Name & price */}
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-foreground text-sm line-clamp-1">
          {item.name}
        </p>
        <p className="text-foreground/40 font-body text-xs mt-0.5">
          {formatPrice(item.price)} each
          {item.isPackage ? " · Monthly Package" : ""}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          data-ocid={`basket.toggle.${index}`}
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: "oklch(0.18 0.06 285)",
            border: "1px solid oklch(0.3 0.08 285)",
            color: "oklch(0.7 0.04 285)",
          }}
          aria-label={`Decrease quantity of ${item.name}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span
          className="font-body font-bold text-foreground text-sm w-7 text-center tabular-nums"
          aria-label={`Quantity: ${item.quantity}`}
        >
          {item.quantity}
        </span>

        <button
          type="button"
          data-ocid={`basket.toggle.${index}`}
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: "oklch(0.18 0.06 285)",
            border: "1px solid oklch(0.3 0.08 285)",
            color: "oklch(0.7 0.04 285)",
          }}
          aria-label={`Increase quantity of ${item.name}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtotal */}
      <div className="w-20 text-right shrink-0">
        <span
          className="font-body font-bold text-sm"
          style={{ color: "oklch(0.85 0.19 85)" }}
        >
          {formatPrice(subtotal)}
        </span>
      </div>

      {/* Remove */}
      <button
        type="button"
        data-ocid={`basket.delete_button.${index}`}
        onClick={() => onRemove(item.id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-red-500/10"
        style={{ color: "oklch(0.65 0.2 25 / 0.6)" }}
        aria-label={`Remove ${item.name} from basket`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
