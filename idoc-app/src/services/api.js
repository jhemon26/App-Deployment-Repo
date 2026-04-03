import axios from 'axios';
import { Platform } from 'react-native';
import storage from '../utils/storage';

// ─── Django server URL ───
// localhost works for iOS Simulator
// 10.0.2.2 works for Android Emulator
// Use your machine's LAN IP (e.g. 192.168.x.x) for physical devices
// Use deployed URL (e.g. http://144.126.239.34/api/v1) for production
const PROD_BASE_URL = 'http://144.126.239.34/api/v1';
const LOCAL_WEB_BASE_URL = 'http://localhost:8000/api/v1';
const WEB_OVERRIDE_BASE_URL = (
  Platform.OS === 'web'
  && typeof window !== 'undefined'
  && window.localStorage
) ? window.localStorage.getItem('IDOC_API_BASE_URL') : null;

const BASE_URL = WEB_OVERRIDE_BASE_URL
  || PROD_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach JWT token ───
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // SecureStore not available (web), try AsyncStorage fallback
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle token refresh ───
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        await storage.setItem('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to re-login
        await storage.deleteItem('access_token');
        await storage.deleteItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ───
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
};

// ─── Doctor API ───
export const doctorAPI = {
  list: (params) => api.get('/doctors/', { params }),
  getById: (id) => api.get(`/doctors/${id}/`),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots/`, { params: { date } }),
  updateProfile: (data) => api.put('/doctors/profile/', data),
  getDashboard: () => api.get('/doctors/dashboard/'),
};

// ─── Booking API ───
export const bookingAPI = {
  create: (data) => api.post('/bookings/create/', data),
  list: (params) => api.get('/bookings/', { params }),
  getById: (id) => api.get(`/bookings/${id}/`),
  cancel: (id) => api.post(`/bookings/${id}/cancel/`),
  confirm: (id) => api.post(`/bookings/${id}/confirm/`),
};

// ─── Prescription API ───
export const prescriptionAPI = {
  list: (params) => api.get('/bookings/prescriptions/', { params }),
  create: (data) => api.post('/bookings/prescriptions/create/', data),
};

// ─── Pharmacy API ───
export const pharmacyAPI = {
  list: (params) => api.get('/pharmacies/', { params }),
  getById: (id) => api.get(`/pharmacies/${id}/`),
  getMedicines: (params) => api.get('/pharmacies/medicines/', { params }),
  updateProfile: (data) => api.put('/pharmacies/profile/', data),
  updateOrder: (id, data) => api.put(`/pharmacies/orders/${id}/`, data),
  getDashboard: () => api.get('/pharmacies/dashboard/'),
  addMedicine: (data) => api.post('/pharmacies/medicines/create/', data),
  updateMedicine: (id, data) => api.put(`/pharmacies/medicines/${id}/`, data),
};

// ─── Order API ───
export const orderAPI = {
  create: (data) => api.post('/orders/create/', data),
  list: (params) => api.get('/orders/', { params }),
  getById: (id) => api.get(`/orders/${id}/`),
  cancel: (id) => api.post(`/orders/${id}/cancel/`),
  track: (id) => api.get(`/orders/${id}/`),
  updateStatus: (id, data) => api.post(`/orders/${id}/status/`, data),
};

// ─── Payment API ───
export const paymentAPI = {
  createIntent: (data) => api.post('/payments/create-intent/', data),
  confirm: (data) => api.post('/payments/confirm/', data),
  getHistory: (params) => api.get('/payments/history/', { params }),
  refund: (id) => api.post(`/payments/${id}/refund/`),
};

// ─── Chat API ───
export const chatAPI = {
  getRooms: () => api.get('/chat/rooms/'),
  getMessages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages/`, { params }),
  sendMessage: (roomId, data) => api.post(`/chat/rooms/${roomId}/send/`, data),
  createRoom: (data) => api.post('/chat/rooms/create/', data),
};

// ─── Video Call API ───
export const videoAPI = {
  getToken: (channelName) => api.post('/video/token/', { channel: channelName }),
  endCall: (callId) => api.post(`/video/calls/${callId}/end/`),
  getCallHistory: () => api.get('/video/calls/'),
};

// ─── Admin API ───
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard/'),
  getUsers: (params) => api.get('/admin/users/', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}/`, data),
  blockUser: (id) => api.post(`/admin/users/${id}/block/`),
  unblockUser: (id) => api.post(`/admin/users/${id}/unblock/`),
  approveDoctor: (id) => api.post(`/admin/doctors/${id}/approve/`),
  approvePharmacy: (id) => api.post(`/admin/pharmacies/${id}/approve/`),
  rejectUser: (id, data) => api.post(`/admin/users/${id}/reject/`, data),
  getPendingApprovals: () => api.get('/admin/pending-approvals/'),
  getReports: (params) => api.get('/admin/reports/', { params }),
  getSettings: () => api.get('/admin/settings/'),
  updateSettings: (data) => api.put('/admin/settings/', data),
};

// ─── Notification API ───
export const notificationAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
};

export default api;
