import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Trade from "./pages/Trade";
import Transactions from "./pages/Transactions";

function NotFound() {
  return (
    <div className="text-center py-5">
      <h2>Page not found</h2>
      <Link to="/">Back to the dashboard</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
