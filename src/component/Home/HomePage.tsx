import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import "./HomePage.css";
import { API_URL } from "../../config";

/** Type tel que renvoyé par l'API */
type PerfumeAPI = {
  _id: string;
  slug?: string;
  name: string;
  brand: string;
  description?: string;
  images?: string[];
  priceCents?: number;
  ratingAvg?: number;
  ratingCount?: number;
};

/** utilitaires */
const fmtPrice = (priceCents?: number) =>
  typeof priceCents === "number" ? `${(priceCents / 100).toFixed(2)} €` : "—";

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="stars" aria-label={`${value} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <span key={i} className="star full">★</span>;
        if (i === full && half) return <span key={i} className="star half">★</span>;
        return <span key={i} className="star">☆</span>;
      })}
    </span>
  );
}

export default function HomePage() {
  const [firstName, setFirstName] = useState<string | null>(null);

  const [perfumes, setPerfumes] = useState<PerfumeAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  /** récupérer le prénom si login */
  useEffect(() => {
    const cached = localStorage.getItem("firstName");
    if (cached) setFirstName(cached);

    if (!cached) {
      const token = localStorage.getItem("yulishop_token");
      if (!token) return;
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const me = await res.json();
          const raw = me?.firstName || me?.name;
          if (raw) {
            const first = String(raw).trim().split(/\s+/)[0];
            const cap = first.charAt(0).toUpperCase() + first.slice(1);
            localStorage.setItem("firstName", cap);
            setFirstName(cap);
          }
        } catch {/* ignore */}
      })();
    }
  }, []);

  /** charger les parfums depuis l’API */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_URL}/api/perfumes?sort=recent&limit=24`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PerfumeAPI[] = await res.json();
        setPerfumes(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const title = useMemo(
    () => (firstName ? `Welcome back, ${firstName}` : "Welcome"),
    [firstName]
  );

  return (
    <>
      <Navbar />
      <main className="home">
        <h2 className="home-title">{title}</h2>

        <section className="home-section">
          <div className="home-head">
            <h3>Catalogue</h3>
            <span className="muted">
              {loading ? "Chargement…" : `${perfumes.length} parfum(s)`}
            </span>
          </div>

          {err && <div className="alert-error">❌ {err}</div>}

          {loading ? (
            <div className="card-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <article key={i} className="card skeleton">
                  <div className="thumb" />
                  <div className="line w60" />
                  <div className="line w40" />
                </article>
              ))}
            </div>
          ) : perfumes.length === 0 ? (
            <p>Aucun parfum trouvé.</p>
          ) : (
            <div className="card-grid">
              {perfumes.map((p) => {
                const to = `/product/${p.slug || p._id}`;
                const img =
                  p.images && p.images.length > 0
                    ? p.images[0]
                    : "/images/placeholder-perfume.jpg"; // fallback
                return (
                  <Link key={p._id} to={to} className="card card-link">
                    <img
                      className="card-img"
                      src={img}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/images/placeholder-perfume.jpg";
                      }}
                    />
                    <div className="card-body">
                      <h4 className="card-title">{p.name}</h4>
                      <div className="card-meta">
                        <span className="badge">{p.brand}</span>
                        <span className="price">{fmtPrice(p.priceCents)}</span>
                      </div>
                      <div className="rating">
                        <Stars value={p.ratingAvg ?? 0} />
                        <span className="rating-val">
                          {(p.ratingAvg ?? 0).toFixed(1)}
                          <span className="rating-count">
                            {" "}
                            ({p.ratingCount ?? 0})
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
