
import { API_URL } from "../config";

export const API_BASE = `${API_URL}/api`;      // ⬅️ on ajoute /api ici
export const TOKEN_KEY = "yulishop_token";     // même clé partout

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

/** Appel générique JSON (GET/POST/PUT/DELETE) */
export async function http<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: finalHeaders,
    ...rest,
  });

  // Meilleure erreur lisible
  const text = await res.text();
  const data = safeJson(text);

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

function safeJson(s: string) {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
