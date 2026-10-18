// All calls use relative /api paths: Vite proxies them in dev, CloudFront routes them in production.
const getToken = () => localStorage.getItem('token');

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  movies: (q = '') => request(`/movies${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  watchlist: () => request('/watchlist'),
  addToWatchlist: (id) => request(`/watchlist/${id}`, { method: 'POST' }),
  removeFromWatchlist: (id) => request(`/watchlist/${id}`, { method: 'DELETE' }),
};
