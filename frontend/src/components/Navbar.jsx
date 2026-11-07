import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "light");
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch { /* storage unavailable */ }
    setTheme(next);
  };
  return [theme, toggle];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();

  const close = () => setOpen(false);
  const link = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

  const handleLogout = async () => {
    close();
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <Link className="navbar-brand font-weight-bold" to="/" onClick={close}>
        <i className="bi bi-graph-up-arrow" /> KB Finance
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className={`collapse navbar-collapse${open ? " show" : ""}`}>
        <ul className="navbar-nav mr-auto">
          {user && (
            <>
              <li className="nav-item">
                <NavLink end to="/" className={link} onClick={close}><i className="bi bi-house" /> Home</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/portfolio" className={link} onClick={close}><i className="bi bi-briefcase" /> Portfolio</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/transactions" className={link} onClick={close}><i className="bi bi-clock-history" /> Transactions</NavLink>
              </li>
              <li className="nav-item">
                <Link to="/trade?mode=BUY" className="nav-link" onClick={close}><i className="bi bi-cart-plus" /> Buy</Link>
              </li>
              <li className="nav-item">
                <Link to="/trade?mode=SELL" className="nav-link" onClick={close}><i className="bi bi-cart-dash" /> Sell</Link>
              </li>
            </>
          )}
        </ul>

        <ul className="navbar-nav ml-auto">
          <li className="nav-item d-flex align-items-center ml-2 mr-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-light theme-toggle"
              title="Toggle dark mode"
              onClick={toggleTheme}
            >
              <i className={`bi ${theme === "dark" ? "bi-sun-fill" : "bi-moon-fill"}`} />
            </button>
          </li>
          {user ? (
            <>
              <li className="nav-item">
                <NavLink to="/profile" className={link} onClick={close}><i className="bi bi-person-circle" /> {user.username}</NavLink>
              </li>
              <li className="nav-item">
                <button type="button" className="btn btn-link nav-link" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right" /> Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <NavLink to="/login" className={link} onClick={close}><i className="bi bi-box-arrow-in-right" /> Log In</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/register" className={link} onClick={close}><i className="bi bi-person-plus" /> Register</NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
