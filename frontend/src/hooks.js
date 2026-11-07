import { useEffect, useState } from "react";
import { api } from "./api/client";

// Load a GET endpoint once on mount: { data, error, loading }
export function useApi(path, params) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const key = JSON.stringify(params ?? null);

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, error: null, loading: true });
    api
      .get(path, params)
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((err) => !cancelled && setState({ data: null, error: err.message, loading: false }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);

  return state;
}
