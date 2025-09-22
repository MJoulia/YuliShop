import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  requiredRole?: "user" | "admin"; // optionnel
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const token = localStorage.getItem("yulishop_token");
  const role = localStorage.getItem("yulishop_role") as "user" | "admin" | null;
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // si connecté mais pas le bon rôle → tu peux renvoyer vers home
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
