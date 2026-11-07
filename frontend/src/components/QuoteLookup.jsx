import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { formatNumber } from "../utils/format";

export default function QuoteLookup() {
  const [symbol, setSymbol] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef();

  useEffect(() => () => clearTimeout(debounce.current), []);

  async function loadSuggestions(q) {
    try {
      const data = await api.get("/suggestions/", { q });
      setSuggestions(data);
      setShowList(data.length > 0);
    } catch {
      setShowList(false);
    }
  }

  function onChange(e) {
    const value = e.target.value.toUpperCase();
    setSymbol(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => loadSuggestions(value), 300);
  }

  async function fetchQuote(raw = symbol) {
    const sym = raw.trim().toUpperCase();
    if (!sym) return;
    setShowList(false);
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      setQuote(await api.get("/quote/", { symbol: sym }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function pick(item) {
    setSymbol(item.symbol);
    fetchQuote(item.symbol);
  }

  return (
    <div className="card h-100">
      <div className="card-header bg-dark text-white">
        <i className="bi bi-search" /> Live Stock Quote
      </div>
      <div className="card-body">
        <p className="text-muted small">
          Enter an NSE / BSE symbol (e.g. <code>RELIANCE</code>, <code>TCS</code>, <code>INFY</code>)
        </p>

        <form
          className="input-group mb-3 position-relative"
          onSubmit={(e) => { e.preventDefault(); fetchQuote(); }}
        >
          <input
            className="form-control text-uppercase"
            placeholder="e.g. RELIANCE"
            autoComplete="off"
            value={symbol}
            onChange={onChange}
            onFocus={() => loadSuggestions("")}
            onBlur={() => setTimeout(() => setShowList(false), 150)}
          />
          <div className="input-group-append">
            <button className="btn btn-dark" disabled={loading}>Get Quote</button>
          </div>

          {showList && (
            <ul className="suggestions">
              {suggestions.map((s) => (
                <li key={s.symbol} onMouseDown={() => pick(s)}>
                  <strong>{s.symbol}</strong>
                  <span className="suggestion-meta">
                    {s.name} {s.exchange && `· ${s.exchange}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </form>

        {loading && <div className="text-muted"><i className="bi bi-hourglass-split" /> Fetching...</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {quote && (
          <>
            <hr />
            <h5 className="mb-1">{quote.name}</h5>
            <p className="text-muted mb-2">
              {quote.symbol}{quote.exchange && ` · ${quote.exchange}`}
            </p>
            <h2 className="text-success font-weight-bold">
              {quote.currency} {formatNumber(quote.price)}
            </h2>

            {quote.is_indian ? (
              <div className="mt-3">
                <Link className="btn btn-success btn-sm mr-2" to={`/trade?symbol=${encodeURIComponent(quote.symbol)}`}>
                  <i className="bi bi-cart-plus" /> Buy
                </Link>
                <Link className="btn btn-danger btn-sm" to={`/trade?symbol=${encodeURIComponent(quote.symbol)}&mode=SELL`}>
                  <i className="bi bi-cart-dash" /> Sell
                </Link>
              </div>
            ) : (
              <div className="alert alert-warning py-2 mt-3 mb-0 small">
                <i className="bi bi-exclamation-triangle" /> Our app does not allow buying or selling stocks
                listed outside India.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
