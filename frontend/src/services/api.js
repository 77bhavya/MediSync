const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('medisync_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('medisync_token');
        localStorage.removeItem('medisync_user');
        window.location.href = '/login?expired=1';
      }
      const error = new Error(data.message || 'An error occurred while communicating with the server.');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Medicines
  getMedicines: (params = '') => request(`/medicines${params ? '?' + params : ''}`),
  getMedicineById: (id) => request(`/medicines/${id}`),
  createMedicine: (payload) => request('/medicines', { method: 'POST', body: JSON.stringify(payload) }),
  updateMedicine: (id, payload) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMedicine: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),
  refillStock: (id, payload) => request(`/medicines/${id}/refill`, { method: 'POST', body: JSON.stringify(payload) }),

  // Schedule & Doses
  getDashboardSummary: () => request('/dashboard/summary'),
  getTodaySchedule: (date) => request(`/schedule/today${date ? '?date=' + date : ''}`),
  getWeeklySchedule: (startDate) => request(`/schedule/weekly${startDate ? '?startDate=' + startDate : ''}`),
  getReminders: () => request('/schedule/reminders'),
  recordDoseAction: (payload) => request('/doses/action', { method: 'POST', body: JSON.stringify(payload) }),
  getDoseHistory: (params = '') => request(`/doses/history${params ? '?' + params : ''}`),

  // Analytics
  getAdherenceAnalytics: (days = 7) => request(`/analytics/adherence?days=${days}`),

  // Drug Catalog
  searchDrugs: (query) => request(`/drugs/search${query ? '?query=' + encodeURIComponent(query) : ''}`),
  getDrugById: (id) => request(`/drugs/${id}`),

  // User & Settings
  updateProfile: (payload) => request('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  updateSettings: (payload) => request('/users/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload) => request('/users/change-password', { method: 'PUT', body: JSON.stringify(payload) }),
};

