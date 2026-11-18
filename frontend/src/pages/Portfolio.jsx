import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CountUp from "../components/CountUp";
import ProfitLoss from "../components/ProfitLoss";
import Spinner from "../components/Spinner";
import { useApi } from "../hooks";
import { formatINR } from "../utils/format";
import "../portfolio.css";

const COLORS = ["#2563eb", "#1fa855", "#f59e0b", "#8b5cf6", "#ef4444"];
const OTHERS_COLOR = "#94a3b8";
const CASH_COLOR = "#cbd5e1";

const COLUMNS = [
  { key: "symbol", label: "Symbol", align: "" },
  { key: "quantity", label: "Qty", align: "text-right" },
  { key: "avg_price", label: "Avg price", align: "text-right" },
  { key: "current_price", label: "Current", align: "text-right" },
  { key: "invested", label: "Invested", align: "text-right" },
  { key: "total_value", label: "Value", align: "text-right" },
  { key: "gain_loss", label: "P&L", align: "text-right" },
  { key: "weight", label: "Weight", align: "text-right" },
];

export default function Portfolio() {
  const { data, error, loading, refreshing, reload } = useApi("/portfolio/");
  const [sort, setSort] = useState({ key: "total_value", dir: "desc" });
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  const view = useMemo(() => {
    if (!data) return null;
    const rows = data.holdings.map((h) => {
      const priced = Boolean(h.current_price);
      const invested = h.avg_price * h.quantity;
      return {
        ...h,
        invested,
        priced,
        pct: priced && invested ? (h.gain_loss / invested) * 100 : 0,
      };
    });
    const priced = rows.filter((r) => r.priced);
    const invested = priced.reduce((n, r) => n + r.invested, 0);
    const gain = priced.reduce((n, r) => n + r.gain_loss, 0);
    rows.forEach((r) => { r.weight = data.net_worth ? (r.total_value / data.net_worth) * 100 : 0; });

    const maxWeight = Math.max(...rows.map((r) => r.weight), 0) || 1;
    rows.forEach((r) => { r.barWidth = (r.weight / maxWeight) * 100; });

    const byValue = [...rows].sort((a, b) => b.total_value - a.total_value);
    const segments = byValue.slice(0, COLORS.length).map((r, i) => ({ label: r.symbol, value: r.total_value, color: COLORS[i] }));
    const rest = byValue.slice(COLORS.length).reduce((n, r) => n + r.total_value, 0);
    if (rest > 0) segments.push({ label: "Others", value: rest, color: OTHERS_COLOR });
    segments.push({ label: "Cash", value: data.wallet_balance, color: CASH_COLOR });

    const ranked = [...priced].sort((a, b) => b.pct - a.pct);
    return {
      rows, invested, gain,
      gainPct: invested ? (gain / invested) * 100 : 0,
      segments,
      best: ranked[0], worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    };
  }, [data]);

  const sorted = useMemo(() => {
    if (!view) return [];
    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;
    return [...view.rows].sort((a, b) =>
      key === "symbol" ? factor * a.symbol.localeCompare(b.symbol) : factor * ((a[key] ?? 0) - (b[key] ?? 0))
    );
  }, [view, sort]);

  if (loading) return <Spinner label="Fetching live prices..." />;
  if (error && !data) return <div className="alert alert-danger">{error}</div>;

  const { wallet_balance, net_worth } = data;
  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" ? "asc" : "desc" }));

  const refresh = () => { reload(); setUpdatedAt(new Date()); };
  const totalForBar = view.segments.reduce((n, s) => n + s.value, 0) || 1;
  const time = updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="pf">
      <header className="pf-header">
        <div>
          <h2>Portfolio</h2>
          <p className="text-muted mb-0">Live prices as of {time}.</p>
        </div>
        <div className="pf-actions">
          <button className="btn btn-outline-secondary" onClick={refresh} disabled={refreshing}>
            <i className={`bi bi-arrow-clockwise ${refreshing ? "pf-spin" : ""}`} /> {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <Link to="/trade?mode=BUY" className="btn btn-success"><i className="bi bi-cart-plus" /> Buy</Link>
        </div>
      </header>

      {error && <div className="alert alert-warning py-2">Couldn't refresh prices: {error}</div>}

      <div className="row">
        <div className="col-6 col-lg-3 mb-3">
          <div className="pf-tile">
            <span>Net worth</span>
            <strong><CountUp value={net_worth} format={formatINR} /></strong>
            <small>Cash {formatINR(wallet_balance)}</small>
          </div>
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <div className="pf-tile">
            <span>Invested</span>
            <strong><CountUp value={view.invested} format={formatINR} /></strong>
            <small>{view.rows.length} holding{view.rows.length === 1 ? "" : "s"}</small>
          </div>
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <div className="pf-tile">
            <span>Current value</span>
            <strong><CountUp value={data.total_portfolio_value} format={formatINR} /></strong>
            <small>At live prices</small>
          </div>
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <div className={`pf-tile pf-return ${view.gain >= 0 ? "up" : "down"}`}>
            <span>Total return</span>
            <strong><CountUp value={view.gain} format={(n) => `${n >= 0 ? "+" : "−"}${formatINR(Math.abs(n))}`} /></strong>
            <small>{view.gain >= 0 ? "▲" : "▼"} {Math.abs(view.gainPct).toFixed(2)}%</small>
          </div>
        </div>
      </div>

      {!view.rows.length ? (
        <div className="card pf-empty">
          <i className="bi bi-pie-chart" />
          <h5>Your portfolio is empty</h5>
          <p className="text-muted">You have {formatINR(wallet_balance)} ready to invest. Pick a stock to get started.</p>
          <Link to="/trade" className="btn btn-success">Buy your first stock</Link>
        </div>
      ) : (
        <>
          <div className="card pf-card pf-alloc-card">
            <div className="pf-card-head">
              <strong>Allocation</strong>
              {view.best && (
                <span className="pf-insights">
                  <span title="Best performer">🏆 {view.best.symbol} <ProfitLoss amount={view.best.gain_loss} percent={view.best.pct} /></span>
                  {view.worst && (
                    <span title="Weakest performer">📉 {view.worst.symbol} <ProfitLoss amount={view.worst.gain_loss} percent={view.worst.pct} /></span>
                  )}
                </span>
              )}
            </div>
            <div className="pf-bar" role="img" aria-label="Portfolio allocation">
              {view.segments.map((s) => (
                <span key={s.label} style={{ width: `${(s.value / totalForBar) * 100}%`, background: s.color }}
                      title={`${s.label}: ${formatINR(s.value)}`} />
              ))}
            </div>
            <ul className="pf-legend">
              {view.segments.map((s) => (
                <li key={s.label}>
                  <i style={{ background: s.color }} /> {s.label}
                  <small className="text-muted"> {((s.value / totalForBar) * 100).toFixed(1)}%</small>
                </li>
              ))}
            </ul>
          </div>

          <div className="card pf-card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    {COLUMNS.map((c) => (
                      <th key={c.key} className={c.align}>
                        <button className="pf-sort" onClick={() => toggleSort(c.key)}>
                          {c.label}
                          {sort.key === c.key && <i className={`bi ${sort.dir === "asc" ? "bi-caret-up-fill" : "bi-caret-down-fill"}`} />}
                        </button>
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((h, i) => (
                    <tr key={h.symbol} className="pf-row" style={{ "--i": Math.min(i, 10) }}>
                      <td><strong>{h.symbol}</strong></td>
                      <td className="text-right">{h.quantity}</td>
                      <td className="text-right">{formatINR(h.avg_price)}</td>
                      <td className="text-right">{h.priced ? formatINR(h.current_price) : <span className="text-muted">N/A</span>}</td>
                      <td className="text-right">{formatINR(h.invested)}</td>
                      <td className="text-right">{h.priced ? formatINR(h.total_value) : <span className="text-muted">N/A</span>}</td>
                      <td className="text-right">
                        {h.priced ? <ProfitLoss amount={h.gain_loss} percent={h.pct} /> : <span className="text-muted">N/A</span>}
                      </td>
                      <td className="text-right">
                        <span className="pf-weight"><span style={{ width: `${h.barWidth}%` }} /></span>
                        {h.weight.toFixed(1)}%
                      </td>
                      <td className="text-right pf-row-actions">
                        <Link to={`/trade?symbol=${encodeURIComponent(h.symbol)}&mode=BUY`} className="btn btn-sm btn-outline-success">Buy</Link>{" "}
                        <Link to={`/trade?symbol=${encodeURIComponent(h.symbol)}&mode=SELL`} className="btn btn-sm btn-outline-danger">Sell</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
