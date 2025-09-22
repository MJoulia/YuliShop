import { useEffect, useState } from "react";
import "./PerfumeManager.css";

type Variant = {
  sku?: string;
  volumeMl: number;
  priceCents: number;
  stock: number;
};

type Perfume = {
  _id?: string;
  slug?: string;
  name: string;
  brand: string;
  description?: string;
  olfactoryFamilies?: string[];
  genderTarget?: "unisex" | "femme" | "homme";
  priceCents: number;
  variants?: Variant[];
};

export default function PerfumeManager() {
  const [items, setItems] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Perfume | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("yulishop_token")}`,
  };

  // Load perfumes
  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/perfumes?search=${encodeURIComponent(q)}`, { headers });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load perfumes:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Delete perfume
  async function handleDelete(id: string) {
    if (!window.confirm("Delete this perfume?")) return;
    try {
      await fetch(`${API_URL}/api/admin/perfumes/${id}`, {
        method: "DELETE",
        headers,
      });
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  // Save perfume (create or update)
  async function handleSave(p: Perfume) {
    try {
      const method = p._id ? "PUT" : "POST";
      const url = p._id
        ? `${API_URL}/api/admin/perfumes/${p._id}`
        : `${API_URL}/api/admin/perfumes`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(p),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Save failed");
      }

      setEditing(null);
      load();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving perfume");
    }
  }

  // Empty template
  function emptyPerfume(): Perfume {
    return {
      name: "",
      brand: "",
      description: "",
      priceCents: 0,
      variants: [],
      olfactoryFamilies: [],
      genderTarget: "unisex",
    };
  }

  return (
    <div className="pm">
      <h1 className="pm__title">Perfume Manager (Admin)</h1>

      <div className="pm__toolbar">
        <input
          type="text"
          placeholder="Search by name or brand"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="pm__btn" onClick={load}>
          Search
        </button>
        <button
          className="pm__btn pm__btn--ghost"
          onClick={() => setEditing(emptyPerfume())}
        >
          ➕ Add Perfume
        </button>
      </div>

      {loading ? (
        <div className="pm__empty">Loading…</div>
      ) : items.length === 0 ? (
        <div className="pm__empty">No perfumes found</div>
      ) : (
        <table className="pm__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Slug</th>
              <th>Variants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.brand}</td>
                <td>{p.slug}</td>
                <td>
                  <div className="pm__chips">
                    {p.variants?.map((v, i) => (
                      <span key={i} className="pm__chip">
                        {v.volumeMl}ml • {(v.priceCents / 100).toFixed(2)}€ • stock {v.stock}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="pm__row-actions">
                    <button className="pm__icon-btn" onClick={() => setEditing(p)}>
                      ✏️
                    </button>
                    <button
                      className="pm__icon-btn pm__danger"
                      onClick={() => handleDelete(p._id!)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div className="pm__card">
          <h3>{editing._id ? "Edit Perfume" : "Add Perfume"}</h3>

          <div className="pm__grid">
            <div className="pm__field">
              <label>Name</label>
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </div>
            <div className="pm__field">
              <label>Brand</label>
              <input
                value={editing.brand}
                onChange={(e) =>
                  setEditing({ ...editing, brand: e.target.value })
                }
              />
            </div>
            <div className="pm__field pm__grid--full">
              <label>Description</label>
              <textarea
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Variants</h4>
          <div className="pm__variants">
            {(editing.variants || []).map((v, i) => (
              <div className="pm__variant-row" key={i}>
                <input
                  placeholder="SKU"
                  value={v.sku || ""}
                  onChange={(e) => {
                    const variants = [...(editing.variants || [])];
                    variants[i] = { ...variants[i], sku: e.target.value };
                    setEditing({ ...editing, variants });
                  }}
                />
                <input
                  type="number"
                  placeholder="Volume (ml)"
                  value={v.volumeMl}
                  onChange={(e) => {
                    const variants = [...(editing.variants || [])];
                    variants[i] = {
                      ...variants[i],
                      volumeMl: Number(e.target.value),
                    };
                    setEditing({ ...editing, variants });
                  }}
                />
                <input
                  type="number"
                  placeholder="Price (cents)"
                  value={v.priceCents}
                  onChange={(e) => {
                    const variants = [...(editing.variants || [])];
                    variants[i] = {
                      ...variants[i],
                      priceCents: Number(e.target.value),
                    };
                    setEditing({ ...editing, variants });
                  }}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => {
                    const variants = [...(editing.variants || [])];
                    variants[i] = {
                      ...variants[i],
                      stock: Number(e.target.value),
                    };
                    setEditing({ ...editing, variants });
                  }}
                />
                <button
                  className="pm__icon-btn pm__danger"
                  onClick={() => {
                    const variants = [...(editing.variants || [])];
                    variants.splice(i, 1);
                    setEditing({ ...editing, variants });
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
            <button
              className="pm__btn"
              onClick={() =>
                setEditing({
                  ...editing,
                  variants: [
                    ...(editing.variants || []),
                    { sku: "", volumeMl: 0, priceCents: 0, stock: 0 },
                  ],
                })
              }
            >
              ➕ Add Variant
            </button>
          </div>

          <div className="pm__actions">
            <button className="pm__btn" onClick={() => handleSave(editing)}>
              Save
            </button>
            <button className="pm__btn pm__btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
