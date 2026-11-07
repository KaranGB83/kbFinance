import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import TransactionBadge from "../components/TransactionBadge";
import { useApi } from "../hooks";
import { formatDate, formatINR } from "../utils/format";

export default function Transactions() {
  const { data, error, loading } = useApi("/transactions/");

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <h2>Transaction History</h2>
      {data.length ? (
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="thead-dark">
              <tr><th>Date</th><th>Type</th><th>Symbol</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.created_at)}</td>
                  <td><TransactionBadge type={t.transaction_type} /></td>
                  <td><strong>{t.symbol}</strong></td>
                  <td>{t.quantity}</td>
                  <td>{formatINR(t.price)}</td>
                  <td>{formatINR(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">
          No transactions yet. <Link to="/trade">Make your first trade!</Link>
        </div>
      )}
    </>
  );
}
