import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { formatINR, formatNumber } from "../utils/format";
import "../trade.css";

const POPULAR = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "SBIN", "ITC"];
const QUICK_QTY = [1, 5, 10, 25];

// "TCS.NS" -> { symbol: "TCS", exchange: "NSE" } (what the buy/sell API expects)
function toOrderSymbol(resolved) {
  if (resolved.endsWith(".NS")) return { symbol: resolved.slice(0, -3), exchange: "NSE" };
  if (resolved.endsWith(".BO")) return { symbol: resolved.slice(0, -3), exchange: "BSE" };
  return { symbol: resolved, exchange: "OTHER" };
}

const clock = (d) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export default function Trade() {
  const [params, setParams] = useSearchParams();
  const prefill = (params.get("symbol") || "").toUpperCase();

  const [mode, setMode] = useState(params.get("mode") === "SELL" ? "SELL" : "BUY");
  const [stage, setStage] = useState("form"); // form | confirm | done
  const [input, setInput] = useState(prefill);
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteAt, setQuoteAt] = useState(null);
  const [quoteState, setQuoteState] = useState({ loading: false, error: null });
  const [owned, setOwned] = useState({ quantity: 0, avg_price: 0 });
  const [wallet, setWallet] = useState(null);
  const [qty, setQty] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const debounce = useRef();
  const searchRef = useRef();

  const isBuy = mode === "BUY";

  // The Dashboard / Portfolio links open /trade?symbol=..&mode=..; keep the toggle in sync with the URL.
  const urlMode = params.get("mode");
  useEffect(() => {
    if (urlMode === "SELL" || urlMode === "BUY") setMode(urlMode);
  }, [urlMode]);

  const loadWallet = useCallback(
    () => api.get("/auth/me/").then((me) => setWallet(me.wallet_balance)).catch(() => {}),
    []
  );
  useEffect(() => { loadWallet(); }, [loadWallet]);

  const lookup = useCallback(async (raw) => {
    const sym = raw.trim().toUpperCase();
    if (!sym) return;
    setShowList(false);
    setQuoteState({ loading: true, error: null });
    setSubmitError(null);
    try {
      const data = await api.get("/quote/", { symbol: sym });
      setQuote(data);
      setQuoteAt(new Date());
      setInput(sym);
      setQuoteState({ loading: false, error: null });
      api.get("/position/", { symbol: data.symbol }).then(setOwned).catch(() => setOwned({ quantity: 0, avg_price: 0 }));
    } catch (err) {
      setQuote(null);
      setQuoteState({ loading: false, error: err.message });
    }
  }, []);

  // Auto-load when arriving with ?symbol=
  useEffect(() => { if (prefill) lookup(prefill); /* eslint-disable-next-line */ }, []);
  useEffect(() => () => clearTimeout(debounce.current), []);

  async function loadSuggestions(q) {
    try {
      const data = await api.get("/suggestions/", { q });
      setSuggestions(data);
      setShowList(data.length > 0);
    } catch { setShowList(false); }
  }

  function onInput(e) {
    const value = e.target.value.toUpperCase();
    setInput(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => loadSuggestions(value), 300);
  }

  function changeMode(next) {
    setMode(next);
    setStage("form");
    setSubmitError(null);
    const p = new URLSearchParams(params);
    p.set("mode", next);
    setParams(p, { replace: true });
  }

  function clearStock() {
    setQuote(null);
    setInput("");
    setOwned({ quantity: 0, avg_price: 0 });
    setStage("form");
    searchRef.current?.focus();
  }

  const price = quote?.price || 0;
  const quantity = /^\d+$/.test(qty) ? parseInt(qty, 10) : 0;
  const total = price * quantity;
  const walletAfter = wallet === null ? null : isBuy ? wallet - total : wallet + total;
  const maxQty = isBuy ? (price && wallet !== null ? Math.floor(wallet / price) : 0) : owned.quantity;
  const estPnl = !isBuy && owned.quantity ? (price - owned.avg_price) * quantity : null;

  // First problem that blocks the order (null = good to go)
  const problem = useMemo(() => {
    if (!quote) return null;
    if (!quote.is_indian) return "Only stocks listed on NSE or BSE can be traded in this app.";
    if (!quantity) return "Enter a quantity of 1 or more.";
    if (isBuy && wallet !== null && total > wallet) return `Insufficient funds. You need ${formatINR(total - wallet)} more.`;
    if (!isBuy && owned.quantity === 0) return `You don't own any shares of ${quote.symbol}.`;
    if (!isBuy && quantity > owned.quantity) return `You only own ${owned.quantity} share${owned.quantity === 1 ? "" : "s"}.`;
    return null;
  }, [quote, quantity, isBuy, wallet, total, owned]);

  const bump = (delta) => setQty(String(Math.max(1, (quantity || 0) + delta)));

  async function confirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = toOrderSymbol(quote.symbol);
      const data = await api.post(isBuy ? "/buy/" : "/sell/", { ...order, quantity });
      setReceipt({ ...data, mode, total: data.price * data.quantity });
      setStage("done");
      loadWallet();
      api.get("/position/", { symbol: quote.symbol }).then(setOwned).catch(() => {});
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function tradeAgain() {
    setReceipt(null);
    setStage("form");
    setQty("1");
    lookup(quote.symbol); // refresh the price
  }

  // ---------------------------------------------------------------- receipt
  if (stage === "done" && receipt) {
    const bought = receipt.mode === "BUY";
    return (
      <div className="tr-page">
        <div className="tr-receipt">
          <div className={`tr-check ${bought ? "buy" : "sell"}`}><i className="bi bi-check-lg" /></div>
          <h3>{bought ? "Order placed: bought" : "Order placed: sold"}</h3>
          <p className="text-muted">
            {receipt.quantity} share{receipt.quantity === 1 ? "" : "s"} of <strong>{receipt.symbol}</strong> at {formatINR(receipt.price)}
          </p>
          <dl className="tr-lines">
            <div><dt>{bought ? "Total paid" : "Total received"}</dt><dd>{formatINR(receipt.total)}</dd></div>
            <div><dt>Wallet balance</dt><dd>{wallet === null ? "…" : formatINR(wallet)}</dd></div>
            <div><dt>You now own</dt><dd>{owned.quantity} share{owned.quantity === 1 ? "" : "s"}</dd></div>
          </dl>
          <div className="tr-receipt-actions">
            <Link to="/portfolio" className="btn btn-dark">View portfolio</Link>
            <button className="btn btn-outline-secondary" onClick={tradeAgain}>Trade {receipt.symbol} again</button>
            <button className="btn btn-link" onClick={() => { setReceipt(null); clearStock(); }}>Trade another stock</button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------- form
  return (
    <div className="tr-page">
      <header className="tr-header">
        <h2>Trade</h2>
        <p className="text-muted mb-0">Search a stock, choose buy or sell, and review before you confirm.</p>
      </header>

      <div className={`tr-grid ${isBuy ? "tr-buy" : "tr-sell"}`}>
        <section className="tr-card tr-order">
          <div className={`tr-toggle ${isBuy ? "is-buy" : "is-sell"}`} role="tablist" aria-label="Order type">
            <span className="tr-toggle-pill" />
            <button role="tab" aria-selected={isBuy} className={isBuy ? "active" : ""} onClick={() => changeMode("BUY")}>
              <i className="bi bi-arrow-up-circle" /> Buy
            </button>
            <button role="tab" aria-selected={!isBuy} className={!isBuy ? "active" : ""} onClick={() => changeMode("SELL")}>
              <i className="bi bi-arrow-down-circle" /> Sell
            </button>
          </div>

          {/* ---- step 1: stock ---- */}
          <label className="tr-label" htmlFor="tr-search">1. Choose a stock</label>
          <form className="tr-search" onSubmit={(e) => { e.preventDefault(); lookup(input); }}>
            <i className="bi bi-search" />
            <input
              id="tr-search" ref={searchRef} className="form-control" placeholder="Search NSE / BSE symbol, e.g. RELIANCE"
              autoComplete="off" autoFocus={!prefill} value={input} onChange={onInput}
              onFocus={() => loadSuggestions(input)} onBlur={() => setTimeout(() => setShowList(false), 150)}
              onKeyDown={(e) => e.key === "Escape" && setShowList(false)}
            />
            <button className="btn btn-dark" disabled={quoteState.loading || !input.trim()}>
              {quoteState.loading ? <span className="spinner-border spinner-border-sm" /> : "Search"}
            </button>
            {showList && (
              <ul className="tr-suggest">
                {suggestions.map((s) => (
                  <li key={s.symbol} onMouseDown={() => lookup(s.symbol)}>
                    <strong>{s.symbol}</strong>
                    <span>{s.name} {s.exchange && `· ${s.exchange}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </form>

          {!quote && !quoteState.loading && (
            <div className="tr-popular">
              <span>Popular</span>
              {POPULAR.map((s) => (
                <button key={s} type="button" onClick={() => lookup(s)}>{s}</button>
              ))}
            </div>
          )}
          {quoteState.error && <div className="alert alert-danger mt-3 mb-0" role="alert">{quoteState.error}</div>}

          {quote && (
            <div className="tr-stock" key={quote.symbol}>
              <div>
                <h4>{quote.name}</h4>
                <span className="tr-meta">{quote.symbol}{quote.exchange && ` · ${quote.exchange}`}</span>
              </div>
              <div className="tr-stock-price">
                <strong>{quote.currency === "INR" || !quote.currency ? "₹" : `${quote.currency} `}{formatNumber(quote.price)}</strong>
                <button type="button" className="tr-refresh" onClick={() => lookup(quote.symbol)}
                        disabled={quoteState.loading} aria-label="Refresh price" title="Refresh price">
                  <i className={`bi bi-arrow-clockwise ${quoteState.loading ? "tr-spin" : ""}`} />
                </button>
                <small>{quoteAt && `as of ${clock(quoteAt)}`}</small>
              </div>
              <button type="button" className="tr-change" onClick={clearStock}>Change</button>
            </div>
          )}

          {/* ---- step 2: quantity ---- */}
          <div className={quote ? "" : "tr-disabled"} aria-disabled={!quote}>
            <label className="tr-label" htmlFor="tr-qty">2. Quantity</label>
            <div className="tr-stepper">
              <button type="button" onClick={() => bump(-1)} disabled={!quote || quantity <= 1} aria-label="Decrease">−</button>
              <input id="tr-qty" inputMode="numeric" value={qty} disabled={!quote}
                     onChange={(e) => setQty(e.target.value.replace(/\D/g, "").slice(0, 7))} />
              <button type="button" onClick={() => bump(1)} disabled={!quote} aria-label="Increase">+</button>
            </div>
            <div className="tr-quick">
              {QUICK_QTY.map((n) => (
                <button key={n} type="button" disabled={!quote} onClick={() => setQty(String(n))}>{n}</button>
              ))}
              <button type="button" disabled={!quote || maxQty < 1} onClick={() => setQty(String(maxQty))}>
                Max{quote && maxQty > 0 ? ` (${maxQty})` : ""}
              </button>
            </div>
            {quote && !isBuy && (
              <p className="tr-hint">
                You own <strong>{owned.quantity}</strong> share{owned.quantity === 1 ? "" : "s"}
                {owned.quantity > 0 && <> at an average of {formatINR(owned.avg_price)}</>}.
              </p>
            )}
            {quote && isBuy && wallet !== null && (
              <p className="tr-hint">You can afford up to <strong>{maxQty}</strong> share{maxQty === 1 ? "" : "s"} with {formatINR(wallet)}.</p>
            )}
          </div>

          <div aria-live="polite">
            {problem && quote && <div className="tr-problem"><i className="bi bi-exclamation-circle" /> {problem}</div>}
          </div>

          {stage === "form" ? (
            <button className="tr-submit" disabled={!quote || Boolean(problem)} onClick={() => setStage("confirm")}>
              Review {isBuy ? "buy" : "sell"} order <i className="bi bi-arrow-right" />
            </button>
          ) : (
            <div className="tr-confirm" role="alertdialog" aria-label="Confirm order">
              <p>
                {isBuy ? "Buy" : "Sell"} <strong>{quantity}</strong> × <strong>{quote.symbol}</strong> at about{" "}
                <strong>{formatINR(price)}</strong> for <strong>{formatINR(total)}</strong>?
              </p>
              <small className="text-muted d-block mb-2">
                Orders fill at the live market price when you confirm, which may differ slightly from what's shown.
              </small>
              {submitError && <div className="alert alert-danger py-2" role="alert">{submitError}</div>}
              <div className="d-flex">
                <button className="btn btn-outline-secondary mr-2" onClick={() => { setStage("form"); setSubmitError(null); }} disabled={submitting}>
                  Back
                </button>
                <button className="tr-submit flex-fill" onClick={confirm} disabled={submitting}>
                  {submitting ? <><span className="spinner-border spinner-border-sm mr-2" />Placing order...</> : `Confirm ${isBuy ? "buy" : "sell"}`}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ---- summary ---- */}
        <aside className="tr-card tr-summary">
          <h5>Order summary</h5>
          <dl className="tr-lines">
            <div><dt>Order</dt><dd><span className={`tr-pill ${isBuy ? "buy" : "sell"}`}>{isBuy ? "BUY" : "SELL"}</span></dd></div>
            <div><dt>Stock</dt><dd>{quote ? quote.symbol : "—"}</dd></div>
            <div><dt>Price</dt><dd>{quote ? formatINR(price) : "—"}</dd></div>
            <div><dt>Quantity</dt><dd>{quote && quantity ? quantity : "—"}</dd></div>
            <div className="tr-total"><dt>{isBuy ? "Estimated cost" : "Estimated proceeds"}</dt><dd>{quote && quantity ? formatINR(total) : "—"}</dd></div>
          </dl>
          <hr />
          <dl className="tr-lines">
            <div><dt>Wallet balance</dt><dd>{wallet === null ? "…" : formatINR(wallet)}</dd></div>
            <div>
              <dt>Balance after</dt>
              <dd className={walletAfter !== null && walletAfter < 0 ? "text-danger" : ""}>
                {quote && quantity && walletAfter !== null ? formatINR(walletAfter) : "—"}
              </dd>
            </div>
            {estPnl !== null && quantity > 0 && quote && (
              <div>
                <dt>Est. profit / loss</dt>
                <dd className={estPnl >= 0 ? "tr-up" : "tr-down"}>{estPnl >= 0 ? "+" : "−"}{formatINR(Math.abs(estPnl))}</dd>
              </div>
            )}
          </dl>
          <p className="tr-note"><i className="bi bi-shield-check" /> Practice trading only. No real money is involved.</p>
        </aside>
      </div>
    </div>
  );
}
