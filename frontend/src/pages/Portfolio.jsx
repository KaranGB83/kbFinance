import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import { useApi } from "../hooks";
import { formatINR } from "../utils/format";

export default function Portfolio() {
  const { data, error, loading } = useApi("/portfolio/");

  if (loading) return <Spinner label="Fetching live prices..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const { holdings, wallet_balance, total_portfolio_value, net_worth } = data;

  return (
    <>
      <h2>Portfolio</h2>

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card text-white bg-secondary h-100"><div className="card-body">
            <h6 className="card-title">Wallet Balance</h6><h4>{formatINR(wallet_balance)}</h4>
          </div></div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card text-white bg-primary h-100"><div className="card-body">
            <h6 className="card-title">Portfolio Value</h6><h4>{formatINR(total_portfolio_value)}</h4>
          </div></div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card text-white bg-dark h-100"><div className="card-body">
            <h6 className="card-title">Total Net Worth</h6><h4>{formatINR(net_worth)}</h4>
          </div></div>
        </div>
      </div>

      {holdings.length ? (
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="thead-dark">
              <tr>
                <th>Symbol</th><th>Qty</th><th>Avg Buy Price</th>
                <th>Current Price</th><th>Total Value</th><th>Gain / Loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.symbol}>
                  <td><strong>{h.symbol}</strong></td>
                  <td>{h.quantity}</td>
                  <td>{formatINR(h.avg_price)}</td>
                  <td>{h.current_price ? formatINR(h.current_price) : <span className="text-muted">N/A</span>}</td>
                  <td>{formatINR(h.total_value)}</td>
                  <td className={h.gain_loss >= 0 ? "text-success" : "text-danger"}>
                    {h.gain_loss >= 0 && "+"}{formatINR(h.gain_loss)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">
          You don't own any stocks yet. <Link to="/trade">Buy some!</Link>
        </div>
      )}
    </>
  );
}
