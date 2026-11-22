# Checkout: how it works

This document explains everything the checkout page (`/checkout`) needs in order to work: the frontend logic, the data it handles, the Razorpay flow, and the backend endpoints it depends on.

The frontend lives in this repo. The backend lives outside it. The backend must implement the endpoints in [Backend contract](#backend-contract). The page cannot take real payments without them.

---

## 1. Files involved

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Registers the `/checkout` route. |
| `src/pages/Checkout.tsx` | The page: product list, cart, customer form, payment flow, success screen. |
| `src/pages/Checkout.css` | Page styles. Uses the shared palette in `src/index.css`. |
| `src/api/products.ts` | `Product` type and `fetchProducts()`, which calls `GET /api/v1/products`. |
| `src/api/checkout.ts` | Types and calls for `POST /api/v1/checkout/orders` and `POST /api/v1/checkout/verify`. |
| `src/api/registrations.ts` | Exports `ApiError`, which the checkout code reuses. |
| `src/lib/pricing.ts` | Money formatting and cart arithmetic (subtotal, savings). |
| `src/lib/razorpay.ts` | Loads Razorpay's `checkout.js` once and declares its TypeScript types. |
| `src/data/products.ts` | `sampleProducts`, a local catalogue used as a fallback (see [Fallback behaviour](#8-fallback-behaviour)). |

---

## 2. Core rules

1. **Money is always an integer number of paise.** 1 INR = 100 paise. `₹450.00` is `45000`. Never use floats for money. Convert to rupees only for display, with `formatINR()`.
2. **The browser never decides the amount that is charged.** The frontend sends product ids and quantities. The backend looks up the prices, computes the total, and creates the Razorpay order. Razorpay is charged the amount the backend returned. The subtotal shown on the page is an estimate for the customer's benefit.
3. **The Razorpay secret key never reaches the browser.** The browser only receives `keyId`, which is the public key.
4. **Payment is not trusted until the backend verifies the signature.** Razorpay's success callback is produced by the browser. Only the backend's HMAC check against the secret proves the payment is genuine.
5. **The cart is per browser.** It is stored in `localStorage`, not in the database. Nothing about the cart is sent to the server until the customer presses Pay.

---

## 3. Data model

### Product (`src/api/products.ts`)

```ts
type Product = {
  id: string;            // stable id, e.g. "honey-1l"; sent back to the backend
  name: string;
  description?: string;
  pricePaise: number;    // selling price, integer paise
  mrpPaise?: number;     // list price, integer paise; shown struck through if higher
  imageUrl?: string;     // declared but not rendered yet
  inStock: boolean;
};
```

### Cart (`Checkout.tsx`)

```ts
type Cart = Record<string, number>; // productId -> quantity
```

Stored in `localStorage` under the key `honey-cart`. Example: `{"honey-1l": 2, "honey-2l": 1}`.

### CartLine (`src/lib/pricing.ts`)

```ts
type CartLine = { product: Product; quantity: number };
```

Built at render time by joining the cart with the loaded products. It is not stored anywhere.

### CheckoutCustomer (`src/api/checkout.ts`)

```ts
type CheckoutCustomer = {
  fullName: string;   // required
  phone: string;      // required, 10 digits
  email?: string;     // optional, must look like an email if given
  city?: string;      // optional
};
```

### CheckoutOrder (returned by the backend)

```ts
type CheckoutOrder = {
  orderId: string;          // our internal order id
  razorpayOrderId: string;  // passed to the Razorpay widget
  keyId: string;            // public key id
  amountPaise: number;      // the amount to charge, decided by the backend
  currency: string;         // "INR"
  breakdown: { subtotalPaise: number; discountPaise: number; totalPaise: number };
};
```

### PaymentVerification and PaymentResult

```ts
type PaymentVerification = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

type PaymentResult = { status: "paid"; orderId: string; paymentId: string };
```

---

## 4. Page state

| State | Type | Purpose |
| --- | --- | --- |
| `products` | `Product[] \| null` | `null` while loading. |
| `loadError` | `string \| null` | Product loading error message. Currently never set (see [section 8](#8-fallback-behaviour)). |
| `cart` | `Cart` | The customer's selections. Initialised from `localStorage`. |
| `customer` | `CheckoutCustomer` | Form values. |
| `fieldErrors` | `Record<string, string>` | Inline validation messages, keyed by field name. |
| `paying` | `boolean` | True from the moment Pay is pressed until the payment flow ends. Disables the button. |
| `payError` | `string \| null` | Banner shown above the Pay button. |
| `success` | `{ orderId, paymentId } \| null` | When set, the success screen replaces the checkout layout. |

---

## 5. Step-by-step flow

### Step A: page load

1. `fetchProducts()` calls `GET /api/v1/products`.
2. The cart is read from `localStorage` on first render. A corrupt or missing value is treated as an empty cart.
3. While products are loading, the page shows "Loading products…".

### Step B: building the cart

1. Each product row has `−` and `+` buttons.
2. `setQuantity(id, qty)`:
   - `qty <= 0` removes the product from the cart.
   - Otherwise the quantity is capped at **20** per product.
3. Every change to `cart` is written back to `localStorage`.
4. `lines` is derived as: products that are **in stock** and have **quantity > 0** in the cart. Anything else is ignored. This means a stale cart entry for a removed or out-of-stock product cannot affect the totals.
5. `subtotal = Σ pricePaise × quantity` over `lines`.
6. `savings = Σ (mrpPaise − pricePaise) × quantity` over `lines`, counting only products where MRP is higher than the selling price.
7. The summary shows Subtotal, You save (if > 0), and Total (estimate). The estimate equals the subtotal today. The page does not add tax, shipping or discounts; the backend's `breakdown` is the authority.

### Step C: validating the form

Runs when Pay is pressed. All errors are shown at once.

| Field | Rule | Message |
| --- | --- | --- |
| Full name | Required, not blank after trimming. | "Please enter your name." |
| Phone | Exactly 10 digits after trimming. | "Enter a 10-digit phone number." |
| Email | Optional. If given, must match `^\S+@\S+\.\S+$`. | "Enter a valid email address." |
| City | Optional, no rule. | — |

Editing a field clears its error. The form uses `noValidate`, so the browser's own validation does not run.

### Step D: pressing Pay

The handler `onPay` runs these checks in order:

1. Clear the previous `payError`.
2. If `lines` is empty, show "Your cart is empty." and stop.
3. Run form validation. Stop if it fails.
4. Set `paying = true`.

### Step E: create the order

Call `createCheckoutOrder()`:

```http
POST /api/v1/checkout/orders
Content-Type: application/json

{
  "items": [{ "productId": "honey-1l", "quantity": 2 }],
  "customer": { "fullName": "…", "phone": "9999999999", "email": "…", "city": "…" }
}
```

Only `productId` and `quantity` are sent for items. No prices. Optional customer fields are sent as `undefined` when blank, so they are omitted from the JSON.

On failure, `ApiError` is thrown and caught in step G.

### Step F: open the Razorpay widget

1. `loadRazorpay()` injects `https://checkout.razorpay.com/v1/checkout.js` if it is not already on the page. The promise is cached, so the script loads once per page session.
2. If the script fails to load, the error "Could not load the payment gateway…" is shown.
3. `new window.Razorpay(options)` is created with:

| Option | Value |
| --- | --- |
| `key` | `order.keyId` |
| `amount` | `order.amountPaise` (the server's amount) |
| `currency` | `order.currency` |
| `order_id` | `order.razorpayOrderId` |
| `name` | "తేనె" |
| `prefill` | name, email, contact from the form |
| `theme.color` | `#c97a26` |
| `handler` | Called on success. See step H. |
| `modal.ondismiss` | Customer closed the widget. Sets `paying = false`. |

4. `rzp.on("payment.failed", …)` shows Razorpay's error description and sets `paying = false`.
5. `rzp.open()` shows the widget.

### Step G: errors before the widget opens

Any error from steps E or F lands in the `catch`. It shows the error message in `payError` and sets `paying = false`. The customer can correct the problem and press Pay again. A new order is created each time.

### Step H: payment succeeded in the widget

The `handler` receives `razorpay_order_id`, `razorpay_payment_id` and `razorpay_signature`. It calls:

```http
POST /api/v1/checkout/verify
Content-Type: application/json

{
  "orderId": "…",
  "razorpayOrderId": "…",
  "razorpayPaymentId": "…",
  "razorpaySignature": "…"
}
```

- **Verification succeeds:** the cart is cleared (`setCart({})`, which also clears `localStorage`), and the success screen shows the order id and payment id.
- **Verification fails:** the page shows the Razorpay payment id with the message "Payment received (…) but we could not confirm it… Please contact us with this id." The cart is **not** cleared, so the customer can see what they bought. The money has been taken, so support must reconcile it using the payment id.
- In both cases `paying` returns to `false`.

### Step I: the success screen

The checkout layout is replaced by a success card with the order id and payment id. The cart is already empty. There is no link back to the shop, and reloading the page shows the empty checkout again.

---

## 6. Error handling summary

| Situation | What the customer sees | Recovery |
| --- | --- | --- |
| Products fail to load | See [section 8](#8-fallback-behaviour). | Reload. |
| Form invalid | Inline messages under fields. | Fix and press Pay. |
| Cart empty | "Your cart is empty." | Add products. |
| Backend unreachable when creating order | "Cannot reach the server…" | Retry. |
| Backend rejects order (`4xx`) | The backend's `detail` message. | Depends on message; the backend should explain. |
| Razorpay script blocked | "Could not load the payment gateway…" | Check network or ad-blocker. |
| Customer closes widget | Nothing; Pay becomes available again. | Retry. |
| Payment declined | Razorpay's `description` text. | Retry. |
| Paid, but verify fails | Payment id shown; cart kept. | Contact support with the id. |

---

## 7. Backend contract

The backend must implement these endpoints. The frontend assumes they exist.

### `GET /api/v1/products`

Returns an array of products.

```json
[
  {
    "id": "honey-1l",
    "name": "Pure Honey — 1 Litre",
    "description": "Raw, unprocessed forest honey in a 1 litre jar.",
    "pricePaise": 45000,
    "mrpPaise": 50000,
    "inStock": true
  }
]
```

Errors: a JSON body with `detail` is shown to the customer when present.

### `POST /api/v1/checkout/orders`

**Must** do the following:

1. Look up each `productId` in the product table. Reject unknown ids.
2. Reject, or cap, quantities that are invalid. The frontend caps at 20 but the backend must enforce its own limit.
3. Reject out-of-stock products at this point, not just in the UI.
4. Compute `subtotalPaise`, any discount, and `totalPaise` from **server-side prices**.
5. Create a Razorpay order with `amount = totalPaise`, `currency = "INR"`, and a receipt such as the internal order id. Use the **secret** key for this call.
6. Save an internal order row with status `created` (or similar), the items, the customer details and the amount.
7. Return the `CheckoutOrder` shape from section 3.

Errors: return a `4xx` with `{ "detail": "…", "errors": { "fieldName": "…" } }`. The frontend uses `detail` as the message.

### `POST /api/v1/checkout/verify`

**Must** do the following:

1. Load the internal order by `orderId`. Reject if it does not exist.
2. Check that `razorpayOrderId` matches the order's stored Razorpay order id.
3. Verify the signature. Compute `HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET)` and compare it with `razorpaySignature` using a constant-time comparison. Reject on mismatch.
4. Make the operation **idempotent**. If this payment was already recorded, return the existing result instead of inserting a second row. The browser may call verify more than once, for example after a network retry.
5. Store the payment in the database: payment id, order id, amount, status `paid`, timestamp, and the raw signature or Razorpay response if useful.
6. Mark the internal order as `paid`.
7. Return `{ "status": "paid", "orderId": "…", "paymentId": "…" }`.

Recommended, but not called by the frontend: a Razorpay **webhook** for `payment.captured`, using a separate webhook secret. It records payments even when the browser closes before `verify` runs.

---

## 8. Fallback behaviour

**Intended design** (from earlier work):

- `fetchProducts()` falls back to `sampleProducts` **only** when `import.meta.env.DEV` is true. In production, the error is thrown and the customer sees it.

**Current state on disk** (this differs from the intended design):

- `Checkout.tsx` catches the `fetchProducts()` failure and always calls `setProducts(sampleProducts)`, in every environment. The `setLoadError(...)` line is commented out, so no error is shown.
- Consequence in production: if the products endpoint fails, customers see the two sample honey products. Their ids (`honey-1l`, `honey-2l`) are unlikely to exist in the backend, so payment fails at the order step with the backend's error.

**Recommended fix:** restore the error display in `Checkout.tsx`:

```ts
.catch((err: unknown) => {
  if (err instanceof DOMException && err.name === "AbortError") return;
  setLoadError(err instanceof ApiError ? err.message : "Could not load products.");
});
```

The DEV-only fallback in `products.ts` already covers local development.

---

## 9. Local development

1. Run the backend on `http://localhost:8080`. Vite proxies `/api` there (`vite.config.ts`).
2. Run `npm run dev` in `web/`.
3. Without a backend, products fall back to `sampleProducts` (development only, under the intended design). Checkout cannot complete an order without the backend.
4. Use Razorpay **test-mode** keys on the backend. Test payments need Razorpay's test cards or UPI test IDs, available in Razorpay's documentation.
5. Confirm the `localStorage` key `honey-cart` persists the cart across reloads.

---

## 10. Testing checklist

- [ ] Products render with name, description, price and MRP.
- [ ] `+` stops at 20. `−` at 0 removes the item.
- [ ] Out-of-stock products show "Out of stock" and cannot be added.
- [ ] Subtotal and savings match a hand calculation for a mixed cart.
- [ ] Reload keeps the cart. Clearing `localStorage` empties it.
- [ ] Empty name, bad phone, and bad email each show an inline error.
- [ ] Pay with an empty cart shows "Your cart is empty."
- [ ] Backend order failure shows the backend's message and leaves the form filled.
- [ ] Closing the Razorpay widget re-enables Pay.
- [ ] Declined payment shows Razorpay's message and re-enables Pay.
- [ ] Successful payment and verification shows the success screen and clears the cart.
- [ ] Verification failure shows the payment id and keeps the cart.
- [ ] Amount shown by Razorpay equals `amountPaise` from the backend.
- [ ] Products endpoint failure in production shows an error, not sample products (see [section 8](#8-fallback-behaviour)).

---

## 11. Known gaps

- **No delivery address.** The form collects name, phone, email and city only. Shipping will need address fields and possibly a shipping charge in the backend's `breakdown`.
- **No stock reservation.** Stock is checked when the order is created, not reserved. Two customers can buy the last jar at the same time.
- **No webhook handling** in the frontend contract. See section 7.
- **Totals are an estimate.** The page does not show the backend's breakdown before the widget opens. The customer sees the server's amount only inside Razorpay.
- **Cart is not tied to an account.** There are no logins, so an order cannot be looked up later by the customer.
- **Deprecated type.** `Checkout.tsx` imports `FormEvent`, which TypeScript marks as deprecated. It works but should be replaced with the current event type.
- **Unused fields.** `imageUrl` on `Product` is declared but not rendered, and `loadError` is never set.
