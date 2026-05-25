import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// URL Liferay (Lưu ý: Thay IP 10.0.2.2 cho Android)
const BASE_URL = 'http://10.0.2.2:8080/o/headless-delivery/v1.0';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor để tự động gắn Token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('liferay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
})
