export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="text-center text-muted py-5" role="status">
      <div className="spinner-border spinner-border-sm mr-2" aria-hidden="true" />
      {label}
    </div>
  );
}
