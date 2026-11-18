import { useEffect, useState } from "react";
import { api } from "./api/client";

// Load a GET endpoint on mount: { data, error, loading, refreshing, reload }.
// reload() refetches in the background while keeping the current data on screen.
export function useApi(path, params) {
  const [state, setState] = useState({ data: null, error: null, loading: true, refreshing: false });
  const [reloadKey, setReloadKey] = useState(0);
  const key = JSON.stringify(params ?? null);

  useEffect(() => {
    let cancelled = false;
    setState((s) => (reloadKey === 0 ? { data: null, error: null, loading: true, refreshing: false } : { ...s, refreshing: true }));
    api
      .get(path, params)
      .then((data) => !cancelled && setState({ data, error: null, loading: false, refreshing: false }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, error: err.message, loading: false, refreshing: false })));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, reloadKey]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
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
