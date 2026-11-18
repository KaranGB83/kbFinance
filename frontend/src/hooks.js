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

// Animate a number from 0 to `target` (skipped when the user prefers reduced motion).
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(target)) {
      setValue(target);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - t, 3))); // ease-out cubic
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
