import type { PaymentSettings } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import type { CheckoutItem, Page } from "@/types";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Loader2,
  Mail,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";
import { SiBitcoin, SiEthereum, SiPaypal } from "react-icons/si";
import { toast } from "sonner";

interface CheckoutPageProps {
  item: CheckoutItem;
  paymentSettings: PaymentSettings | null;
  onNavigate: (page: Page) => void;
  onPlaceOrder: (
    itemName: string,
    price: bigint,
    paymentMethod: string,
    paymentReference: string,
    couponCode: string | null,
    deliveryEmail: string,
  ) => Promise<bigint>;
  userProfile: { username: string; email: string } | null;
}

type PaymentMethod =
  | "paypal"
  | "bitcoin"
  | "ethereum"
  | "xbox"
  | "amazon"
  | "etsy";

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
    getDetails: (s) =>
      s.xboxInstructions || "Send your Xbox gift card code to admin via email",
    placeholder: "Enter your Xbox gift card code (XXXXX-XXXXX-XXXXX)",
  },
  {
    id: "amazon",
    label: "Amazon Gift Card (UK)",
    icon: <span className="text-lg">📦</span>,
    color: "oklch(0.7 0.18 60)",
    getDetails: (s) =>
      s.amazonInstructions ||
      "Send your Amazon gift card code to admin via email",
    placeholder: "Enter your Amazon gift card claim code",
  },
  {
    id: "etsy",
    label: "Etsy Gift Card (UK)",
    icon: <span className="text-lg">🛍️</span>,
    color: "oklch(0.65 0.2 30)",
    getDetails: (s) =>
      s.etsyInstructions || "Send your Etsy gift card code to admin via email",
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
  const { actor } = useActor();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [paymentRef, setPaymentRef] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderId, setOrderId] = useState<bigint | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Delivery email state
  const [deliveryEmail, setDeliveryEmail] = useState(userProfile?.email ?? "");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: bigint;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Calculate discounted price
  const discountedPrice = (() => {
    if (!appliedCoupon) return item.price;
    if (appliedCoupon.discountType === "percentage") {
      const discounted =
        item.price - (item.price * appliedCoupon.discountValue) / 100n;
      return discounted < 0n ? 0n : discounted;
    }
    const discounted = item.price - appliedCoupon.discountValue;
    return discounted < 0n ? 0n : discounted;
  })();

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ type: "error", text: "Please enter a coupon code" });
      return;
    }
    if (!userProfile) {
      setCouponMessage({ type: "error", text: "Please log in to use coupons" });
      return;
    }
    if (!actor) {
      setCouponMessage({ type: "error", text: "Not connected to backend" });
      return;
    }

    setIsValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const result = await actor.validateCoupon(code, userProfile.username);
      const { coupon } = result;
      setAppliedCoupon({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      });
      const displayValue =
        coupon.discountType === "percentage"
          ? `${coupon.discountValue.toString()}% off`
          : `£${(Number(coupon.discountValue) / 100).toFixed(2)} off`;
      setCouponMessage({
        type: "success",
        text: `${coupon.code} applied — ${displayValue}`,
      });
      toast.success(`Coupon applied: ${displayValue}`);
    } catch (err) {
      console.error(err);
      setAppliedCoupon(null);
      setCouponMessage({ type: "error", text: "Invalid or expired coupon" });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!paymentRef.trim()) {
      toast.error("Please enter your payment reference");
      return;
    }
    if (!deliveryEmail.trim()) {
      toast.error("Please enter a delivery email");
      return;
    }
    if (!userProfile) {
      toast.error("Please log in to place an order");
      onNavigate("auth");
      return;
    }

    setIsPlacing(true);
    try {
      const id = await onPlaceOrder(
        item.name,
        item.price,
        selectedMethod,
        paymentRef.trim(),
        appliedCoupon?.code ?? null,
        deliveryEmail.trim(),
      );
      setOrderId(id);
      // Save email to profile if it changed
      if (deliveryEmail.trim() !== userProfile.email && actor) {
        try {
          await actor.saveCallerUserProfile({
            username: userProfile.username,
            email: deliveryEmail.trim(),
          });
        } catch (saveErr) {
          console.error("Failed to save email to profile:", saveErr);
        }
      }
      toast.success("Order placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const copyToClipboard = (text: string, fieldKey?: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
    if (fieldKey) {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const selectedOption = PAYMENT_OPTIONS.find((o) => o.id === selectedMethod);
  const paymentDetails =
    selectedOption && paymentSettings
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
            <CheckCircle2
              className="w-10 h-10"
              style={{ color: "oklch(0.65 0.2 145)" }}
            />
          </div>

          <h2
            className="font-display text-3xl text-foreground mb-3"
            style={{ textShadow: "0 0 15px oklch(0.65 0.2 145 / 0.4)" }}
          >
            Order Placed!
          </h2>

          <p className="text-foreground/60 font-body text-sm mb-4">
            Your order #{orderId.toString()} has been submitted successfully.
          </p>

          <div
            className="rounded-lg p-4 mb-4"
            style={{
              background: "oklch(0.7 0.22 45 / 0.1)",
              border: "1px solid oklch(0.7 0.22 45 / 0.3)",
            }}
          >
            <p className="text-foreground/80 font-body text-sm leading-relaxed">
              🕐 <strong>Delivery: 3-7 business days</strong>
              <br />
              Our team will review your order and email you the digital content
              once approved.
            </p>
          </div>

          {deliveryEmail && (
            <div
              className="rounded-lg p-3 mb-6 flex items-center gap-2"
              style={{
                background: "oklch(0.55 0.2 240 / 0.1)",
                border: "1px solid oklch(0.55 0.2 240 / 0.3)",
              }}
            >
              <Mail
                className="w-4 h-4 shrink-0"
                style={{ color: "oklch(0.65 0.2 240)" }}
              />
              <p className="text-foreground/70 font-body text-xs">
                Your order details will be sent to:{" "}
                <span
                  className="font-semibold"
                  style={{ color: "oklch(0.75 0.18 240)" }}
                >
                  {deliveryEmail}
                </span>
              </p>
            </div>
          )}

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
          style={{
            color: "white",
            textShadow: "0 0 20px oklch(0.62 0.27 355 / 0.4)",
          }}
        >
          Checkout
        </h1>

        {/* Order summary */}
        <div
          className="glass-card p-5 mb-6"
          style={{ animation: "fade-in-up 0.4s ease-out both" }}
        >
          <h2 className="font-body font-bold mb-3 text-sm uppercase tracking-widest text-foreground/50">
            Order Summary
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-body font-semibold text-foreground text-lg">
                {item.name}
              </p>
              {item.isPackage && (
                <p className="text-foreground/50 font-body text-xs mt-1">
                  Monthly Bonus Package
                </p>
              )}
            </div>
            <div className="text-right">
              {appliedCoupon && (
                <p className="font-body text-sm line-through text-foreground/40 mb-0.5">
                  {formatPrice(item.price)}
                </p>
              )}
              <span
                className="font-display text-2xl"
                style={{
                  color: "oklch(0.85 0.19 85)",
                  textShadow: "0 0 10px oklch(0.85 0.19 85 / 0.5)",
                }}
              >
                {formatPrice(discountedPrice)}
              </span>
            </div>
          </div>

          {/* Delivery email input */}
          <div
            className="border-t pt-4 mt-4"
            style={{ borderColor: "oklch(0.25 0.06 285)" }}
          >
            <p className="font-body text-xs text-foreground/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Delivery Email{" "}
              <span style={{ color: "oklch(0.62 0.27 355)" }}>*</span>
            </p>
            <p className="font-body text-xs text-foreground/40 mb-2">
              We'll send your order details to this address
            </p>
            <Input
              type="email"
              value={deliveryEmail}
              onChange={(e) => setDeliveryEmail(e.target.value)}
              placeholder="your@email.com"
              className="font-body"
              style={{
                background: "oklch(0.15 0.05 285)",
                borderColor: "oklch(0.3 0.08 285)",
                color: "white",
              }}
            />
          </div>

          {/* Coupon input */}
          <div
            className="border-t pt-4"
            style={{ borderColor: "oklch(0.25 0.06 285)" }}
          >
            <p className="font-body text-xs text-foreground/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Coupon Code
            </p>
            {appliedCoupon ? (
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{
                  background: "oklch(0.55 0.2 145 / 0.12)",
                  border: "1px solid oklch(0.55 0.2 145 / 0.35)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Tag
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.2 145)" }}
                  />
                  <span
                    className="font-body font-semibold text-sm"
                    style={{ color: "oklch(0.65 0.2 145)" }}
                  >
                    {appliedCoupon.code}
                  </span>
                  {couponMessage && (
                    <span className="font-body text-xs text-foreground/60">
                      {couponMessage.text}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-1 rounded-md hover:bg-muted/30 transition-colors"
                  title="Remove coupon"
                >
                  <X className="w-4 h-4 text-foreground/50" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleApplyCoupon();
                  }}
                  placeholder="Enter coupon code"
                  className="font-body uppercase"
                  style={{
                    background: "oklch(0.15 0.05 285)",
                    borderColor: "oklch(0.3 0.08 285)",
                    color: "white",
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleApplyCoupon()}
                  disabled={isValidatingCoupon || !couponInput.trim()}
                  className="shrink-0 font-body font-semibold"
                  style={{
                    borderColor: "oklch(0.62 0.27 355 / 0.5)",
                    color: "oklch(0.62 0.27 355)",
                  }}
                >
                  {isValidatingCoupon ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
            {couponMessage && !appliedCoupon && (
              <p
                className="font-body text-xs mt-1.5"
                style={{
                  color:
                    couponMessage.type === "error"
                      ? "oklch(0.7 0.25 25)"
                      : "oklch(0.65 0.2 145)",
                }}
              >
                {couponMessage.text}
              </p>
            )}
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
                  borderColor:
                    selectedMethod === option.id
                      ? option.color
                      : "oklch(0.3 0.08 285)",
                  boxShadow:
                    selectedMethod === option.id
                      ? `0 0 15px ${option.color.replace("oklch(", "oklch(").split(")")[0]} / 0.3)`
                      : "none",
                  background:
                    selectedMethod === option.id
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
                <span className="font-body font-medium text-foreground text-sm">
                  {option.label}
                </span>
                {selectedMethod === option.id && (
                  <CheckCircle2
                    className="w-4 h-4 ml-auto shrink-0"
                    style={{ color: option.color }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Payment details */}
          {selectedMethod && paymentDetails && (
            <div
              className="glass-card p-5 mb-6"
              style={{
                borderColor: `${selectedOption?.color.split(")")[0]} / 0.4)`,
                animation: "fade-in 0.3s ease-out both",
                boxShadow: `0 0 20px ${selectedOption?.color.split(")")[0]} / 0.1)`,
              }}
            >
              <h3 className="font-body font-semibold text-foreground mb-1 flex items-center gap-2">
                {selectedOption?.icon}
                {selectedMethod === "paypal"
                  ? "Send payment to this PayPal account:"
                  : selectedMethod === "bitcoin"
                    ? "Send Bitcoin to this address:"
                    : selectedMethod === "ethereum"
                      ? "Send Ethereum to this address:"
                      : "Payment Instructions:"}
              </h3>

              {selectedMethod === "paypal" ||
              selectedMethod === "bitcoin" ||
              selectedMethod === "ethereum" ? (
                <>
                  {/* Address/username display box */}
                  <div
                    className="rounded-lg p-4 mt-3 mb-3 flex items-center justify-between gap-3"
                    style={{
                      background: "oklch(0.08 0.04 285)",
                      border: `1px solid ${selectedOption?.color.split(")")[0]} / 0.25)`,
                    }}
                  >
                    <code
                      className="font-body text-sm break-all leading-relaxed"
                      style={{ color: selectedOption?.color }}
                    >
                      {paymentDetails}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(paymentDetails, selectedMethod)
                      }
                      className="shrink-0 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                      title="Copy"
                    >
                      {copiedField === selectedMethod ? (
                        <ClipboardCheck
                          className="w-4 h-4"
                          style={{ color: "oklch(0.65 0.2 145)" }}
                        />
                      ) : (
                        <Copy className="w-4 h-4 text-foreground/50" />
                      )}
                    </button>
                  </div>

                  {/* Prominent copy button */}
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(paymentDetails, `${selectedMethod}-btn`)
                    }
                    className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-body font-semibold text-sm transition-all active:scale-95"
                    style={{
                      background:
                        copiedField === `${selectedMethod}-btn`
                          ? "oklch(0.55 0.2 145 / 0.2)"
                          : `${selectedOption?.color.split(")")[0]} / 0.15)`,
                      border: `1.5px solid ${
                        copiedField === `${selectedMethod}-btn`
                          ? "oklch(0.55 0.2 145 / 0.6)"
                          : `${selectedOption?.color.split(")")[0]} / 0.5)`
                      }`,
                      color:
                        copiedField === `${selectedMethod}-btn`
                          ? "oklch(0.65 0.2 145)"
                          : selectedOption?.color,
                    }}
                  >
                    {copiedField === `${selectedMethod}-btn` ? (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {selectedMethod === "paypal"
                          ? "Copy PayPal Username"
                          : selectedMethod === "bitcoin"
                            ? "Copy Bitcoin Address"
                            : "Copy Ethereum Address"}
                      </>
                    )}
                  </button>

                  <p className="text-foreground/50 font-body text-xs mt-3">
                    {selectedMethod === "paypal"
                      ? `Send £${(Number(discountedPrice) / 100).toFixed(2)} to the PayPal username above, then enter your PayPal transaction ID below.`
                      : selectedMethod === "bitcoin"
                        ? `Send £${(Number(discountedPrice) / 100).toFixed(2)} worth of Bitcoin to the address above, then enter your transaction ID (TxID) below.`
                        : `Send £${(Number(discountedPrice) / 100).toFixed(2)} worth of Ethereum to the address above, then enter your transaction hash below.`}
                  </p>
                </>
              ) : (
                /* Gift card instructions -- plain display */
                <>
                  <div
                    className="rounded-lg p-3 mt-3"
                    style={{ background: "oklch(0.1 0.03 285)" }}
                  >
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">
                      {paymentDetails}
                    </p>
                  </div>
                  <p className="text-foreground/50 font-body text-xs mt-2">
                    Follow the instructions above, then enter your gift card
                    code below.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Payment reference input */}
          {selectedMethod && (
            <div
              className="mb-8"
              style={{ animation: "fade-in 0.3s ease-out both" }}
            >
              <Label className="font-body text-sm text-foreground/70 mb-2 block">
                Payment Reference{" "}
                <span style={{ color: "oklch(0.62 0.27 355)" }}>*</span>
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
                Place Order — {formatPrice(discountedPrice)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
