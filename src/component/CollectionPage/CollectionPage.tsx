import { useEffect, useState } from "react";
import type { FC } from "react";
import Navbar from "../Navbar/Navbar";
import "./CollectionPage.css";

type Item = {
  id: string;
  name: string;
  image: string;
};

const CollectionPage: FC = () => {
  // Récup depuis le login / localStorage
  const [firstName, setFirstName] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("/images/default-avatar.jpg");

  useEffect(() => {
    const f = localStorage.getItem("firstName");
    if (f) setFirstName(f);
    const a = localStorage.getItem("avatar");
    if (a) setAvatar(a);
  }, []);

  // Données d’exemple – remplace par tes vraies données
  const collection: Item[] = [
    { id: "c1", name: "Rose Elixir",        image: "/images/rose-elixir.jpg" },
    { id: "c2", name: "Citrus Bloom",       image: "/images/citrus-bloom.jpg" },
    { id: "c3", name: "Woodland Whisper",   image: "/images/woodland-whisper.jpg" },
    { id: "c4", name: "Ocean Breeze",       image: "/images/ocean-breeze.jpg" },
  ];

  const wishlist: Item[] = [
    { id: "w1", name: "Midnight Orchid",    image: "/images/midnight-orchid.jpg" },
    { id: "w2", name: "Velvet Dusk",        image: "/images/velvet-dusk.jpg" },
  ];

  return (
    <>
      <Navbar />
      <main className="mc">
        {/* Header profil */}
        <section className="mc-header">
          <img className="mc-avatar" src={avatar} alt={firstName || "User"} />
          <div className="mc-user">
            <h2>{firstName || "Your Profile"}</h2>
            <p className="mc-sub">Fragrance Enthusiast</p>
            <p className="mc-joined">Joined 2021</p>
          </div>
        </section>

        {/* Onglets (statique pour l’instant) */}
        <nav className="mc-tabs">
          <button className="active">My Collection</button>
          <button className="ghost" disabled>Reviews</button>
        </nav>

        {/* Section collection */}
        <section className="mc-section">
          <h3>My Collection</h3>
          {collection.length === 0 ? (
            <div className="mc-empty">
              You haven’t purchased any perfumes yet.
            </div>
          ) : (
            <div className="mc-grid">
              {collection.map((it) => (
                <article key={it.id} className="mc-card">
                  <img src={it.image} alt={it.name} loading="lazy" />
                  <h4>{it.name}</h4>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Section wishlist */}
        <section className="mc-section">
          <h3>Wishlist</h3>
          {wishlist.length === 0 ? (
            <div className="mc-empty">
              Your wishlist is empty.
            </div>
          ) : (
            <div className="mc-grid mc-grid-large">
              {wishlist.map((it) => (
                <article key={it.id} className="mc-card mc-card-large">
                  <img src={it.image} alt={it.name} loading="lazy" />
                  <h4>{it.name}</h4>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default CollectionPage;
