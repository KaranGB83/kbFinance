const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatINR = (n) => `₹${inr.format(Number(n) || 0)}`;

export const formatNumber = (n) => inr.format(Number(n) || 0);

export const formatDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
