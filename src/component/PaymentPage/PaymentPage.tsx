import React, { useEffect, useMemo, useState } from "react";
import "./PaymentPage.css";
import Navbar from "../Navbar/Navbar";

type CartItem = {
  id: string;
  productId: string;
  name: string;
  brand?: string;
  variant?: string;
  image?: string;
  priceCents: number;
  quantity: number;
};

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  notes?: string;
};

type PendingOrder = {
  customer: Customer;
  items: CartItem[];
  shippingMethod: "standard" | "express";
  paymentMethod: "card" | "cod";
  totals: { subtotalCents: number; shippingCents: number; totalCents: number };
};

const LS_CART = "yulishop_cart";
const LS_PENDING = "yulishop_pending_order";

const fmtPrice = (cents: number, locale = "de-DE", currency = "EUR") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100
  );

// Luhn (validation carte simple)
const luhnValid = (num: string) => {
  const s = num.replace(/\s+/g, "");
  if (!/^\d{12,19}$/.test(s)) return false;
  let sum = 0, dbl = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = parseInt(s[i], 10);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
};

export default function PaymentPage() {
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PENDING);
      if (raw) setPending(JSON.parse(raw) as PendingOrder);
    } catch {}
  }, []);

  const validForm = useMemo(() => {
    const expOk = /^(\d{2})\/(\d{2})$/.test(cardExp);
    const cvcOk = /^\d{3,4}$/.test(cardCvc);
    const numOk = luhnValid(cardNumber);
    return cardName.trim().length > 2 && expOk && cvcOk && numOk && !!pending?.items.length;
  }, [cardNumber, cardName, cardExp, cardCvc, pending]);

  const payNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pending) {
      setError("No pending order. Please return to checkout.");
      return;
    }
    if (!validForm) {
      setError("Please fill valid card details.");
      return;
    }

    setPaying(true);
    try {
      // 🎭 MOCK: “confirmation” paiement (remplace par Stripe/PayPal plus tard)
      await new Promise((r) => setTimeout(r, 1000));

      // Puis création de l'ordre côté backend
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();

      // Nettoyage
      localStorage.removeItem(LS_PENDING);
      localStorage.setItem(LS_CART, JSON.stringify([]));
      setSuccessId(id);
    } catch (err: any) {
      setError(err?.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (!pending) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="container">
          <div className="panel">
            <h1>Payment</h1>
            <p>No pending order was found.</p>
            <button onClick={() => (window.location.href = "/checkout")} className="btn">
              Back to checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (successId) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="container">
          <div className="success-card">
            <h1>Payment successful 🎉</h1>
            <p>Your order has been placed.</p>
            <p><strong>Order ID:</strong> {successId}</p>
            <button className="btn" onClick={() => (window.location.href = "/home")}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { customer, items, totals } = pending;

  return (
    <div className="payment-page">
      <Navbar />
      <div className="container">
        <h1>Secure payment</h1>
        <div className="grid">
          {/* Left: card form */}
          <form className="panel" onSubmit={payNow} noValidate>
            <h2>Card details</h2>

            <label className="field">
              <span>Cardholder name</span>
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </label>

            <label className="field">
              <span>Card number</span>
              <input
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))
                }
                maxLength={23}
                required
              />
            </label>

            <div className="row two">
              <label className="field">
                <span>Expiry (MM/YY)</span>
                <input
                  inputMode="numeric"
                  placeholder="12/28"
                  value={cardExp}
                  onChange={(e) =>
                    setCardExp(
                      e.target.value
                        .replace(/[^\d]/g, "")
                        .slice(0, 4)
                        .replace(/(\d{2})(\d{0,2})/, (_, a, b) =>
                          b ? `${a}/${b}` : a
                        )
                    )
                  }
                  required
                />
              </label>
              <label className="field">
                <span>CVC</span>
                <input
                  inputMode="numeric"
                  placeholder="123"
                  value={cardCvc}
                  onChange={(e) =>
                    setCardCvc(e.target.value.replace(/[^\d]/g, "").slice(0, 4))
                  }
                  required
                />
              </label>
            </div>

            {error && <div className="error">{error}</div>}

            <button className="btn primary" type="submit" disabled={!validForm || paying} aria-busy={paying}>
              {paying ? "Processing..." : `Pay now • ${fmtPrice(totals.totalCents)}`}
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={() => (window.location.href = "/checkout")}
            >
              Back to checkout
            </button>

            <p className="disclaimer">
              Demo only — do not enter real card details. Replace with Stripe/PayPal in production.
            </p>
          </form>

          {/* Right: order summary */}
          <aside className="panel">
            <h2>Order summary</h2>
            <ul className="lines">
              {items.map((it) => (
                <li key={it.id} className="line">
                  <img
                    src={it.image || "https://via.placeholder.com/72x72?text=%20"}
                    alt={it.name}
                    loading="lazy"
                  />
                  <div className="meta">
                    <div className="title">
                      {it.name} {it.variant && `• ${it.variant}`}
                    </div>
                    <div className="brand-qty">
                      {it.brand && <span>{it.brand}</span>}
                      <span>Qty: {it.quantity}</span>
                    </div>
                  </div>
                  <div className="price">{fmtPrice(it.priceCents * it.quantity)}</div>
                </li>
              ))}
            </ul>

            <dl className="totals">
              <div><dt>Subtotal</dt><dd>{fmtPrice(totals.subtotalCents)}</dd></div>
              <div><dt>Shipping</dt><dd>{fmtPrice(totals.shippingCents)}</dd></div>
              <div className="grand"><dt>Total</dt><dd>{fmtPrice(totals.totalCents)}</dd></div>
            </dl>

            <div className="shipto">
              <h3>Ship to</h3>
              <p>
                {customer.firstName} {customer.lastName}<br />
                {customer.street}<br />
                {customer.postalCode} {customer.city}, {customer.country}<br />
                {customer.email}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
