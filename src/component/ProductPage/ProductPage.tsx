import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./ProductPage.css";
import { API_URL } from "../../config";
import Navbar from "../Navbar/Navbar";

/* ===================== Types ===================== */
type Variant = { sku: string; volumeMl: number; priceCents: number; stock: number };
type Review = { id?: string; user: string; rating: number; comment: string; title?: string; createdAt?: string };
type Perfume = {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  description?: string;
  tags?: string[];
  images?: string[];
  variants?: Variant[];
  ratingAvg?: number;
  ratingCount?: number;
};

/* ===================== Helpers ===================== */
const fmtPrice = (cents?: number) =>
  typeof cents === "number" ? `${(cents / 100).toFixed(2)} €` : "—";

/* ===================== UI: Stars ===================== */
function Stars({
  value = 0,
  editable = false,
  onChange,
  size = 20,
}: {
  value?: number;
  editable?: boolean;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => editable && setHover(n)}
          onMouseLeave={() => editable && setHover(null)}
          onClick={() => editable && onChange?.(n)}
          aria-label={`${n} star`}
          title={editable ? `${n} / 5` : undefined}
          style={{
            cursor: editable ? "pointer" : "default",
            background: "none",
            border: "none",
            fontSize: size,
            lineHeight: 1,
            padding: 0,
          }}
        >
          {shown >= n ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

/* ===================== Page ===================== */
export default function ProductPage() {

  //Base64
  const [imageBase64, setImageBase64] = useState<string>("");

  const { slug } = useParams<{ slug: string }>();
  const [perfume, setPerfume] = useState<Perfume | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Variants
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);

  // Reviews (public list)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [limit] = useState<number>(50);

  // My review
  const [myRating, setMyRating] = useState<number>(0);
  const [myComment, setMyComment] = useState<string>("");
  const [myTitle, setMyTitle] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isLoggedIn = !!localStorage.getItem("yulishop_token");


  function convertToBase64(file: Blob): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);

      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  }

  async function getBase64FromUrl(url: string): Promise<string | ArrayBuffer | null> {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await convertToBase64(blob);
    console.log(base64)
    return base64
  }

  useEffect(() => {
    (async () => {
      const base64 = await getBase64FromUrl("./src/image/yuli.png"); 
      if (typeof base64 === "string") {
        setImageBase64(base64);
      }
    })();
  }, []);

  /* -------- Load product -------- */
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setErr(null);

    fetch(`${API_URL}/api/perfumes/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((doc: Perfume) => {
        setPerfume(doc);
        const firstSku = (doc.variants ?? [])[0]?.sku ?? null;
        setSelectedSku(firstSku);
        setQty(1);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  /* -------- Load reviews -------- */
  useEffect(() => {
    if (!slug) return;
    let abort = false;
    async function run() {
      try {
        setLoadingReviews(true);
        const res = await fetch(`${API_URL}/api/perfumes/${slug}/reviews?page=${page}&limit=${limit}`);
        const data = await res.json();
        if (abort) return;
        if (res.ok) {
          setReviews(data?.reviews || []);
          setTotalReviews(data?.total || 0);
        } else {
          setReviews([]);
          setTotalReviews(0);
        }
      } catch {
        if (!abort) {
          setReviews([]);
          setTotalReviews(0);
        }
      } finally {
        if (!abort) setLoadingReviews(false);
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [slug, page, limit]);

  /* -------- Prefill my review -------- */
  useEffect(() => {
    if (!slug || !isLoggedIn) return;
    let abort = false;
    async function run() {
      try {
        const token = localStorage.getItem("yulishop_token")!;
        const res = await fetch(`${API_URL}/api/perfumes/${slug}/reviews/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (abort || !data) return;
        setMyRating(Number(data.rating) || 0);
        setMyComment(String(data.comment || ""));
        setMyTitle(String(data.title || ""));
      } catch {
        /* ignore */
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [slug, isLoggedIn]);

  const currentVariant: Variant | undefined = useMemo(() => {
    if (!perfume) return undefined;
    const list = perfume.variants ?? [];
    if (!list.length) return undefined;
    return list.find((v) => v.sku === selectedSku) ?? list[0];
  }, [perfume, selectedSku]);

  const displayPrice = useMemo(() => {
    if (currentVariant) return fmtPrice(currentVariant.priceCents);
    const min = Math.min(...(perfume?.variants ?? []).map((v) => v.priceCents));
    return Number.isFinite(min) ? fmtPrice(min) : "—";
  }, [currentVariant, perfume?.variants]);

  const cover = useMemo(() => {
    return perfume?.images?.[0] || "/images/placeholder-perfume.jpg";
  }, [perfume]);

  function addToBasket() {
    if (!perfume || !currentVariant) return;
    if (qty < 1) return;

    const line = {
      productId: perfume._id,
      slug: perfume.slug,
      name: perfume.name,
      brand: perfume.brand,
      image: cover,
      sku: currentVariant.sku,
      volumeMl: currentVariant.volumeMl,
      priceCents: currentVariant.priceCents,
      qty: Math.min(qty, currentVariant.stock),
      max: currentVariant.stock,
    };

    const raw = localStorage.getItem("yulishop_cart");
    const cart: any[] = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex((x) => x.sku === line.sku);
    if (idx >= 0) {
      cart[idx].qty = Math.min(cart[idx].qty + line.qty, line.max);
    } else {
      cart.push(line);
    }
    localStorage.setItem("yulishop_cart", JSON.stringify(cart));

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = "Added to basket ✔";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1600);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn || !perfume) return;

    if (!myRating) {
      alert("Please select a rating (1–5).");
      return;
    }
    if ((myComment || "").trim().length < 3) {
      alert("Comment must be at least 3 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("yulishop_token")!;
      const res = await fetch(`${API_URL}/api/perfumes/${slug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: myRating, title: myTitle, comment: myComment }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Error submitting review");
        return;
      }

      // Refresh reviews
      const listRes = await fetch(`${API_URL}/api/perfumes/${slug}/reviews?page=${page}&limit=${limit}`);
      const listData = await listRes.json();
      setReviews(listData?.reviews || []);
      setTotalReviews(listData?.total || 0);

      // Update product rating
      setPerfume((prev) =>
        prev ? { ...prev, ratingAvg: data?.ratingAvg ?? prev.ratingAvg, ratingCount: data?.ratingCount ?? prev.ratingCount } : prev
      );

      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = "Thanks for your review!";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1600);
    } catch (e: any) {
      alert(e?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  /* -------- Rendering states -------- */
  if (!slug)
    return (
      <>
        <Navbar />
        <div className="container"><p className="alert">❌ Bad URL: missing slug</p></div>
      </>
    );
  if (loading)
    return (
      <>
        <Navbar />
        <div className="container"><div className="loader" /></div>
      </>
    );
  if (err)
    return (
      <>
        <Navbar />
        <div className="container"><p className="alert error">Error: {err}</p></div>
      </>
    );
  if (!perfume)
    return (
      <>
        <Navbar />
        <div className="container"><p className="alert">❌ Product not found</p></div>
      </>
    );

  /* -------- Main render -------- */
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="product">
          {/* Left: image */}
          <div className="gallery">
            { imageBase64 && 
              <img
                className="cover"
                src={imageBase64}
                alt="preview"
                width={200}
              />}
          </div>

          {/* Right: info */}
          <div className="info">
            <h1 className="title">{perfume.name}</h1>
            <div className="brand-line">
              <span className="brand">{perfume.brand}</span>
              <div className="rating-line" aria-label="Average rating">
                <Stars value={perfume.ratingAvg ?? 0} />
                <span className="rating-val">{(perfume.ratingAvg ?? 0).toFixed(1)}</span>
                <span className="rating-count">({perfume.ratingCount ?? 0})</span>
              </div>
            </div>

            {(perfume.tags ?? []).length > 0 && (
              <div className="tags">
                {(perfume.tags ?? []).map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>
            )}

            {perfume.description && <p className="desc">{perfume.description}</p>}

            {/* Variants + price */}
            {(perfume.variants ?? []).length > 0 && (
              <div className="purchase">
                <div className="row">
                  <label className="label">Volume</label>
                  <select
                    className="select"
                    value={selectedSku ?? ""}
                    onChange={(e) => setSelectedSku(e.target.value)}
                  >
                    {(perfume.variants ?? []).map((v) => (
                      <option key={v.sku} value={v.sku}>
                        {v.volumeMl} ml
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row">
                  <label className="label">Quantity</label>
                  <div className="qty">
                    <button className="btn minus" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <input
                      type="number"
                      min={1}
                      max={currentVariant?.stock ?? 99}
                      value={qty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || "1", 10);
                        const max = currentVariant?.stock ?? 99;
                        setQty(Math.min(Math.max(1, v), max));
                      }}
                    />
                    <button className="btn plus" onClick={() => setQty((q) => Math.min((currentVariant?.stock ?? 99), q + 1))}>+</button>
                  </div>
                  <div className="stock">
                    {currentVariant?.stock ? `${currentVariant.stock} in stock` : "Out of stock"}
                  </div>
                </div>

                <div className="cta">
                  <div className="price">{displayPrice}</div>
                  <button
                    className="btn primary"
                    disabled={!currentVariant || (currentVariant?.stock ?? 0) <= 0}
                    onClick={addToBasket}
                  >
                    Add to basket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== Reviews ===== */}
        <section className="feedback">
          <h2>Customer reviews</h2>

          {/* Form if logged in */}
          {isLoggedIn ? (
            <form className="feedback-form" onSubmit={submitReview}>
              <div className="row">
                <label>Rating</label>
                <Stars value={myRating} editable onChange={setMyRating} size={28} />
              </div>
              <div className="row">
                <label>Title (optional)</label>
                <input
                  type="text"
                  value={myTitle}
                  onChange={(e) => setMyTitle(e.target.value)}
                  placeholder="Ex. Great longevity!"
                />
              </div>
              <div className="row">
                <label>Comment</label>
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Share your experience…"
                  rows={3}
                />
              </div>
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </form>
          ) : (
            <p className="muted">Log in to leave a review.</p>
          )}

          {/* Reviews list */}
          {loadingReviews ? (
            <div>Loading reviews…</div>
          ) : (
            <>
              <ul className="review-list">
                {reviews.length === 0 && <li>No reviews yet.</li>}
                {reviews.map((rv) => (
                  <li key={rv.id} className="review-item">
                    <div className="review-header">
                      <strong className="review-user">{rv.user || "User"}</strong>
                      <span><Stars value={rv.rating} /></span>
                      <small className="review-date">
                        {rv.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ""}
                      </small>
                    </div>
                    {rv.title && <div className="review-title">{rv.title}</div>}
                    {rv.comment && <p className="review-comment">{rv.comment}</p>}
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalReviews > limit && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    disabled={page * limit >= totalReviews}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
