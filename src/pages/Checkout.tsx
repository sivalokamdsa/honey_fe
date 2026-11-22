import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createCheckoutOrder,
  verifyPayment,
  type CheckoutCustomer,
} from "../api/checkout";
import { fetchProducts, type Product } from "../api/products";
import { ApiError } from "../api/registrations";
import SiteNav from "../components/SiteNav";
import {
  formatINR,
  savingsPaise,
  subtotalPaise,
  type CartLine,
} from "../lib/pricing";
import { loadRazorpay } from "../lib/razorpay";
import "./Checkout.css";
import { sampleProducts } from "../data/products";
const CART_KEY = "honey-cart";

/** Cart is productId -> quantity. Stored per browser, so it survives reloads. */
type Cart = Record<string, number>;

function readCart(): Cart {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Cart) : {};
  } catch {
    return {};
  }
}

function writeCart(cart: Cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Storage blocked (private window): the cart still works for this visit.
  }
}

type Success = { orderId: string; paymentId: string };

export default function Checkout() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>(readCart);
  const [customer, setCustomer] = useState<CheckoutCustomer>({
    fullName: "",
    phone: "",
    email: "",
    city: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal)
      .then(setProducts)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // setLoadError(
        //   err instanceof ApiError ? err.message : "Could not load products.",
        // );
        setProducts(sampleProducts);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => writeCart(cart), [cart]);

  // Cart lines are derived from the fetched products. Unknown or out-of-stock
  // ids are dropped here, so stale localStorage never reaches the totals.
  const lines: CartLine[] = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => p.inStock && (cart[p.id] ?? 0) > 0)
      .map((product) => ({ product, quantity: cart[product.id] }));
  }, [products, cart]);

  const subtotal = subtotalPaise(lines);
  const savings = savingsPaise(lines);

  function setQuantity(productId: string, quantity: number) {
    setCart((c) => {
      const next = { ...c };
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(quantity, 20);
      return next;
    });
  }

  function updateCustomer<K extends keyof CheckoutCustomer>(
    key: K,
    value: string,
  ) {
    setCustomer((c) => ({ ...c, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!customer.fullName.trim()) errs.fullName = "Please enter your name.";
    if (!/^\d{10}$/.test(customer.phone.trim()))
      errs.phone = "Enter a 10-digit phone number.";
    if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email))
      errs.email = "Enter a valid email address.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onPay(e: FormEvent) {
    e.preventDefault();
    setPayError(null);
    if (lines.length === 0) return setPayError("Your cart is empty.");
    if (!validate()) return;

    setPaying(true);
    try {
      // 1. Backend re-prices the cart and opens a Razorpay order.
      const order = await createCheckoutOrder({
        items: lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
        })),
        customer: {
          fullName: customer.fullName.trim(),
          phone: customer.phone.trim(),
          email: customer.email?.trim() || undefined,
          city: customer.city?.trim() || undefined,
        },
      });

      // 2. Open the Razorpay widget with the server's amount, not ours.
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Payment gateway unavailable.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "తేనె",
        description: "Honey order",
        order_id: order.razorpayOrderId,
        prefill: {
          name: customer.fullName,
          email: customer.email || undefined,
          contact: customer.phone,
        },
        theme: { color: "#c97a26" },
        handler: async (response) => {
          // 3. Backend verifies the signature and stores the payment.
          try {
            const result = await verifyPayment({
              orderId: order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setCart({});
            setSuccess({
              orderId: result.orderId,
              paymentId: result.paymentId,
            });
          } catch (err) {
            // Money was taken but confirmation failed: show the id so it can be traced.
            setPayError(
              `Payment received (${response.razorpay_payment_id}) but we could not confirm it. ` +
                (err instanceof ApiError ? err.message : "") +
                " Please contact us with this id.",
            );
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });

      rzp.on("payment.failed", (r) => {
        setPayError(r.error.description || "Payment failed. Please try again.");
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setPayError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setPaying(false);
    }
  }

  return (
    <>
      <SiteNav />

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-drop" />
          <h1>చెక్అవుట్</h1>
          <p className="tag">Checkout · Secure payment via Razorpay</p>
        </div>
      </header>

      <main>
        {success ? (
          <div className="checkout-card success">
            <h2>ధన్యవాదాలు! Payment successful</h2>
            <p>
              Order <strong>{success.orderId}</strong>
              <br />
              Payment id <strong>{success.paymentId}</strong>
            </p>
            <p>We will contact you shortly with delivery details.</p>
          </div>
        ) : (
          <div className="checkout-grid">
            <section className="checkout-card">
              <h2>ఉత్పత్తులు · Products</h2>
              {loadError && <div className="form-error">{loadError}</div>}
              {!products && !loadError && <p>Loading products…</p>}
              {products && products.length === 0 && (
                <p>No products available.</p>
              )}

              <ul className="product-list">
                {products?.map((p) => {
                  const qty = cart[p.id] ?? 0;
                  return (
                    <li key={p.id} className="product-row">
                      <div>
                        <div className="product-name">{p.name}</div>
                        {p.description && (
                          <div className="product-desc">{p.description}</div>
                        )}
                        <div className="product-price">
                          {formatINR(p.pricePaise)}
                          {p.mrpPaise && p.mrpPaise > p.pricePaise && (
                            <s className="mrp">{formatINR(p.mrpPaise)}</s>
                          )}
                        </div>
                      </div>
                      {p.inStock ? (
                        <div className="qty">
                          <button
                            type="button"
                            onClick={() => setQuantity(p.id, qty - 1)}
                            disabled={qty === 0}
                            aria-label={`Decrease ${p.name}`}
                          >
                            −
                          </button>
                          <span aria-live="polite">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(p.id, qty + 1)}
                            disabled={qty >= 20}
                            aria-label={`Increase ${p.name}`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="out-of-stock">Out of stock</span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="summary">
                <div>
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="savings">
                    <span>You save</span>
                    <span>{formatINR(savings)}</span>
                  </div>
                )}
                <div className="total">
                  <span>Total (estimate)</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <p className="hint">
                  Final amount is confirmed by the server before payment.
                </p>
              </div>
            </section>

            <section className="checkout-card">
              <h2>వివరాలు · Your details</h2>
              <form onSubmit={onPay} noValidate>
                <Field
                  label="Full name *"
                  value={customer.fullName}
                  error={fieldErrors.fullName}
                  onChange={(v) => updateCustomer("fullName", v)}
                />
                <Field
                  label="Phone *"
                  type="tel"
                  inputMode="numeric"
                  value={customer.phone}
                  error={fieldErrors.phone}
                  onChange={(v) => updateCustomer("phone", v)}
                />
                <Field
                  label="Email"
                  type="email"
                  value={customer.email ?? ""}
                  error={fieldErrors.email}
                  onChange={(v) => updateCustomer("email", v)}
                />
                <Field
                  label="City"
                  value={customer.city ?? ""}
                  error={fieldErrors.city}
                  onChange={(v) => updateCustomer("city", v)}
                />

                {payError && <div className="form-error">{payError}</div>}

                <button
                  type="submit"
                  className="pay-btn"
                  disabled={paying || lines.length === 0}
                >
                  {paying
                    ? "Processing…"
                    : `Pay ${formatINR(subtotal)} with Razorpay`}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

function Field({
  label,
  error,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric";
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
