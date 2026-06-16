import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { DEFAULT_CONFIG } from "../config/defaultConfig";
import { ENV } from "../types/env";

export interface IStoreConfig {
  id: number;
  apiBaseUrl: string;
  siteId: number;
  channelId: number;
  vocabularyId: number;
  configCode?: string;
  dateModified: string;
}

interface StoreConfigResponse {
  items?: IStoreConfig[];
}

const CONFIG_KEY = "STORE_CONFIG";
const TIMESTAMP_KEY = "STORE_CONFIG_TIMESTAMP";
const TTL_MS = 1000 * 60 * 60;

class StoreConfigService {
  private memoryConfig: IStoreConfig | null = null;

  getMemoryConfig(): IStoreConfig | null {
    return this.memoryConfig;
  }

  private getConfigApiUrl(): string {
    return `${ENV.API_URL}/o/c/storeconfigurations`;
  }

  private isValidConfig(config: IStoreConfig | null): boolean {
    return Boolean(
      config &&
      config.siteId > 0 &&
      config.channelId > 0 &&
      config.vocabularyId > 0,
    );
  }

  private async getCached(): Promise<IStoreConfig | null> {
    try {
      const cached = await AsyncStorage.getItem(CONFIG_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async isCacheExpired(): Promise<boolean> {
    try {
      const ts = await AsyncStorage.getItem(TIMESTAMP_KEY);
      if (!ts) return true;

      const timestamp = Number(ts);
      if (Number.isNaN(timestamp)) return true;

      return Date.now() - timestamp > TTL_MS;
    } catch {
      return true;
    }
  }

  private async saveCache(config: IStoreConfig): Promise<void> {
    if (!this.isValidConfig(config)) {
      console.warn("[Config] Config không hợp lệ, không lưu cache:", config);
      return;
    }

    await AsyncStorage.multiSet([
      [CONFIG_KEY, JSON.stringify(config)],
      [TIMESTAMP_KEY, Date.now().toString()],
    ]);
  }

  private async refreshTTL(): Promise<void> {
    try {
      await AsyncStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    } catch {}
  }

  private async fetchFromAPI(): Promise<IStoreConfig | null> {
    try {
      console.log("[Config] Gọi API:", this.getConfigApiUrl());

      const { data } = await axios.get<StoreConfigResponse>(
        this.getConfigApiUrl(),
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      console.log("[Config] API data:", data);

      return data.items?.[0] ?? null;
    } catch (error: any) {
      console.warn(
        "[Config] Không lấy được config:",
        error.response?.status,
        error.response?.data || error.message,
      );
      return null;
    }
  }

  private isNewer(remote: IStoreConfig, cached: IStoreConfig | null): boolean {
    if (!cached) return true;

    const remoteTime = new Date(remote.dateModified).getTime();
    const cachedTime = new Date(cached.dateModified).getTime();

    if (Number.isNaN(remoteTime)) return true;
    if (Number.isNaN(cachedTime)) return true;

    return remoteTime > cachedTime;
  }

  async getStoreConfig(): Promise<IStoreConfig> {
    const expired = await this.isCacheExpired();

    if (
      this.memoryConfig &&
      this.isValidConfig(this.memoryConfig) &&
      !expired
    ) {
      console.log("[Config] Dùng memory cache");
      return this.memoryConfig;
    }

    const cached = await this.getCached();

    if (cached && this.isValidConfig(cached) && !expired) {
      console.log("[Config] Dùng AsyncStorage cache");
      this.memoryConfig = cached;
      return cached;
    }

    console.log("[Config] Cache rỗng/hết hạn/không hợp lệ → gọi API");

    const remote = await this.fetchFromAPI();

    if (remote && this.isValidConfig(remote)) {
      if (this.isNewer(remote, cached)) {
        console.log("[Config] Config mới → lưu cache");
      } else {
        console.log("[Config] Remote hợp lệ → cập nhật cache");
      }

      await this.saveCache(remote);
      this.memoryConfig = remote;
      return remote;
    }

    if (cached && this.isValidConfig(cached)) {
      console.log("[Config] API lỗi → dùng cache cũ hợp lệ");
      await this.refreshTTL();
      this.memoryConfig = cached;
      return cached;
    }

    console.warn("[Config] Không có config hợp lệ → dùng DEFAULT_CONFIG");
    this.memoryConfig = null;
    return DEFAULT_CONFIG;
  }

  async clearCache(): Promise<void> {
    this.memoryConfig = null;
    await AsyncStorage.multiRemove([CONFIG_KEY, TIMESTAMP_KEY]);
  }
}

export default new StoreConfigService();
