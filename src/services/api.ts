// services/api.ts
import { selectAccessToken } from '@/src/store/slices/liferayAuthSlice';
import { store } from '@/src/store/index';
import axios, { AxiosError, AxiosInstance } from 'axios';
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
const BASE_URL = extra.LIFERAY_BASE_URL ?? "http://192.168.2.152:8080";

class LiferayApiClient {
  private static instance: LiferayApiClient;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor để thêm token từ Redux store
    this.client.interceptors.request.use(
      async (config) => {
        const state = store.getState();
        const token = selectAccessToken(state);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[API] Token added to request:', config.url);
        } else {
          console.warn('[API] No token available for request:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor xử lý lỗi
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.error('[API] Unauthorized! Token may be expired.');
          // Có thể dispatch logout event ở đây
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): LiferayApiClient {
    if (!LiferayApiClient.instance) {
      LiferayApiClient.instance = new LiferayApiClient();
    }
    return LiferayApiClient.instance;
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const liferayClient = LiferayApiClient.getInstance().getClient();
