import type { Product } from "../api/products";

/**
 * Sample catalogue. Used only in local development when the API is not
 * reachable, so the checkout page can be worked on without the backend.
 * Prices are in paise (₹450 = 45000).
 */
export const sampleProducts: Product[] = [
  {
    id: "honey-1l",
    name: "Pure Honey — 1 Litre",
    description: "Raw, unprocessed forest honey in a 1 litre jar.",
    pricePaise: 45000,
    mrpPaise: 50000,
    inStock: true,
  },
  {
    id: "honey-2l",
    name: "Pure Honey — 2 Litres",
    description: "Raw, unprocessed forest honey in a 2 litre jar. Best value.",
    pricePaise: 85000,
    mrpPaise: 95000,
    inStock: true,
  },
];
