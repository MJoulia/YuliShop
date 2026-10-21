// Single source of truth for the basket stored in localStorage.
export const LS_CART = "yulishop_cart";

export type CartItem = {
  id: string; // = sku, one line per variant
  productId: string;
  sku: string;
  slug?: string;
  name: string;
  brand?: string;
  variant?: string; // e.g. "50 ml"
  image?: string;
  priceCents: number; // display only; the server recalculates prices
  quantity: number;
  max?: number;
};

type StoredLine = Partial<CartItem> & { qty?: number; volumeMl?: number };

/** Older versions stored `qty` and no `id`; normalise so every page sees the same shape. */
function normalise(line: StoredLine): CartItem | null {
  const sku = line.sku ?? line.id;
  if (!sku || !line.productId || !line.name) return null;
  return {
    id: sku,
    productId: line.productId,
    sku,
    slug: line.slug,
    name: line.name,
    brand: line.brand,
    variant: line.variant ?? (line.volumeMl ? `${line.volumeMl} ml` : undefined),
    image: line.image,
    priceCents: Number(line.priceCents) || 0,
    quantity: Math.max(1, Number(line.quantity ?? line.qty) || 1),
    max: line.max,
  };
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_CART);
    const parsed: StoredLine[] = raw ? JSON.parse(raw) : [];
    return parsed.map(normalise).filter((x): x is CartItem => x !== null);
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(LS_CART, JSON.stringify(items));
    // The navbar badge listens for this; the native "storage" event only fires in other tabs.
    window.dispatchEvent(new Event("cart-updated"));
  } catch {
    /* storage full or blocked */
  }
}

export function addToCart(line: Omit<CartItem, "id">) {
  const cart = loadCart();
  const max = line.max ?? 99;
  const existing = cart.find((x) => x.sku === line.sku);
  if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, max);
  else cart.push({ ...line, id: line.sku, quantity: Math.min(line.quantity, max) });
  saveCart(cart);
}
