import { sampleProducts } from "../data/products";
import { ApiError } from "./registrations";

export type Product = {
  id: string;
  name: string;
  description?: string;
  /** Selling price in paise (1 INR = 100 paise). Integers only. */
  pricePaise: number;
  /** Maximum retail price in paise, if the product is discounted. */
  mrpPaise?: number;
  imageUrl?: string;
  inStock: boolean;
};

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  try {
    return await fetchProductsFromApi(signal);
  } catch (err) {
    // Dev only: fall back to sample products when no backend is running.
    // Production never falls back, so customers see the real error.
    if (import.meta.env.DEV && !(err instanceof DOMException)) {
      return sampleProducts;
    }
    throw err;
  }
}

async function fetchProductsFromApi(signal?: AbortSignal): Promise<Product[]> {
  let res: Response;
  try {
    res = await fetch("/api/v1/products", { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      "Cannot reach the server. Check your internet and try again.",
      0,
    );
  }

  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    throw new ApiError(
      problem.detail ?? "Could not load products.",
      res.status,
    );
  }
  return res.json();
}
