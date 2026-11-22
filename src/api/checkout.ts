import { ApiError } from "./registrations";

export type CheckoutItem = {
  productId: string;
  quantity: number;
};

export type CheckoutCustomer = {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
};

export type CreateOrderInput = {
  items: CheckoutItem[];
  customer: CheckoutCustomer;
};

/**
 * Returned by the backend after it has re-priced the cart itself.
 * The amount here is authoritative; the client never sends prices.
 */
export type CheckoutOrder = {
  /** Our internal order id, used when verifying the payment. */
  orderId: string;
  /** Razorpay order id, passed to the Razorpay Checkout widget. */
  razorpayOrderId: string;
  /** Public Razorpay key id (never the secret). */
  keyId: string;
  /** Total to charge, in paise. */
  amountPaise: number;
  currency: string;
  breakdown: {
    subtotalPaise: number;
    discountPaise: number;
    totalPaise: number;
  };
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
