// src/hooks/useAuth.tsx
import { useEffect, useState } from "react";

/** --- Types --- */
type Role = "user" | "admin" | null;

export interface AuthState {
  token: string | null;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  /** Ex: "JM" pour Joulia Martin */
  initials: string;
  /** Vrai si token présent */
  isLoggedIn: boolean;

  /** Enregistre la session après login et met à jour l'état immédiatement */
  login: (params: {
    token: string;
    role?: "user" | "admin";
    firstName?: string | null;
    lastName?: string | null;
  }) => void;

  /** Supprime la session local + état */
  logout: () => void;

  /** Recharge depuis localStorage (utile si tu modifies le storage ailleurs) */
  refresh: () => void;

  /** Mets à jour prénom/nom (et recalcule les initiales) */
  setNames: (firstName?: string | null, lastName?: string | null) => void;
}

/** --- Storage keys --- */
const TOKEN_KEY = "yulishop_token";
const ROLE_KEY = "yulishop_role";
const FIRSTNAME_KEY = "firstName";
const LASTNAME_KEY = "lastName";

/** --- Helpers --- */
function readRole(): Role {
  const r = localStorage.getItem(ROLE_KEY);
  return r === "admin" || r === "user" ? r : null;
}

function cleanName(s?: string | null) {
  return (s ?? "").trim() || null;
}

function initialsFrom(firstName?: string | null, lastName?: string | null) {
  const f = cleanName(firstName);
  const l = cleanName(lastName);

  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();

  // fallback: si pas de nom, prends 2 premières lettres du prénom (ou 1 si une seule)
  if (f) {
    const parts = f.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return f.slice(0, 2).toUpperCase();
  }

  return "U"; // ultime fallback (Unknown/User)
}

function readAll() {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = readRole();
  const firstName = cleanName(localStorage.getItem(FIRSTNAME_KEY));
  const lastName = cleanName(localStorage.getItem(LASTNAME_KEY));
  const initials = initialsFrom(firstName, lastName);
  return { token, role, firstName, lastName, initials };
}

/** --- Hook --- */
export function useAuth(): AuthState {
  const [{ token, role, firstName, lastName, initials }, setState] = useState(readAll);

  // Initialisation au montage + synchro inter-onglets
  useEffect(() => {
    const sync = () => setState(readAll());
    sync(); // important: charge l'état dès le montage
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const login: AuthState["login"] = ({ token, role, firstName, lastName }) => {
    // Écrit dans localStorage
    localStorage.setItem(TOKEN_KEY, token);
    if (role) localStorage.setItem(ROLE_KEY, role);
    if (firstName !== undefined) localStorage.setItem(FIRSTNAME_KEY, cleanName(firstName) ?? "");
    if (lastName !== undefined) localStorage.setItem(LASTNAME_KEY, cleanName(lastName) ?? "");

    // Met à jour l'état local immédiatement (le `storage` event ne se déclenche pas dans le même onglet)
    const fn = firstName ?? localStorage.getItem(FIRSTNAME_KEY);
    const ln = lastName ?? localStorage.getItem(LASTNAME_KEY);
    setState({
      token,
      role: role ?? readRole(),
      firstName: cleanName(fn),
      lastName: cleanName(ln),
      initials: initialsFrom(fn, ln),
    });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(FIRSTNAME_KEY);
    localStorage.removeItem(LASTNAME_KEY);

    setState({
      token: null,
      role: null,
      firstName: null,
      lastName: null,
      initials: "U",
    });
  };

  const refresh = () => setState(readAll());

  const setNames: AuthState["setNames"] = (firstName, lastName) => {
    if (firstName !== undefined) localStorage.setItem(FIRSTNAME_KEY, cleanName(firstName) ?? "");
    if (lastName !== undefined) localStorage.setItem(LASTNAME_KEY, cleanName(lastName) ?? "");
    const fn = firstName ?? localStorage.getItem(FIRSTNAME_KEY);
    const ln = lastName ?? localStorage.getItem(LASTNAME_KEY);
    setState((prev) => ({
      ...prev,
      firstName: cleanName(fn),
      lastName: cleanName(ln),
      initials: initialsFrom(fn, ln),
    }));
  };

  return {
    token,
    role,
    firstName,
    lastName,
    initials,
    isLoggedIn: !!token,
    login,
    logout,
    refresh,
    setNames,
  };
}
