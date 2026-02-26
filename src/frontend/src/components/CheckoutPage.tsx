import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Loader2, Copy } from "lucide-react";
import { SiPaypal, SiBitcoin, SiEthereum } from "react-icons/si";
import { toast } from "sonner";
import type { Page, CheckoutItem } from "@/types";
import type { PaymentSettings } from "@/backend.d";

interface CheckoutPageProps {
  item: CheckoutItem;
  paymentSettings: PaymentSettings | null;
  onNavigate: (page: Page) => void;
  onPlaceOrder: (
    itemName: string,
    price: bigint,
    paymentMethod: string,
    paymentReference: string
  ) => Promise<bigint>;
  userProfile: { username: string; email: string } | null;
}

type PaymentMethod = "paypal" | "bitcoin" | "ethereum" | "xbox" | "amazon" | "etsy";

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  color: string;
  getDetails: (settings: PaymentSettings) => string;
  placeholder: string;
}

function formatPrice(pricePence: bigint): string {
  const pounds = Number(pricePence) / 100;
  return `£${pounds.toFixed(2)}`;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "paypal",
    label: "PayPal",
    icon: <SiPaypal className="w-5 h-5" />,
    color: "oklch(0.55 0.2 240)",
    getDetails: (s) => s.paypalEmail || "Contact admin for PayPal details",
    placeholder: "Enter your PayPal transaction ID",
  },
  {
    id: "bitcoin",
    label: "Bitcoin",
    icon: <SiBitcoin className="w-5 h-5" />,
    color: "oklch(0.75 0.18 60)",
    getDetails: (s) => s.bitcoinWallet || "Contact admin for Bitcoin wallet",
    placeholder: "Enter your Bitcoin transaction ID (TxID)",
  },
  {
    id: "ethereum",
    label: "Ethereum",
    icon: <SiEthereum className="w-5 h-5" />,
    color: "oklch(0.65 0.15 270)",
    getDetails: (s) => s.ethereumWallet || "Contact admin for Ethereum wallet",
    placeholder: "Enter your Ethereum transaction hash",
  },
  {
    id: "xbox",
    label: "Xbox Gift Card (UK)",
    icon: <span className="text-lg">🎮</span>,
    color: "oklch(0.55 0.2 145)",
    getDetails: (s) => s.xboxInstructions || "Send your Xbox gift card code to admin via email",
    placeholder: "Enter your Xbox gift card code (XXXXX-XXXXX-XXXXX)",
  },
  {
    id: "amazon",
    label: "Amazon Gift Card (UK)",
    icon: <span className="text-lg">📦</span>,
    color: "oklch(0.7 0.18 60)",
    getDetails: (s) => s.amazonInstructions || "Send your Amazon gift card code to admin via email",
    placeholder: "Enter your Amazon gift card claim code",
  },
  {
    id: "etsy",
    label: "Etsy Gift Card (UK)",
    icon: <span className="text-lg">🛍️</span>,
    color: "oklch(0.65 0.2 30)",
    getDetails: (s) => s.etsyInstructions || "Send your Etsy gift card code to admin via email",
    placeholder: "Enter your Etsy gift card code",
  },
];

