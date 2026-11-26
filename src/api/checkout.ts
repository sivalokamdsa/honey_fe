import { ApiError } from "./registrations";
import { authHeaders, notifyIfUnauthorized } from "./client";

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

/** A line the backend priced for us. Used to show the confirmed order. */
export type CheckoutOrderItem = {
  productId: string;
  name: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

/**
 * Response of POST /api/v1/checkout/orders. The backend re-priced the cart
 * itself, so `totalPaise` is the authoritative amount. All money is in paise.
 */
export type CheckoutOrder = {
  /** Our internal order id, used when verifying the payment. */
  orderId: string;
  /** Our order status, e.g. "created". */
  status: string;
  /** Razorpay order id (order_...), passed to the Razorpay Checkout widget. */
  razorpayOrderId: string;
  /** Public Razorpay key id (never the secret). */
  razorpayKeyId: string;
  currency: string;
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  items: CheckoutOrderItem[];
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your internet and try again.",
      0,
    );
  }

  if (res.ok) return res.json();

  notifyIfUnauthorized(res);
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
