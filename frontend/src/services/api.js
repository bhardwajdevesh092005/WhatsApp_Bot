import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://whatsappbot-production.up.railway.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Dashboard endpoints
  getQrCode: () => api.get('/bot/qr'),
  getStats: () => api.get(' '),
  getRecentMessages: () => api.get('/dashboard/recent-messages'),

  // Messages endpoints
  getMessages: (params) => api.get('/messages', { params }),
  sendMessage: (messageData) => api.post('/messages/send', messageData, {
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  getMessage: (id) => api.get(`/messages/${id}`),
  deleteMessage: (id) => api.delete(`/messages/${id}`),

  // Analytics endpoints
  getAnalytics: (timeRange = 'week') => api.get('/analytics', {
    params: { timeRange },
  }),
  getMessageVolume: (timeRange) => api.get('/analytics/volume', {
    params: { timeRange },
  }),
  getResponseTimes: (timeRange) => api.get('/analytics/response-times', {
    params: { timeRange },
  }),
  getTopContacts: (limit = 10) => api.get('/analytics/top-contacts', {
    params: { limit },
  }),

  // Settings endpoints
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
  resetSettings: () => api.post('/settings/reset'),

  // LLM endpoints
  getLLMSettings: () => api.get('/llm/settings'),
  updateLLMSettings: (settings) => api.put('/llm/settings', settings),
  getLLMStatus: () => api.get('/llm/status'),
  testLLMResponse: (data) => api.post('/llm/test', data),
  getLLMProviders: () => api.get('/llm/providers'),
  resetLLMSettings: () => api.post('/llm/reset'),
  getLLMAnalytics: (days = 30) => api.get('/llm/analytics', { params: { days } }),

  // Device/Bot endpoints
  getDeviceStatus: () => api.get('/bot/status'),
  reconnectDevice: () => api.post('/bot/reconnect'),
  disconnectDevice: () => api.post('/bot/disconnect'),
  getBotInfo: () => api.get('/bot/info'),
  restartBot: () => api.post('/bot/restart'),

  // Contacts endpoints
  getContacts: () => api.get('/contacts'),
  addContact: (contact) => api.post('/contacts', contact),
  updateContact: (id, contact) => api.put(`/contacts/${id}`, contact),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
  blockContact: (phone) => api.post('/contacts/block', { phone }),
  unblockContact: (phone) => api.post('/contacts/unblock', { phone }),

  // Webhooks endpoints
  testWebhook: (url) => api.post('/webhooks/test', { url }),
  getWebhookLogs: () => api.get('/webhooks/logs'),

  // Auth endpoints (if needed)
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),

  // File upload endpoints
  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('media', file);
    return api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Health check
  healthCheck: () => api.get('/health'),
};

export default api;
