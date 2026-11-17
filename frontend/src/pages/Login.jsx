import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [attempt, setAttempt] = useState(0); // re-triggers the error shake

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
      setAttempt((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <h2>Welcome back</h2>
      <p className="auth-sub">Log in to pick up where you left off.</p>

      {error && <div key={attempt} className="alert alert-danger auth-error" role="alert">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-group">
          <input className="form-control" name="username" placeholder="Username" autoFocus
                 autoComplete="username" value={form.username} onChange={set} required />
        </div>
        <div className="form-group auth-pw">
          <input className="form-control" type={showPw ? "text" : "password"} name="password"
                 placeholder="Password" autoComplete="current-password"
                 value={form.password} onChange={set} required />
          <button type="button" className="auth-pw-toggle" onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}>
            <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} />
          </button>
        </div>
        <button className="btn btn-auth" disabled={busy}>
          {busy ? (<><span className="spinner-border spinner-border-sm mr-2" aria-hidden="true" />Logging in...</>) : "Log In"}
        </button>
      </form>

      <p className="mt-3 mb-0">New to KB Finance? <Link to="/register">Create a free account</Link></p>
      <p className="auth-hint"><i className="bi bi-shield-check" /> Practice trading only. No real money is involved.</p>
    </AuthLayout>
  );
}
