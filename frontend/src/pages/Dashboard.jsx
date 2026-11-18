import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import CountUp from "../components/CountUp";
import ProfitLoss from "../components/ProfitLoss";
import QuoteLookup from "../components/QuoteLookup";
import Spinner from "../components/Spinner";
import TransactionBadge from "../components/TransactionBadge";
import { useApi } from "../hooks";
import { formatDate, formatINR } from "../utils/format";
import "../dashboard.css";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useApi("/dashboard/");

  if (loading) return <Spinner label="Loading your dashboard..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const {
    wallet_balance, total_portfolio_value, net_worth, holdings_count,
    total_gain_loss, total_gain_loss_pct, top_holdings, recent_transactions,
  } = data;

  const cashShare = net_worth > 0 ? (wallet_balance / net_worth) * 100 : 100;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="dash">
      <header className="dash-header">
        <div>
          <h2>{greeting()}, {user?.username} <span className="wave" aria-hidden="true">👋</span></h2>
          <p className="text-muted mb-0">{today} &middot; Here's how your practice portfolio is doing.</p>
        </div>
        <div className="dash-actions">
          <Link to="/trade?mode=BUY" className="btn btn-success"><i className="bi bi-cart-plus" /> Buy</Link>
          <Link to="/trade?mode=SELL" className="btn btn-outline-danger"><i className="bi bi-cart-dash" /> Sell</Link>
        </div>
      </header>

      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="stat-tile tile-wallet">
            <p><i className="bi bi-wallet2" /> Wallet Balance</p>
            <h3><CountUp value={wallet_balance} format={formatINR} /></h3>
            <small>Available to trade</small>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="stat-tile tile-portfolio">
            <p><i className="bi bi-briefcase" /> Portfolio Value</p>
            <h3><CountUp value={total_portfolio_value} format={formatINR} /></h3>
            {holdings_count ? (
              <small>
                {holdings_count} holding{holdings_count === 1 ? "" : "s"} &middot;{" "}
                <ProfitLoss amount={total_gain_loss} percent={total_gain_loss_pct} className="on-dark" />
              </small>
            ) : (
              <small>No holdings yet</small>
            )}
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="stat-tile tile-networth">
            <p><i className="bi bi-graph-up" /> Net Worth</p>
            <h3><CountUp value={net_worth} format={formatINR} /></h3>
            <div className="alloc" title={`${cashShare.toFixed(0)}% cash`}>
              <span className="alloc-cash" style={{ width: `${cashShare}%` }} />
            </div>
            <small>{cashShare.toFixed(0)}% cash &middot; {(100 - cashShare).toFixed(0)}% invested</small>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4 dash-rise" style={{ "--d": "0.2s" }}>
          <QuoteLookup />
        </div>

        <div className="col-lg-6 mb-4 dash-rise" style={{ "--d": "0.3s" }}>
          <div className="card h-100">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <span><i className="bi bi-pie-chart" /> Top Holdings</span>
              <Link to="/portfolio" className="btn btn-sm btn-outline-light">Portfolio</Link>
            </div>
            <div className="card-body p-0">
              {top_holdings.length ? (
                <ul className="holding-list">
                  {top_holdings.map((h) => (
                    <li key={h.symbol}>
                      <div>
                        <strong>{h.symbol}</strong>
                        <small className="text-muted d-block">
                          {h.quantity} share{h.quantity === 1 ? "" : "s"} &middot; avg {formatINR(h.avg_price)}
                        </small>
                      </div>
                      <div className="text-right">
                        <strong>{formatINR(h.total_value)}</strong>
                        <small className="d-block">
                          {h.current_price ? <ProfitLoss amount={h.gain_loss} /> : <span className="text-muted">Price N/A</span>}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <i className="bi bi-rocket-takeoff" />
                  <p>Your portfolio is empty. Pick a stock and place your first practice trade.</p>
                  <Link to="/trade" className="btn btn-success btn-sm">Buy your first stock</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4 dash-rise" style={{ "--d": "0.4s" }}>
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <span><i className="bi bi-clock-history" /> Recent Transactions</span>
          <Link to="/transactions" className="btn btn-sm btn-outline-light">View All</Link>
        </div>
        <div className="card-body p-0">
          {recent_transactions.length ? (
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="thead-light">
                  <tr><th>Date</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {recent_transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="text-muted">{formatDate(t.created_at)}</td>
                      <td><strong>{t.symbol}</strong></td>
                      <td><TransactionBadge type={t.transaction_type} /></td>
                      <td>{t.quantity}</td>
                      <td>{formatINR(t.price)}</td>
                      <td>{formatINR(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <i className="bi bi-inbox" />
              <p>No transactions yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
