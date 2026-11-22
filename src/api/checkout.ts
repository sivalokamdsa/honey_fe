import { ApiError } from "./registrations";

export type CheckoutItem = {
  productId: string;
  quantity: number;
};

export type CheckoutCustomer = {
  name: string;
  phone: string;
  email?: string;
  city?: string;
};

export type CreateOrderInput = {
  items: CheckoutItem[];
  customer: CheckoutCustomer;
};

/**
 * The Razorpay order object (Orders API response), as returned by the
 * backend. Amounts are in paise. The backend sets `receipt` to our internal
 * order id, so verification can find the order again.
 */
export type RazorpayOrder = {
  id: string; // order_XXXX, passed to the Razorpay Checkout widget
  entity: "order";
  amount: number; // total to charge, in paise
  amount_due: number;
  amount_paid: number;
  currency: string; // "INR"
  receipt: string | null; // our internal order id
  status: "created" | "attempted" | "paid";
  attempts: number;
  created_at: number; // unix seconds
  notes: unknown[] | Record<string, unknown>;
  offer_id: string | null;
};

/**
 * Returned by the backend after it has re-priced the cart itself.
 * The amount here is authoritative; the client never sends prices.
 */
export type CheckoutOrder = {
  /** Public Razorpay key id (never the secret). */
  keyId: string;
  /** The Razorpay order that the widget will charge. */
  order: RazorpayOrder;
};

export type PaymentVerification = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type PaymentResult = {
  status: "paid";
  orderId: string;
  paymentId: string;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your internet and try again.",
      0,
    );
  }

  if (res.ok) return res.json();

  const problem = await res.json().catch(() => ({}));
  throw new ApiError(
    problem.detail ?? "Something went wrong. Please try again.",
    res.status,
    problem.errors ?? {},
  );
}

/** Asks the backend to price the cart and open a Razorpay order. */
export function createCheckoutOrder(
  input: CreateOrderInput,
): Promise<CheckoutOrder> {
  return postJson<CheckoutOrder>("/api/v1/checkout/orders", input);
}

/**
 * Sends the Razorpay signature to the backend. The backend verifies it with
 * the secret key and only then stores the payment in the database.
 */
export function verifyPayment(
  input: PaymentVerification,
): Promise<PaymentResult> {
  return postJson<PaymentResult>("/api/v1/checkout/verify", input);
}
