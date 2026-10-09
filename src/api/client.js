const API = import.meta.env.VITE_API_URL || 'http://localhost:3020';

async function req(path, opts = {}) {
  const token = localStorage.getItem('naty_token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : res.text();
}

export const api = {
  get: (p) => req(p),
  post: (p, body) => req(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => req(p, { method: 'PUT', body: JSON.stringify(body) }),
  del: (p) => req(p, { method: 'DELETE' }),
  upload: async (file) => {
    const token = localStorage.getItem('naty_token');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd
    });
    if (!res.ok) throw new Error('No se pudo subir la imagen');
    return res.json();
  },
  API
};
