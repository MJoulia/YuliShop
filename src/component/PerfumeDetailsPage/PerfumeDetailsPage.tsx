import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./PerfumeDetailsPage.css";

interface Variant {
  sku: string;
  volumeMl: number;
  priceCents: number;
  stock: number;
}

interface Review {
  user: string;
  rating: number;
  comment: string;
}

interface Perfume {
  name: string;
  slug: string;
  brand: string;
  description: string;
  tags: string[];
  variants: Variant[];
  reviews: Review[];
}

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [perfume, setPerfume] = useState<Perfume | null>(null);

  useEffect(() => {
    fetch(`http://localhost:5124/api/perfumes/${slug}`)
      .then((res) => res.json())
      .then(setPerfume)
      .catch(console.error);
  }, [slug]);

  if (!perfume) return <p>Loading...</p>;

  return (
    <div>
      <h1>{perfume.name}</h1>
      <p><strong>Brand:</strong> {perfume.brand}</p>
      <p>{perfume.description}</p>
      <ul>
        {perfume.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <h3>Variants</h3>
      {perfume.variants.map((v) => (
        <p key={v.sku}>
          {v.volumeMl} ml — {(v.priceCents / 100).toFixed(2)} €
        </p>
      ))}
      <h3>Reviews</h3>
      {perfume.reviews.map((r, i) => (
        <div key={i}>
          <strong>{r.user}</strong> ({r.rating}★) — {r.comment}
        </div>
      ))}
    </div>
  );
}
