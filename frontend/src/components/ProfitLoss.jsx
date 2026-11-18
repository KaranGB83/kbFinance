import { formatINR } from "../utils/format";

// "▲ ₹120.00 (4.20%)" in green, or red when negative.
export default function ProfitLoss({ amount, percent, className = "" }) {
  const up = amount >= 0;
  return (
    <span className={`pl-chip ${up ? "up" : "down"} ${className}`}>
      <i className={`bi ${up ? "bi-caret-up-fill" : "bi-caret-down-fill"}`} />{" "}
      {formatINR(Math.abs(amount))}
      {percent !== undefined && ` (${Math.abs(percent).toFixed(2)}%)`}
    </span>
  );
}
