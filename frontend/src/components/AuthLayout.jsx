import { useEffect, useState } from "react";
import "../auth.css";

// Rotating headline messages shown on the hero panel.
const MESSAGES = [
  { title: "Learn to trade, risk-free", text: "Start with ₹1,000 of virtual cash and practise on real market prices." },
  { title: "India's markets, live", text: "Search NSE and BSE stocks and see live quotes before you buy." },
  { title: "Know where you stand", text: "Track holdings, gain / loss and net worth in one clean dashboard." },
  { title: "Every trade on record", text: "Review your full transaction history and learn from each decision." },
];

// Purely illustrative tiles (not real prices).
const CHIPS = [
  { symbol: "RELIANCE", change: "+1.8%", up: true },
  { symbol: "TCS", change: "+0.9%", up: true },
  { symbol: "INFY", change: "-0.6%", up: false },
];

const STATS = [
  { value: "₹1,000", label: "Starting wallet" },
  { value: "NSE + BSE", label: "Live quotes" },
  { value: "₹0", label: "Real money at risk" },
];

function Sparkline() {
  const line = "M0 120 L30 108 L60 114 L90 88 L120 96 L150 70 L180 78 L210 48 L240 56 L270 28 L300 36";
  return (
    <svg className="auth-spark" viewBox="0 0 300 140" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd36f" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2dd36f" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="auth-spark-fill" d={`${line} L300 140 L0 140 Z`} fill="url(#sparkFill)" />
      <path className="auth-spark-line" d={line} pathLength="1" />
    </svg>
  );
}

export default function AuthLayout({ children }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const message = MESSAGES[index];

  return (
    <div className="auth-shell">
      <section className="auth-hero" aria-label="About KB Finance">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />

        <div className="auth-hero-content">
          <span className="auth-badge"><i className="bi bi-graph-up-arrow" /> KB Finance</span>
          <h1 className="auth-headline">
            Grow your <span>investing skills</span>
          </h1>

          <div className="auth-rotator" aria-live="polite">
            <div key={index} className="auth-rotator-item">
              <h2>{message.title}</h2>
              <p>{message.text}</p>
            </div>
          </div>

          <div className="auth-dots" aria-hidden="true">
            {MESSAGES.map((_, i) => (
              <span key={i} className={i === index ? "active" : ""} />
            ))}
          </div>
        </div>

        <div className="auth-visual" aria-hidden="true">
          <Sparkline />
          {CHIPS.map((chip, i) => (
            <div key={chip.symbol} className={`auth-chip auth-chip-${i + 1}`}>
              <strong>{chip.symbol}</strong>
              <span className={chip.up ? "up" : "down"}>
                <i className={`bi ${chip.up ? "bi-caret-up-fill" : "bi-caret-down-fill"}`} /> {chip.change}
              </span>
            </div>
          ))}
          <span className="auth-sample">Illustrative data</span>
        </div>

        <ul className="auth-stats">
          {STATS.map((s) => (
            <li key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="auth-panel">{children}</section>
    </div>
  );
}
