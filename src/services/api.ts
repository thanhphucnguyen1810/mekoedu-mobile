// src/services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { InternalAxiosRequestConfig } from "axios";
import { ENV } from "../types/env";
import storeConfigService from "./storeConfigService";

const ACCESS_TOKEN_KEY = "access_token";

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const storeConfig = await storeConfigService.getStoreConfig();

    config.baseURL = storeConfig.apiBaseUrl || ENV.API_URL;

    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Accept-Language"] = "vi-VN";

    console.log(
      "[API]",
      config.method?.toUpperCase(),
      config.baseURL,
      config.url,
    );

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const storeConfig = await storeConfigService.getStoreConfig();

    const baseUrl = (storeConfig.apiBaseUrl || ENV.API_URL).replace(/\/+$/, "");
    config.baseURL = baseUrl;

    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(
      "[API]",
      config.method?.toUpperCase(),
      config.baseURL,
      config.url,
      config.params ?? "",
    );

    return config;
  },
  (error) => Promise.reject(error),
);
