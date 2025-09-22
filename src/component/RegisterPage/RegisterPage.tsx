import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";
import Navbar from "../Navbar/Navbar.tsx"; // adapte le chemin si besoin
import { API_URL } from "../../config.ts";

interface RegisterResponse {
  token?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "user" | "admin";
    avatarUrl?: string;
  };
  message?: string;
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleRegister(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          address,
          password,
        }),
      });

      const data: RegisterResponse = await res.json();

      if (!res.ok || !data?.token) {
        setError(data?.message || "Registration failed");
        return;
      }

      // 🔐 Stocker auth
      localStorage.setItem("yulishop_token", data.token);
      localStorage.setItem("yulishop_role", data.user?.role || "user");

      // 🧑‍💼 Sauvegarder prénom
      if (data.user?.firstName) {
        const capFirst =
          data.user.firstName.charAt(0).toUpperCase() +
          data.user.firstName.slice(1);
        localStorage.setItem("firstName", capFirst);
      }

      // 🖼️ Avatar optionnel
      if (data.user?.avatarUrl) {
        localStorage.setItem("avatar", data.user.avatarUrl);
      }

      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Register error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="register-container">
        <div className="register-card">
          <h1>Create account</h1>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleRegister}>
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              className="input-field"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              className="input-field"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label htmlFor="address">Address (optional)</label>
            <input
              id="address"
              type="text"
              placeholder="Enter your address"
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="register-actions">
              <button className="register-btn" type="submit" disabled={loading}>
                {loading ? "Registering..." : "Sign up"}
              </button>
            </div>
          </form>

          <p className="link">
            Already have an account? <Link to="/">Log in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
