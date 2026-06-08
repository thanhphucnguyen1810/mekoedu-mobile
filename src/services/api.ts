import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ENV } from "../types/env";
import {
  ACCESS_TOKEN_KEY,
  getRefreshToken,
  REFRESH_TOKEN_KEY,
  refreshAccessToken,
} from "./tokenService";

// URL Liferay (Lưu ý: Thay IP 10.0.2.2 cho Android)

export const api = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor để tự động gắn Token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token");
        }
        const newToken = await refreshAccessToken(refreshToken);
        const { access_token, refresh_token } = newToken;
        console.log("new Token", access_token);
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access_token);

        if (refresh_token) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
        }
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
