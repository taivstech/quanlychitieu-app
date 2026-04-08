import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // Expo Go trên điện thoại thật: lấy IP laptop từ Metro bundler host
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8080/api`;
  }
  // Android emulator fallback
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api';
  return 'http://localhost:8080/api';
}

const BASE_URL = getBaseUrl();

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('AsyncStorage unavailable:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 refresh
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newToken = data.data.accessToken;
          await AsyncStorage.setItem('accessToken', newToken);
          await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        try {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        } catch (storageErr) {
          console.warn('AsyncStorage error:', storageErr.message);
        }
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
