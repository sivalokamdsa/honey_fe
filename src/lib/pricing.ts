import type { Product } from "../api/products";

export type CartLine = {
  product: Product;
  quantity: number;
};

/** Formats paise as INR, e.g. 45000 -> "₹450.00". */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}

export function lineTotalPaise(line: CartLine): number {
  return line.product.pricePaise * line.quantity;
}

export function subtotalPaise(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalPaise(line), 0);
}

/** Savings against MRP, for products that carry one. Never negative. */
export function savingsPaise(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    const mrp = line.product.mrpPaise;
    if (mrp === undefined || mrp <= line.product.pricePaise) return sum;
    return sum + (mrp - line.product.pricePaise) * line.quantity;
  }, 0);
}
