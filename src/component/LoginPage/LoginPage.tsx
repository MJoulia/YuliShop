import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./LoginPage.css";
import Navbar from "../Navbar/Navbar.tsx"; // adapte si ton chemin diffère
import { API_URL } from "../../config.ts";

type Role = "user" | "admin";

type UserPayload = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
};

interface LoginResponse {
  token?: string;
  user?: UserPayload;
  message?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await res.json();

      if (!res.ok || !data?.token) {
        setError(data?.message || "Invalid credentials");
        return;
      }

      // 🔐 Stockage auth
      localStorage.setItem("yulishop_token", data.token);
      localStorage.setItem("yulishop_role", (data.user?.role as Role) || "user");

      // 🧑‍💼 Prénom pour l’UI
      if (data.user?.firstName) {
        const capFirst =
          data.user.firstName.charAt(0).toUpperCase() + data.user.firstName.slice(1);
        localStorage.setItem("firstName", capFirst);
      }

      // 🖼️ Avatar optionnel
      if (data.user?.avatarUrl) {
        localStorage.setItem("avatar", data.user.avatarUrl);
      }

      // ↪️ Redirection : retourne là d’où on vient, sinon /home
      const redirectTo =
        (location.state?.from?.pathname as string) || "/home";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <h1>Yuli</h1>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <div className="login-actions">
              <Link className="forgot" to="/forgot-password">
                Forgot password?
              </Link>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </button>
            </div>
          </form>

          <p className="link">
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </>
  );
}