export function CheckoutPage({
  item,
  paymentSettings,
  onNavigate,
  onPlaceOrder,
  userProfile,
}: CheckoutPageProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderId, setOrderId] = useState<bigint | null>(null);

  const handlePlaceOrder = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!paymentRef.trim()) {
      toast.error("Please enter your payment reference");
      return;
    }
    if (!userProfile) {
      toast.error("Please log in to place an order");
      onNavigate("auth");
      return;
    }

    setIsPlacing(true);
    try {
      const id = await onPlaceOrder(item.name, item.price, selectedMethod, paymentRef.trim());
      setOrderId(id);
      toast.success("Order placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const selectedOption = PAYMENT_OPTIONS.find((o) => o.id === selectedMethod);
  const paymentDetails = selectedOption && paymentSettings
    ? selectedOption.getDetails(paymentSettings)
    : null;

  // Order confirmed screen
  if (orderId !== null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className="glass-card p-10 max-w-md w-full text-center"
          style={{ animation: "scale-in 0.4s ease-out both" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: "oklch(0.55 0.2 145 / 0.2)",
              border: "2px solid oklch(0.55 0.2 145 / 0.5)",
            }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "oklch(0.65 0.2 145)" }} />
          </div>

          <h2 className="font-display text-3xl text-foreground mb-3"
            style={{ textShadow: "0 0 15px oklch(0.65 0.2 145 / 0.4)" }}>
            Order Placed!
          </h2>

          <p className="text-foreground/60 font-body text-sm mb-4">
            Your order #{orderId.toString()} has been submitted successfully.
          </p>

          <div
            className="rounded-lg p-4 mb-6"
            style={{ background: "oklch(0.7 0.22 45 / 0.1)", border: "1px solid oklch(0.7 0.22 45 / 0.3)" }}
          >
            <p className="text-foreground/80 font-body text-sm leading-relaxed">
              🕐 <strong>Delivery: 3-7 business days</strong>
              <br />
              Our team will review your order and email you the digital content once approved.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="btn-gradient text-white font-body font-semibold w-full"
              onClick={() => onNavigate("dashboard")}
            >
              View My Orders
            </Button>
            <Button
              variant="ghost"
              className="font-body text-foreground/60 hover:text-foreground"
              onClick={() => onNavigate("store")}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back button */}
        <button
          type="button"
          onClick={() => onNavigate("store")}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-body text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Store
        </button>

        <h1
          className="font-display text-4xl mb-8"
          style={{ color: "white", textShadow: "0 0 20px oklch(0.62 0.27 355 / 0.4)" }}
        >
          Checkout
        </h1>

        {/* Order summary */}
        <div
          className="glass-card p-5 mb-8"
          style={{ animation: "fade-in-up 0.4s ease-out both" }}
        >
          <h2 className="font-body font-bold mb-3 text-sm uppercase tracking-widest text-foreground/50">
            Order Summary
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body font-semibold text-foreground text-lg">{item.name}</p>
              {item.isPackage && (
                <p className="text-foreground/50 font-body text-xs mt-1">Monthly Bonus Package</p>
              )}
            </div>
            <span
              className="font-display text-2xl"
              style={{ color: "oklch(0.85 0.19 85)", textShadow: "0 0 10px oklch(0.85 0.19 85 / 0.5)" }}
            >
              {formatPrice(item.price)}
            </span>
          </div>
        </div>

        {/* Payment method selection */}
        <div style={{ animation: "fade-in-up 0.4s 0.1s ease-out both" }}>
          <h2 className="font-body font-bold mb-4 text-sm uppercase tracking-widest text-foreground/50">
            Choose Payment Method
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {PAYMENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedMethod(option.id)}
                className="glass-card p-4 flex items-center gap-3 text-left transition-all"
                style={{
                  borderColor: selectedMethod === option.id
                    ? option.color
                    : "oklch(0.3 0.08 285)",
                  boxShadow: selectedMethod === option.id
                    ? `0 0 15px ${option.color.replace("oklch(", "oklch(").split(")")[0]} / 0.3)`
                    : "none",
                  background: selectedMethod === option.id
                    ? `${option.color.split(")")[0]} / 0.1)`
                    : "oklch(0.15 0.05 285 / 0.6)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `${option.color.split(")")[0]} / 0.2)`,
                    color: option.color,
                  }}
                >
                  {option.icon}
                </div>
                <span className="font-body font-medium text-foreground text-sm">{option.label}</span>
                {selectedMethod === option.id && (
                  <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: option.color }} />
                )}
              </button>
            ))}
          </div>

          {/* Payment details */}
          {selectedMethod && paymentDetails && (
            <div
              className="glass-card p-5 mb-6"
              style={{
                borderColor: `${selectedOption?.color.split(")")[0]} / 0.3)`,
                animation: "fade-in 0.3s ease-out both",
              }}
            >
              <h3 className="font-body font-semibold text-foreground mb-3 flex items-center gap-2">
                {selectedOption?.icon}
                Payment Details
              </h3>
              <div
                className="rounded-lg p-3 flex items-center justify-between gap-3"
                style={{ background: "oklch(0.1 0.03 285)" }}
              >
                <code className="font-body text-sm text-foreground/80 break-all">{paymentDetails}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentDetails)}
                  className="shrink-0 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4 text-foreground/50" />
                </button>
              </div>
              <p className="text-foreground/50 font-body text-xs mt-2">
                Send your payment to the above address/email, then enter the transaction ID or code below.
              </p>
            </div>
          )}

          {/* Payment reference input */}
          {selectedMethod && (
            <div
              className="mb-8"
              style={{ animation: "fade-in 0.3s ease-out both" }}
            >
              <Label className="font-body text-sm text-foreground/70 mb-2 block">
                Payment Reference <span style={{ color: "oklch(0.62 0.27 355)" }}>*</span>
              </Label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder={selectedOption?.placeholder}
                className="font-body"
                style={{
                  background: "oklch(0.15 0.05 285)",
                  borderColor: "oklch(0.3 0.08 285)",
                  color: "white",
                }}
              />
              <p className="text-foreground/40 font-body text-xs mt-1.5">
                This is required to verify your payment.
              </p>
            </div>
          )}

          <Button
            className="btn-gradient text-white font-body font-bold text-base w-full py-6 h-auto"
            onClick={handlePlaceOrder}
            disabled={isPlacing || !selectedMethod || !paymentRef.trim()}
          >
            {isPlacing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Place Order — {formatPrice(item.price)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
