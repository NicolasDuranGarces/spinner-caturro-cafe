const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest(path, { method = 'GET', headers = {}, body } = {}) {
  const opts = {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, opts);
  return res;
}

export const apiGet = (path, opts) => apiRequest(path, { ...opts, method: 'GET' });
export const apiPost = (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body });
export const apiPut = (path, body, opts) => apiRequest(path, { ...opts, method: 'PUT', body });
export const apiDelete = (path, opts) => apiRequest(path, { ...opts, method: 'DELETE' });

