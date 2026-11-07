import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(form.username, form.password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.status === 401 ? "Invalid username and/or password." : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <h2>Log In</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <input className="form-control" name="username" placeholder="Username" autoFocus
                 autoComplete="username" value={form.username} onChange={set} required />
        </div>
        <div className="form-group">
          <input className="form-control" type="password" name="password" placeholder="Password"
                 autoComplete="current-password" value={form.password} onChange={set} required />
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
      </form>
      <p className="mt-3">Don't have an account? <Link to="/register">Register here.</Link></p>
    </div>
  );
}
