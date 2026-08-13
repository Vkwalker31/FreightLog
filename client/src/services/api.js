const API_BASE = '/api';

function getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...getHeaders(options.auth !== false), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Ошибка запроса');
  }
  return data;
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body), auth: false }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body), auth: false }),
  me: () => request('/auth/me'),

  getCargo: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cargo?${qs}`, { auth: false });
  },
  getCargoById: (id) => request(`/cargo/${id}`, { auth: false }),
  createCargo: (body) => request('/cargo', { method: 'POST', body: JSON.stringify(body) }),
  updateCargo: (id, body) => request(`/cargo/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCargo: (id) => request(`/cargo/${id}`, { method: 'DELETE' }),
  trackCargo: (id) => request(`/cargo/${id}/track`, { auth: false }),

  getDrivers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/drivers?${qs}`, { auth: false });
  },
  createDriver: (body) => request('/drivers', { method: 'POST', body: JSON.stringify(body) }),
  updateDriver: (id, body) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  patchDriver: (id, body) => request(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteDriver: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),

  getVehicles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/vehicles?${qs}`, { auth: false });
  },

  optimizeRoute: (body) =>
    request('/ai/optimize', { method: 'POST', body: JSON.stringify(body), auth: false }),
  analyzeDocument: (body) =>
    request('/ai/analyze-document', { method: 'POST', body: JSON.stringify(body) }),
  processOrder: (body) => request('/routes/process-order', { method: 'POST', body: JSON.stringify(body) }),
  logFuel: (body) => request('/routes/fuel-log', { method: 'POST', body: JSON.stringify(body) }),
  logMaintenance: (body) => request('/routes/maintenance', { method: 'POST', body: JSON.stringify(body) }),
};

export function trackCargoXHR(cargoId, onProgress, onSuccess, onError) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${API_BASE}/cargo/${cargoId}/track`);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.upload.onprogress = onProgress;
  xhr.onprogress = onProgress;

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      onSuccess(JSON.parse(xhr.responseText));
    } else {
      let message = 'Ошибка отслеживания';
      try {
        const data = JSON.parse(xhr.responseText);
        message = data.message || message;
      } catch {
        /* ignore */
      }
      onError(new Error(message));
    }
  };

  xhr.onabort = () => onError(new Error('Запрос отменён'));
  xhr.onerror = () => onError(new Error('Сетевая ошибка'));
  xhr.send();
  return xhr;
}

export function formatDateTime(dateStr, timezone) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const userTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const local = date.toLocaleString('ru-RU', { timeZone: userTz });
  const utc = date.toLocaleString('ru-RU', { timeZone: 'UTC' });
  return { local, utc, userTz };
}
