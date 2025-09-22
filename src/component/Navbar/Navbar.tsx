import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LogOut } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, role, logout } = useAuth();

  const path = location.pathname.toLowerCase();
  const isLoginPage = path === "/";
  const isRegisterPage = path === "/register";

  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);
  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="brand" onClick={() => { closeMenu(); navigate("/home"); }}>
        YuliShop
      </div>

      <button
        className="menu-toggle"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`navlinks ${open ? "open" : ""}`}>
        <Link to="/home" onClick={closeMenu}>Home</Link>
        <Link to="/collection" onClick={closeMenu}>My Collection</Link>
        <Link to="/review" onClick={closeMenu}>Review</Link>
        {role === "admin" && (
          <Link to="/perfume-manager" onClick={closeMenu}>Perfumes</Link>
        )}

        <div className="spacer" />

        {!isLoggedIn ? (
          <div className="auth-buttons">
            {isLoginPage && (
              <Link className="btn outline" to="/register" onClick={closeMenu}>
                Sign up
              </Link>
            )}
            {isRegisterPage && (
              <Link className="btn" to="/" onClick={closeMenu}>
                Login
              </Link>
            )}
            {!isLoginPage && !isRegisterPage && (
              <>
                <Link className="btn" to="/" onClick={closeMenu}>
                  Login
                </Link>
                <Link className="btn outline" to="/register" onClick={closeMenu}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        ) : (
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={22} strokeWidth={2.2} />
          </button>
        )}
      </nav>
    </header>
  );
}
