import "./App.css";
import { Routes, Route } from "react-router-dom";

// Pages publiques
import LoginPage from "./component/LoginPage/LoginPage";
import RegisterPage from "./component/RegisterPage/RegisterPage";
import HomePage from "./component/Home/HomePage";
import ProductPage from "./component/ProductPage/ProductPage";

// Pages protégées
import CollectionPage from "./component/CollectionPage/CollectionPage";
import ProtectedRoute from "./routes/ProtectedRoute";

// Admin
import ProtectedRouteAdmin from "./routes/ProtectedRouteAdmin";
import PerfumeManager from "./component/Admin/PerfumeManager";
import ShoppingCartPage from "./component/ShoppingCartPage/ShoppingCartPage";
import CheckoutPage from "./component/CheckoutPage/CheckoutPage";
import PaymentPage from "./component/PaymentPage/PaymentPage";
export default function App() {
  return (
    <Routes>
      {/* ---------- Routes publiques ---------- */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/home" element={<HomePage />} />

      {/* Produit */}
      <Route path="/product/:slug" element={<ProductPage />} />

      {/* ---------- Routes protégées (user connecté) ---------- */}
      <Route
        path="/collection"
        element={
          <ProtectedRoute>
            <CollectionPage />
          </ProtectedRoute>
        }
      />

      {/* Panier protégé (icône visible seulement connecté) */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <ShoppingCartPage />
          </ProtectedRoute>
        }
      />

      {/* ---------- Routes Admin ---------- */}
      <Route element={<ProtectedRouteAdmin />}>
        {/* Chemin admin “officiel” */}
        <Route path="/admin/perfumes" element={<PerfumeManager />} />
        {/* Alias pour matcher ton Navbar ("/perfume-manager") */}
        <Route path="/perfume-manager" element={<PerfumeManager />} />
      </Route>
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/pay" element={<PaymentPage />} />

      {/* ---------- 404 ---------- */}
      <Route path="*" element={<div style={{ padding: 16 }}>404 — Page introuvable</div>} />
    </Routes>
  );
}
