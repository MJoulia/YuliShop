import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LogOut, ShoppingCart } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, role, logout } = useAuth();

  const path = location.pathname.toLowerCase();
  const isLoginPage = path === "/";
  const isRegisterPage = path === "/register";

  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);
  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // ---- Cart count (LS: yulishop_cart) ----
  const [cartCount, setCartCount] = useState<number>(0);

  const getCartCountFromLS = () => {
    try {
      const raw = localStorage.getItem("yulishop_cart");
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return 0;
      return arr.reduce((n: number, it: any) => n + (Number(it?.quantity) || 0), 0);
    } catch {
      return 0;
    }
  };

  // Initial + refresh on location change
  useEffect(() => {
    setCartCount(getCartCountFromLS());
  }, [location.pathname]);

  // Listen to storage changes (other tabs) and optional custom events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "yulishop_cart") setCartCount(getCartCountFromLS());
    };
    const onCartUpdated = () => setCartCount(getCartCountFromLS());

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart-updated", onCartUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart-updated", onCartUpdated as EventListener);
    };
  }, []);

  return (
    <header className="navbar">
      <div
        className="brand"
        onClick={() => {
          closeMenu();
          navigate("/home");
        }}
      >
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
        <Link to="/home" onClick={closeMenu}>
          Home
        </Link>
        <Link to="/collection" onClick={closeMenu}>
          My Collection
        </Link>
        <Link to="/review" onClick={closeMenu}>
          Review
        </Link>
        {role === "admin" && (
          <Link to="/perfume-manager" onClick={closeMenu}>
            Perfumes
          </Link>
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
          <div className="user-actions">
            <Link
              to="/cart"
              onClick={closeMenu}
              className="icon-btn cart-btn"
              title="Cart"
              aria-label="Open shopping cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>

            <button
              className="icon-btn logout-btn"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
