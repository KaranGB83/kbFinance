export default function TransactionBadge({ type }) {
  return <span className={`badge ${type === "BUY" ? "badge-success" : "badge-danger"}`}>{type}</span>;
}
