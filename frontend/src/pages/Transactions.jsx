import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CountUp from "../components/CountUp";
import Spinner from "../components/Spinner";
import TransactionBadge from "../components/TransactionBadge";
import { useApi } from "../hooks";
import { downloadCsv } from "../utils/csv";
import { formatINR } from "../utils/format";
import "../transactions.css";

const PAGE_SIZE = 15;

const SORTS = {
  newest: { label: "Newest first", fn: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  oldest: { label: "Oldest first", fn: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
  largest: { label: "Largest amount", fn: (a, b) => b.total - a.total },
};

const day = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const time = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export default function Transactions() {
  const { data, error, loading } = useApi("/transactions/");
  const [type, setType] = useState("ALL");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const stats = useMemo(() => {
    const all = data || [];
    const sum = (t) => all.filter((x) => x.transaction_type === t).reduce((n, x) => n + x.total, 0);
    return {
      count: all.length,
      bought: sum("BUY"),
      sold: sum("SELL"),
      buys: all.filter((x) => x.transaction_type === "BUY").length,
      sells: all.filter((x) => x.transaction_type === "SELL").length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return (data || [])
      .filter((t) => (type === "ALL" || t.transaction_type === type) && (!q || t.symbol.toUpperCase().includes(q)))
      .sort(SORTS[sort].fn);
  }, [data, type, query, sort]);

  if (loading) return <Spinner label="Loading your trades..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const shown = filtered.slice(0, visible);
  const reset = (setter) => (e) => { setter(e.target?.value ?? e); setVisible(PAGE_SIZE); };

  const exportCsv = () =>
    downloadCsv(
      `kbfinance-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Time", "Symbol", "Type", "Quantity", "Price", "Total"],
      filtered.map((t) => [day(t.created_at), time(t.created_at), t.symbol, t.transaction_type, t.quantity, t.price, t.total])
    );

  return (
    <div className="tx">
      <header className="tx-header">
        <div>
          <h2>Transaction History</h2>
          <p className="text-muted mb-0">Every buy and sell you've made, newest first.</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={exportCsv} disabled={!filtered.length}>
          <i className="bi bi-download" /> Export CSV
        </button>
      </header>

      <div className="row">
        <div className="col-sm-4 mb-3">
          <div className="tx-tile">
            <span><i className="bi bi-arrow-left-right" /> Total trades</span>
            <strong><CountUp value={stats.count} format={(n) => Math.round(n)} /></strong>
            <small>{stats.buys} buys &middot; {stats.sells} sells</small>
          </div>
        </div>
        <div className="col-sm-4 mb-3">
          <div className="tx-tile">
            <span><i className="bi bi-arrow-up-circle text-success" /> Total bought</span>
            <strong><CountUp value={stats.bought} format={formatINR} /></strong>
            <small>Cash spent on buys</small>
          </div>
        </div>
        <div className="col-sm-4 mb-3">
          <div className="tx-tile">
            <span><i className="bi bi-arrow-down-circle text-danger" /> Total sold</span>
            <strong><CountUp value={stats.sold} format={formatINR} /></strong>
            <small>Cash received from sells</small>
          </div>
        </div>
      </div>

      {!stats.count ? (
        <div className="card tx-empty">
          <i className="bi bi-receipt" />
          <h5>No trades yet</h5>
          <p className="text-muted">Your buys and sells will show up here.</p>
          <Link to="/trade" className="btn btn-success">Make your first trade</Link>
        </div>
      ) : (
        <div className="card tx-card">
          <div className="tx-toolbar">
            <div className="tx-seg" role="tablist" aria-label="Filter by type">
              {[["ALL", "All"], ["BUY", "Buys"], ["SELL", "Sells"]].map(([value, label]) => (
                <button key={value} role="tab" aria-selected={type === value}
                        className={type === value ? "active" : ""} onClick={() => reset(setType)(value)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="tx-search">
              <i className="bi bi-search" />
              <input className="form-control" placeholder="Search symbol" value={query}
                     onChange={reset(setQuery)} aria-label="Search by symbol" />
              {query && (
                <button className="tx-clear" onClick={() => reset(setQuery)("")} aria-label="Clear search">
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>

            <select className="custom-select tx-sort" value={sort} onChange={reset(setSort)} aria-label="Sort">
              {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </select>
          </div>

          {filtered.length ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr><th>Date</th><th>Symbol</th><th>Type</th><th className="text-right">Qty</th>
                        <th className="text-right">Price</th><th className="text-right">Amount</th></tr>
                  </thead>
                  <tbody>
                    {shown.map((t, i) => (
                      <tr key={t.id} className="tx-row" style={{ "--i": Math.min(i, 12) }}>
                        <td>
                          {day(t.created_at)}
                          <small className="text-muted d-block">{time(t.created_at)}</small>
                        </td>
                        <td><strong>{t.symbol}</strong></td>
                        <td><TransactionBadge type={t.transaction_type} /></td>
                        <td className="text-right">{t.quantity}</td>
                        <td className="text-right">{formatINR(t.price)}</td>
                        <td className={`text-right tx-amount ${t.transaction_type === "BUY" ? "out" : "in"}`}>
                          {t.transaction_type === "BUY" ? "−" : "+"}{formatINR(t.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="tx-footer">
                <span className="text-muted">Showing {shown.length} of {filtered.length}</span>
                {shown.length < filtered.length && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show more
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="tx-empty tx-empty-inline">
              <i className="bi bi-funnel" />
              <p className="mb-2">No trades match your filters.</p>
              <button className="btn btn-sm btn-outline-secondary"
                      onClick={() => { setType("ALL"); setQuery(""); }}>Clear filters</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
