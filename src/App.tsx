import './App.css';
import { Routes, Route } from 'react-router-dom';

// Pages publiques
import LoginPage from './component/LoginPage/LoginPage.tsx';
import RegisterPage from './component/RegisterPage/RegisterPage.tsx';
import HomePage from './component/Home/HomePage.tsx';
import ProductPage from './component/ProductPage/ProductPage.tsx';

// Pages protégées
import CollectionPage from './component/CollectionPage/CollectionPage.tsx';
import ProtectedRoute from './routes/ProtectedRoute.tsx';

// Admin
import ProtectedRouteAdmin from './routes/ProtectedRouteAdmin.tsx';
import PerfumeManager from './component/Admin/PerfumeManager.tsx';

export default function App() {
  return (
    <Routes>
      {/* ---------- Routes publiques ---------- */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/home" element={<HomePage />} />

      {/* Produit : j’ai changé le param en :slug pour être cohérent */}
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

      {/* ---------- Routes Admin ---------- */}
      <Route element={<ProtectedRouteAdmin />}>
        <Route path="/admin/perfumes" element={<PerfumeManager />} />
      </Route>

      {/* ---------- 404 ---------- */}
      <Route
        path="*"
        element={<div style={{ padding: 16 }}>404 — Page introuvable</div>}
      />
    </Routes>
  );
}
