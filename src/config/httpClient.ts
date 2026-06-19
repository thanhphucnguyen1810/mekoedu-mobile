// src/services/http.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ENV } from "./env";
import { TOKEN_KEYS } from "./tokenKeys";

// ─── Refresh-queue pattern ────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];
 
function drainQueue(token: string) {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
}
 
function rejectQueue(err: unknown) {
  pendingQueue.forEach(({ reject }) => reject(err));
  pendingQueue = [];
}

// ─── Core refresh logic (no axios – avoids interceptor loop) ─────────────────
async function doRefresh(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH);
  if (!refreshToken) throw new Error("No refresh token");

  const credentials = btoa(`${ENV.CLIENT_ID}:${ENV.CLIENT_SECRET}`);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(`${ENV.API_URL}/o/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });
 
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);

  const data = await res.json();
  await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, data.access_token);
  if (data.refresh_token) {
    await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh_token);
  }
  return data.access_token as string;
}

// ─── Axios instance ───────────────────────────────────────────────────────────
function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: ENV.API_URL,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": "vi-VN", // ✅ Thêm header ngôn ngữ tiếng Việt
    },
  });

  // REQUEST — attach token và các header khác
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await AsyncStorage.getItem(TOKEN_KEYS.ACCESS);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Đảm bảo luôn có Accept-Language (có thể override nếu cần)
      if (!config.headers["Accept-Language"]) {
        config.headers["Accept-Language"] = "vi-VN";
      }
      
      return config;
    },
    (err) => Promise.reject(err)
  );

  // RESPONSE — handle 401 with token refresh
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
 
      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }
 
      original._retry = true;
 
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(client(original));
            },
            reject,
          });
        });
      }
 
      isRefreshing = true;
      try {
        const newToken = await doRefresh();
        drainQueue(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch (refreshErr) {
        rejectQueue(refreshErr);
        // Clear tokens so app redirects to login
        await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH]);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
  );
  
  return client; 
}

export const http = createHttpClient();
