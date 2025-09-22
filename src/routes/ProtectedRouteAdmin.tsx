import { Navigate, Outlet, useLocation } from "react-router-dom";

function isLoggedIn() {
  return !!localStorage.getItem("yulishop_token");
}

function isAdmin() {
  return localStorage.getItem("yulishop_role") === "admin";
}

export default function ProtectedRouteAdmin() {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  if (!isAdmin()) {
    return <Navigate to="/" replace />; // ou vers une page "403 Accès interdit"
  }
  return <Outlet />; // rend le composant enfant
}
