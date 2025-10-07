import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ShoppingCartPage.css";
import Navbar from "../Navbar/Navbar"; // ✅ Navbar

// --- Types
export type CartItem = {
  id: string;
  productId: string;
  name: string;
  brand?: string;
  variant?: string;
  image?: string;
  priceCents: number;
  quantity: number;
  max?: number;
};

// --- Utils
const fmtPrice = (cents: number, locale = "de-DE", currency = "EUR") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100
  );

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

// --- LocalStorage helpers
const LS_KEY = "yulishop_cart";
const loadFromLS = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};
const saveToLS = (items: CartItem[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
};

// --- Props
type Props = {
  initialItems?: CartItem[];
  shippingCents?: number;
  onCheckout?: (summary: {
    items: CartItem[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
  }) => void;
};

// --- Component
export default function ShoppingCartPage({
  initialItems,
  shippingCents = 0,
  onCheckout,
}: Props) {
  const [items, setItems] = useState<CartItem[]>(initialItems ?? loadFromLS());
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const navigate = useNavigate();

  const discountRate = appliedPromo === "WELCOME10" ? 0.1 : 0;

  useEffect(() => {
    if (!initialItems) saveToLS(items);
  }, [items, initialItems]);

  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + it.priceCents * it.quantity, 0),
    [items]
  );

  const discountCents = useMemo(
    () => Math.round(subtotalCents * discountRate),
    [subtotalCents, discountRate]
  );
  const taxedCents = subtotalCents - discountCents;
  const totalCents = taxedCents + (items.length ? shippingCents : 0);

  const updateQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, quantity: clamp(qty, 1, it.max ?? 99) }
          : it
      )
    );
  };
  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));
  const clearCart = () => setItems([]);

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    setAppliedPromo(code);
    setPromo("");
  };

  const handleLegacyCheckout = () => {
    // Optionnel : conserve l'alerte + callback si tu l'utilises encore
    const summary = {
      items,
      subtotalCents,
      shippingCents: items.length ? shippingCents : 0,
      totalCents,
    };
    if (onCheckout) onCheckout(summary);
    alert(`Checkout → Total: ${fmtPrice(totalCents)}`);
  };

  return (
    <div className="shopping-page">
      {/* ✅ Navbar en haut */}
      <Navbar />

      <div className="container">
        <h1>Your Shopping Bag</h1>
        <p>Review your selected products, adjust quantities, and proceed to checkout.</p>

        {items.length === 0 ? (
          <EmptyState onContinue={() => (window.location.href = "/home")} />
        ) : (
          <div className="cart-grid">
            {/* Cart lines */}
            <section className="cart-items">
              <div className="cart-table">
                <div className="cart-header">
                  <div>Product</div>
                  <div>Price</div>
                  <div>Quantity</div>
                  <div>Subtotal</div>
                </div>

                <ul>
                  {items.map((it) => (
                    <li key={it.id} className="cart-row">
                      <div className="cart-product">
                        <img
                          src={
                            it.image ||
                            "https://via.placeholder.com/96x96?text=%20"
                          }
                          alt={it.name}
                          loading="lazy"
                        />
                        <div>
                          <h3>{it.name}</h3>
                          {it.brand && <p>{it.brand}</p>}
                          {it.variant && (
                            <p className="variant">{it.variant}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(it.id)}
                          aria-label={`Remove ${it.name}`}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="cart-price">
                        {fmtPrice(it.priceCents)}
                      </div>
                      <div className="cart-qty">
                        <QtyInput
                          value={it.quantity}
                          min={1}
                          max={it.max ?? 99}
                          onChange={(v) => updateQty(it.id, v)}
                        />
                      </div>
                      <div className="cart-subtotal">
                        {fmtPrice(it.priceCents * it.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="cart-footer">
                  <button onClick={clearCart}>Clear cart</button>

                  <div className="promo">
                    <input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      placeholder="Promo code"
                    />
                    <button onClick={applyPromo}>Apply</button>
                    {appliedPromo && <span>{appliedPromo} applied</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Summary */}
            <aside className="order-summary">
              <h2>Order Summary</h2>
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{fmtPrice(subtotalCents)}</dd>
                </div>
                {discountCents > 0 && (
                  <div>
                    <dt>Discount</dt>
                    <dd>−{fmtPrice(discountCents)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>{items.length ? fmtPrice(shippingCents) : fmtPrice(0)}</dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>Included</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{fmtPrice(totalCents)}</dd>
                </div>
              </dl>

              {/* ✅ Redirection vers /checkout */}
              <button
                onClick={() => navigate("/checkout")}
                className="checkout"
              >
                Checkout
              </button>

              {/* (Optionnel) Ancien comportement avec alerte */}
              {/* <button onClick={handleLegacyCheckout} className="checkout alt">Checkout (legacy)</button> */}

              <button
                onClick={() => (window.location.href = "/home")}
                className="continue"
              >
                Continue shopping
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Qty input component
function QtyInput({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(clamp(value - 1, min, max));
  const inc = () => onChange(clamp(value + 1, min, max));
  const onManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value || "0", 10);
    onChange(clamp(Number.isFinite(v) ? v : min, min, max));
  };

  return (
    <div className="qty-input">
      <button onClick={dec} aria-label="Decrease quantity">−</button>
      <input value={value} onChange={onManual} inputMode="numeric" />
      <button onClick={inc} aria-label="Increase quantity">+</button>
    </div>
  );
}

// --- Empty state
function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="empty-state">
      <p>Your bag is empty</p>
      <p>Start adding perfumes and products to see them here.</p>
      <button onClick={onContinue}>Browse products</button>
    </div>
  );
}

// --- Demo data (facultatif)
export const DemoCart: CartItem[] = [
  {
    id: "p1-100",
    productId: "p1",
    name: "Yuli A",
    brand: "Yuli",
    variant: "100 ml",
    image:
      "https://images.unsplash.com/photo-1605478054215-969413c1bc9d?q=80&w=400&auto=format&fit=crop",
    priceCents: 7900,
    quantity: 1,
    max: 6,
  },
];
