const API_BASE = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};

// Menu API
export const menuApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/menu?${query}`).then(handleResponse);
  },
  getCategories: () => fetch(`${API_BASE}/menu/categories`).then(handleResponse),
  getById: (id) => fetch(`${API_BASE}/menu/${id}`).then(handleResponse),
  create: (data) =>
    fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  update: (id, data) =>
    fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' }).then(handleResponse),
  updateStock: (id, stock_quantity) =>
    fetch(`${API_BASE}/menu/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_quantity }),
    }).then(handleResponse),
};

// Orders API
export const ordersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/orders?${query}`).then(handleResponse);
  },
  getActive: () => fetch(`${API_BASE}/orders/active`).then(handleResponse),
  getById: (orderId) => fetch(`${API_BASE}/orders/${orderId}`).then(handleResponse),
  create: (data) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateStatus: (orderId, status) =>
    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(handleResponse),
  bill: (orderId, data) =>
    fetch(`${API_BASE}/orders/${orderId}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
};

// Workers API
export const workersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/workers?${query}`).then(handleResponse);
  },
  getById: (id) => fetch(`${API_BASE}/workers/${id}`).then(handleResponse),
  create: (data) =>
    fetch(`${API_BASE}/workers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  update: (id, data) =>
    fetch(`${API_BASE}/workers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_BASE}/workers/${id}`, { method: 'DELETE' }).then(handleResponse),
};

// Reports API
export const reportsApi = {
  getDailySales: (date) =>
    fetch(`${API_BASE}/reports/daily-sales?date=${date || ''}`).then(handleResponse),
  getTopSelling: (date, limit = 10) =>
    fetch(`${API_BASE}/reports/top-selling?date=${date || ''}&limit=${limit}`).then(handleResponse),
  getByCategory: (date) =>
    fetch(`${API_BASE}/reports/by-category?date=${date || ''}`).then(handleResponse),
  getHourly: (date) =>
    fetch(`${API_BASE}/reports/hourly?date=${date || ''}`).then(handleResponse),
};

// Attendance API
export const attendanceApi = {
  checkIn: (worker_id) =>
    fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id }),
    }).then(handleResponse),
  checkOut: (worker_id) =>
    fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id }),
    }).then(handleResponse),
  getByDate: (date) =>
    fetch(`${API_BASE}/attendance?date=${date || ''}`).then(handleResponse),
  markAbsent: (worker_id, date) =>
    fetch(`${API_BASE}/attendance/absent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id, date }),
    }).then(handleResponse),
};
