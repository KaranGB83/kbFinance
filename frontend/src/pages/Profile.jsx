import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";
import { useApi } from "../hooks";
import { formatINR } from "../utils/format";

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: me, error, loading } = useApi("/auth/me/");

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const initials = me.username.slice(0, 2).toUpperCase();

  return (
    <div className="profile-card card mx-auto">
      <div className="profile-banner">
        <div className="profile-avatar">{initials}</div>
      </div>
      <div className="card-body profile-body">
        <h4 className="mb-0">{me.username}</h4>
        <p className="text-muted">Member account &mdash; {me.email || "no email set"}</p>

        <div className="row mb-3">
          <div className="col-6">
            <div className="stat-card">
              <div className="stat-label">Wallet Balance</div>
              <div className="stat-value text-success">{formatINR(me.wallet_balance)}</div>
            </div>
          </div>
          <div className="col-6">
            <div className="stat-card">
              <div className="stat-label">Account</div>
              <div className="stat-value">Active</div>
            </div>
          </div>
        </div>

        <div className="d-flex">
          <Link to="/" className="btn btn-primary flex-fill mr-2">&rarr; Go to Dashboard</Link>
          <button
            className="btn btn-outline-secondary flex-fill"
            onClick={async () => { await logout(); navigate("/login"); }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
