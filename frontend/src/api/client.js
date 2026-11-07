// Small fetch wrapper for the Django API.
// - Attaches the JWT access token
// - On a 401 it refreshes the token once (shared across concurrent calls) and retries
// - Throws ApiError with a user-friendly message taken from the response

const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const API = `${BASE}/api`;

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const LOGOUT_EVENT = "kbfinance:logout";

const store = {
  get: (k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, v); } catch { /* storage unavailable */ }
  },
  remove: (k) => {
    try { localStorage.removeItem(k); } catch { /* storage unavailable */ }
  },
};

export const tokens = {
  hasSession: () => Boolean(store.get(REFRESH_KEY) || store.get(ACCESS_KEY)),
  save: ({ access, refresh }) => {
    if (access) store.set(ACCESS_KEY, access);
    if (refresh) store.set(REFRESH_KEY, refresh);
  },
  refresh: () => store.get(REFRESH_KEY),
  clear: () => {
    store.remove(ACCESS_KEY);
    store.remove(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let refreshing = null;

async function refreshAccessToken() {
  const refresh = tokens.refresh();
  if (!refresh) return false;
  if (!refreshing) {
    refreshing = fetch(`${API}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        tokens.save(await res.json()); // rotation returns a new access + refresh pair
        return true;
      })
      .catch(() => false)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

function messageFrom(data, status) {
  if (data && typeof data === "object") {
    if (data.error) return data.error;
    if (data.detail) return data.detail;
  }
  if (status === 429) return "Too many requests. Please slow down and try again.";
  return "Something went wrong.";
}

async function request(path, { method = "GET", body, params, auth = true } = {}, retried = false) {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const access = store.get(ACCESS_KEY);
  if (auth && access) headers.Authorization = `Bearer ${access}`;

  let res;
  try {
    res = await fetch(`${API}${path}${query}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Network error. Please try again.", 0);
  }

  if (res.status === 401 && auth && !retried) {
    if (await refreshAccessToken()) return request(path, { method, body, params, auth }, true);
    tokens.clear();
    window.dispatchEvent(new Event(LOGOUT_EVENT));
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(messageFrom(data, res.status), res.status, data);
  return data;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body, opts) => request(path, { method: "POST", body, ...opts }),
};
