import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmation: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <h2>Register</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <input className="form-control" name="username" placeholder="Username" autoFocus
                 autoComplete="username" value={form.username} onChange={set} required />
        </div>
        <div className="form-group">
          <input className="form-control" type="email" name="email" placeholder="Email Address"
                 autoComplete="email" value={form.email} onChange={set} />
        </div>
        <div className="form-group">
          <input className="form-control" type="password" name="password" placeholder="Password"
                 autoComplete="new-password" value={form.password} onChange={set} required />
        </div>
        <div className="form-group">
          <input className="form-control" type="password" name="confirmation" placeholder="Confirm Password"
                 autoComplete="new-password" value={form.confirmation} onChange={set} required />
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Creating account..." : "Register"}</button>
      </form>
      <p className="mt-3">Already have an account? <Link to="/login">Log In here.</Link></p>
    </div>
  );
}
