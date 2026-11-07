import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

const EXCHANGES = [
  { value: "NSE", label: "NSE" },
  { value: "BSE", label: "BSE" },
  { value: "OTHER", label: "Other" },
];

// "RELIANCE.NS" -> { symbol: "RELIANCE", exchange: "NSE" }
function parsePrefill(raw = "", exchangeHint = "NSE") {
  const upper = raw.toUpperCase();
  if (upper.endsWith(".NS")) return { symbol: upper.slice(0, -3), exchange: "NSE" };
  if (upper.endsWith(".BO")) return { symbol: upper.slice(0, -3), exchange: "BSE" };
  return { symbol: upper, exchange: EXCHANGES.some((e) => e.value === exchangeHint) ? exchangeHint : "NSE" };
}

export default function Trade() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initial = parsePrefill(params.get("symbol") || "", params.get("exchange") || "NSE");

  const [mode, setMode] = useState(params.get("mode") === "SELL" ? "SELL" : "BUY");
  const [symbol, setSymbol] = useState(initial.symbol);
  const [exchange, setExchange] = useState(initial.exchange);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const redirectTimer = useRef();

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  // Keep the Buy / Sell navbar links working while already on this page.
  const urlMode = params.get("mode");
  useEffect(() => {
    if (urlMode === "SELL" || urlMode === "BUY") setMode(urlMode);
  }, [urlMode]);

  const isBuy = mode === "BUY";

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const data = await api.post(isBuy ? "/buy/" : "/sell/", {
        symbol,
        quantity: parseInt(quantity, 10),
        exchange,
      });
      setSuccess(data.message);
      redirectTimer.current = setTimeout(() => navigate("/portfolio"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="trade-page">
      <div className="trade-card">
        <div className="trade-header">
          <i className={isBuy ? "bi bi-cart-plus" : "bi bi-cart-dash"} />
          <h4>{isBuy ? "Buy Stock" : "Sell Stock"}</h4>
        </div>

        <div className={`toggle-track ${isBuy ? "is-buy" : "is-sell"}`}>
          <div className="toggle-pill" />
          <button type="button" className={isBuy ? "active" : ""} onClick={() => setMode("BUY")}>
            <i className="bi bi-arrow-up-circle" /> BUY
          </button>
          <button type="button" className={!isBuy ? "active" : ""} onClick={() => setMode("SELL")}>
            <i className="bi bi-arrow-down-circle" /> SELL
          </button>
        </div>

        <label className="trade-label">Exchange</label>
        <div className="exchange-track">
          {EXCHANGES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={exchange === value ? "active" : ""}
              onClick={() => setExchange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {exchange === "OTHER" && (
          <p className="small text-muted mt-2 mb-0">
            Enter the full yfinance symbol (e.g. <code>GOLD.NS</code>, <code>NIFTY50.NS</code>)
          </p>
        )}

        <form onSubmit={submit} className="mt-4">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <label className="trade-label" htmlFor="symbol">Stock Symbol</label>
          <input
            id="symbol"
            className="form-control trade-input"
            value={symbol}
            autoFocus
            required
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />

          <label className="trade-label mt-3" htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            className="form-control trade-input"
            value={quantity}
            required
            onChange={(e) => setQuantity(e.target.value)}
          />

          <div className="d-flex align-items-center mt-4">
            <button type="submit" disabled={loading} className={`trade-submit ${isBuy ? "buy" : "sell"}`}>
              <i className={isBuy ? "bi bi-cart-plus" : "bi bi-cart-dash"} />{" "}
              {loading ? "Processing..." : isBuy ? "Confirm Buy" : "Confirm Sell"}
            </button>
            <Link to="/" className="trade-cancel">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
