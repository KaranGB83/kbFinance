import { Link } from "react-router-dom";
import QuoteLookup from "../components/QuoteLookup";
import Spinner from "../components/Spinner";
import TransactionBadge from "../components/TransactionBadge";
import { useApi } from "../hooks";
import { formatINR } from "../utils/format";

export default function Dashboard() {
  const { data, error, loading } = useApi("/dashboard/");

  if (loading) return <Spinner label="Loading your dashboard..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const { wallet_balance, total_portfolio_value, net_worth, holdings_count, recent_transactions } = data;

  return (
    <>
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
              <p className="text-muted mb-1"><i className="bi bi-wallet2" /> Wallet Balance</p>
              <h3 className="mb-0">{formatINR(wallet_balance)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <p className="mb-1 opacity-80"><i className="bi bi-briefcase" /> Portfolio Value</p>
              <h3 className="mb-0">{formatINR(total_portfolio_value)}</h3>
              <small className="opacity-70">{holdings_count} holding{holdings_count === 1 ? "" : "s"}</small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card text-white h-100 bg-networth">
            <div className="card-body">
              <p className="mb-1 opacity-80"><i className="bi bi-graph-up" /> Net Worth</p>
              <h3 className="mb-0">{formatINR(net_worth)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <QuoteLookup />
        </div>

        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <span><i className="bi bi-clock-history" /> Recent Transactions</span>
              <Link to="/transactions" className="btn btn-sm btn-outline-light">View All</Link>
            </div>
            <div className="card-body p-0">
              {recent_transactions.length ? (
                <table className="table table-sm mb-0">
                  <thead className="thead-light">
                    <tr><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                    {recent_transactions.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.symbol}</strong></td>
                        <td><TransactionBadge type={t.transaction_type} /></td>
                        <td>{t.quantity}</td>
                        <td>{formatINR(t.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-inbox display-4" />
                  <p className="mt-2 mb-0">No transactions yet.</p>
                  <Link to="/trade" className="btn btn-success btn-sm mt-2">Make your first trade</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
