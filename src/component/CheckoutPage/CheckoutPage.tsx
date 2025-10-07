import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CheckoutPage.css";
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
  max?: number;
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
  saveInfo?: boolean;
};

type ShippingMethod = "standard" | "express";

type Props = {
  onOrderPlaced?: (order: {
    id: string;
    customer: Customer;
    items: CartItem[];
    shippingMethod: ShippingMethod;
    paymentMethod: "card";
    totals: {
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
    };
  }) => void;
};

const LS_CART = "yulishop_cart";
const LS_CUSTOMER = "yulishop_customer";
const LS_PENDING_ORDER = "yulishop_pending_order";

const fmtPrice = (cents: number, locale = "de-DE", currency = "EUR") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100
  );

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(LS_CART);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const loadCustomer = (): Customer | null => {
  try {
    const raw = localStorage.getItem(LS_CUSTOMER);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
};

const saveCustomer = (c: Customer) => {
  try {
    localStorage.setItem(LS_CUSTOMER, JSON.stringify(c));
  } catch {}
};

export default function CheckoutPage({ onOrderPlaced }: Props) {
  const navigate = useNavigate();

  const [items, setItems] = useState<CartItem[]>(loadCart());
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");
  // 🚫 plus de choix de paiement : toujours "card"
  const paymentMethod: "card" = "card";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<Customer>(() => {
    return (
      loadCustomer() ?? {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        postalCode: "",
        country: "Germany",
        notes: "",
        saveInfo: true,
      }
    );
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_CART) setItems(loadCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const subtotalCents = useMemo(
    () => items.reduce((s, it) => s + it.priceCents * it.quantity, 0),
    [items]
  );

  // Livraison gratuite dès 100€, sinon 4.90€ / 9.90€
  const shippingCents = useMemo(() => {
    if (items.length === 0) return 0;
    if (subtotalCents >= 10000) return 0;
    return shippingMethod === "standard" ? 490 : 990;
  }, [items.length, shippingMethod, subtotalCents]);

  const totalCents = subtotalCents + shippingCents;

  const updateField =
    (k: keyof Customer) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v =
        e.currentTarget instanceof HTMLInputElement &&
        e.currentTarget.type === "checkbox"
          ? (e.currentTarget as HTMLInputElement).checked
          : e.currentTarget.value;
      setCustomer((prev) => ({ ...prev, [k]: v as any }));
    };

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const required = (v?: string) => !!v && v.trim().length >= 1; // tolérant
  const min2 = (v?: string) => !!v && v.trim().length >= 2;

  const formValid =
    min2(customer.firstName) &&
    min2(customer.lastName) &&
    isEmail(customer.email) &&
    required(customer.street) &&
    required(customer.city) &&
    required(customer.postalCode) &&
    required(customer.country) &&
    items.length > 0;

  const continueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formValid) {
      setError("Please complete all required fields correctly.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer,
        items,
        shippingMethod,
        paymentMethod,
        totals: { subtotalCents, shippingCents, totalCents },
      };

      // 👉 Toujours paiement par carte : stocke la commande en attente et va sur /pay
      localStorage.setItem(LS_PENDING_ORDER, JSON.stringify(payload));
      if (customer.saveInfo) saveCustomer(customer);
      setSubmitting(false);
      navigate("/pay");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="container">
        <h1>Checkout</h1>

        {items.length === 0 ? (
          <div className="empty">
            <p>Your cart is empty.</p>
            <button onClick={() => (window.location.href = "/home")}>
              Continue shopping
            </button>
          </div>
        ) : (
          <form className="grid" onSubmit={continueToPayment} noValidate>
            {/* Colonne gauche : infos client */}
            <section className="panel">
              <h2>Shipping details</h2>

              <div className="row two">
                <Field
                  label="First name"
                  required
                  value={customer.firstName}
                  onChange={updateField("firstName")}
                />
                <Field
                  label="Last name"
                  required
                  value={customer.lastName}
                  onChange={updateField("lastName")}
                />
              </div>

              <div className="row">
                <Field
                  label="Email"
                  type="email"
                  required
                  value={customer.email}
                  onChange={updateField("email")}
                  placeholder="you@example.com"
                />
              </div>

              <div className="row">
                <Field
                  label="Phone (optional)"
                  type="tel"
                  value={customer.phone || ""}
                  onChange={updateField("phone")}
                  placeholder="+49 ..."
                />
              </div>

              <div className="row">
                <Field
                  label="Street address"
                  required
                  value={customer.street}
                  onChange={updateField("street")}
                  placeholder="Street and house number"
                />
              </div>

              <div className="row two">
                <Field
                  label="City"
                  required
                  value={customer.city}
                  onChange={updateField("city")}
                />
                <Field
                  label="Postal code"
                  required
                  value={customer.postalCode}
                  onChange={updateField("postalCode")}
                />
              </div>

              <div className="row">
                <Field
                  label="Country"
                  required
                  value={customer.country}
                  onChange={updateField("country")}
                />
              </div>

              <div className="row">
                <FieldArea
                  label="Order notes (optional)"
                  value={customer.notes || ""}
                  onChange={updateField("notes")}
                  placeholder="Delivery notes, door code, etc."
                />
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={!!customer.saveInfo}
                  onChange={updateField("saveInfo")}
                />
                <span>Save my details for next time</span>
              </label>
            </section>

            {/* Colonne droite : résumé + livraison (plus de bloc 'Payment' ici) */}
            <aside className="summary">
              <div className="panel">
                <h2>Order summary</h2>
                <ul className="lines">
                  {items.map((it) => (
                    <li key={it.id} className="line">
                      <img
                        src={
                          it.image ||
                          "https://via.placeholder.com/72x72?text=%20"
                        }
                        alt={it.name}
                        loading="lazy"
                      />
                      <div className="meta">
                        <div className="title">
                          {it.name} {it.variant ? `• ${it.variant}` : ""}
                        </div>
                        <div className="brand-qty">
                          {it.brand && <span>{it.brand}</span>}
                          <span>Qty: {it.quantity}</span>
                        </div>
                      </div>
                      <div className="price">
                        {fmtPrice(it.priceCents * it.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>

                <dl className="totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{fmtPrice(subtotalCents)}</dd>
                  </div>
                  <div>
                    <dt>Shipping</dt>
                    <dd>{fmtPrice(shippingCents)}</dd>
                  </div>
                  <div>
                    <dt>Tax</dt>
                    <dd>Included</dd>
                  </div>
                  <div className="grand">
                    <dt>Total</dt>
                    <dd>{fmtPrice(totalCents)}</dd>
                  </div>
                </dl>

                {/* info paiement fixe */}
                <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
                  Payment method: <strong>Credit/Debit Card</strong>
                </p>
              </div>

              <div className="panel">
                <h3>Shipping method</h3>
                <div className="choices">
                  <label
                    className={`choice ${
                      shippingMethod === "standard" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="ship"
                      value="standard"
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                    />
                    <div>
                      <div className="t">Standard (2–4 business days)</div>
                      <div className="s">
                        {subtotalCents >= 10000 ? "Free" : fmtPrice(490)}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`choice ${
                      shippingMethod === "express" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="ship"
                      value="express"
                      checked={shippingMethod === "express"}
                      onChange={() => setShippingMethod("express")}
                    />
                    <div>
                      <div className="t">Express (1–2 business days)</div>
                      <div className="s">
                        {subtotalCents >= 10000 ? "Free" : fmtPrice(990)}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {error && <div className="error">{error}</div>}

              <button
                className="place-order"
                type="submit"
                disabled={!formValid || submitting}
                aria-busy={submitting}
              >
                {submitting
                  ? "Processing..."
                  : `Continue to payment • ${fmtPrice(totalCents)}`}
              </button>

              <button
                type="button"
                className="back"
                onClick={() => (window.location.href = "/cart")}
              >
                Back to cart
              </button>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------- Small form controls ---------- */

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  const id = "f_" + label.replace(/\s+/g, "_").toLowerCase();
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label} {required && <em>*</em>}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function FieldArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  const id = "f_" + label.replace(/\s+/g, "_").toLowerCase();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  );
}
