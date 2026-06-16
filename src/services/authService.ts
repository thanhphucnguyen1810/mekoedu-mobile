import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Buffer } from "buffer";
import { ENV } from "../types/env";
import storeConfigService from "./storeConfigService";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  givenName: string;
  familyName: string;
  emailAddress: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface UserAccountResponse {
  id: number;
  name: string;
  givenName: string;
  familyName: string;
  emailAddress: string;
  alternateName: string;
}

export interface AccountResponse {
  id: number;
  name: string;
  type?: string;
  externalReferenceCode?: string;
}

export interface RegisterResponse {
  user: UserAccountResponse;
  account: AccountResponse;
}

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const ACCOUNT_ID_KEY = "account_id";
const USER_ID_KEY = "user_id";

class AuthService {
  private async getApiBaseUrl(): Promise<string> {
    // const config = await storeConfigService.getStoreConfig();
    // return config.apiBaseUrl || ENV.API_URL;
    return ENV.API_URL;
  }

  private async getTokenUrl(): Promise<string> {
    const apiBaseUrl = await this.getApiBaseUrl();
    return `${apiBaseUrl}/o/oauth2/token`;
  }

  getBasicAuth(): string {
    return Buffer.from(`${ENV.CLIENT_ID}:${ENV.CLIENT_SECRET}`).toString(
      "base64",
    );
  }

  private async getClientToken(): Promise<string> {
    const tokenUrl = await this.getTokenUrl();

    try {
      const { data } = await axios.post<AuthTokenResponse>(
        tokenUrl,
        new URLSearchParams({
          grant_type: "client_credentials",
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${this.getBasicAuth()}`,
          },
        },
      );

      return data.access_token;
    } catch (error: any) {
      console.error(
        "Get client token failed:",
        error.response?.data || error.message,
      );

      throw new Error("Không lấy được client token");
    }
  }

  private createScreenName(email: string): string {
    return (
      email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase() + Math.floor(Math.random() * 9000 + 1000)
    );
  }

  private async saveTokens(data: AuthTokenResponse): Promise<void> {
    const values: [string, string][] = [[ACCESS_TOKEN_KEY, data.access_token]];

    if (data.refresh_token) {
      values.push([REFRESH_TOKEN_KEY, data.refresh_token]);
    }

    await AsyncStorage.multiSet(values);
  }

  private async saveUserAndAccount(
    user: UserAccountResponse,
    account: AccountResponse,
  ): Promise<void> {
    await AsyncStorage.multiSet([
      [USER_ID_KEY, String(user.id)],
      [ACCOUNT_ID_KEY, String(account.id)],
    ]);
  }

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      const apiBaseUrl = await this.getApiBaseUrl();
      const clientToken = await this.getClientToken();

      const email = payload.emailAddress.trim().toLowerCase();
      const encodedEmail = encodeURIComponent(email);
      const givenName = payload.givenName.trim();
      const familyName = payload.familyName.trim();
      const fullName = `${familyName} ${givenName}`.trim();

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${clientToken}`,
      };

      const userRes = await axios.post<UserAccountResponse>(
        `${apiBaseUrl}/o/headless-admin-user/v1.0/user-accounts`,
        {
          givenName,
          familyName,
          emailAddress: email,
          alternateName: this.createScreenName(email),
          password: payload.password,
        },
        { headers },
      );

      const user = userRes.data;

      const accountRes = await axios.post<AccountResponse>(
        `${apiBaseUrl}/o/headless-admin-user/v1.0/accounts`,
        {
          name: fullName,
          type: "person",
          externalReferenceCode: `USER_${user.id}`,
        },
        { headers },
      );

      const account = accountRes.data;

      await axios.post(
        `${apiBaseUrl}/o/headless-admin-user/v1.0/accounts/${account.id}/user-accounts/by-email-address/${encodedEmail}`,
        {},
        { headers },
      );

      await this.saveUserAndAccount(user, account);

      return {
        user,
        account,
      };
    } catch (error: any) {
      console.error("Register failed:", error.response?.data || error.message);

      const msg =
        error.response?.data?.title ||
        error.response?.data?.message ||
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        `[API ${error.response?.status ?? "NETWORK"}] Đăng ký thất bại`;

      throw new Error(msg);
    }
  }

  async login(payload: LoginPayload): Promise<AuthTokenResponse> {
    try {
      const tokenUrl = await this.getTokenUrl();

      const { data } = await axios.post<AuthTokenResponse>(
        tokenUrl,
        new URLSearchParams({
          grant_type: "password",
          username: payload.username.trim(),
          password: payload.password,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${this.getBasicAuth()}`,
          },
        },
      );

      await this.saveTokens(data);
      return data;
    } catch (error: any) {
      const msg =
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        `[API ${error.response?.status ?? "NETWORK"}] Đăng nhập thất bại`;

      console.error("Login failed:", error.response?.data || error.message);
      throw new Error(msg);
    }
  }

  async refreshToken(): Promise<AuthTokenResponse> {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error("Không tìm thấy refresh token");
    }

    try {
      const tokenUrl = await this.getTokenUrl();

      const { data } = await axios.post<AuthTokenResponse>(
        tokenUrl,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${this.getBasicAuth()}`,
          },
        },
      );

      await this.saveTokens(data);
      return data;
    } catch (error: any) {
      const msg =
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        `[API ${error.response?.status ?? "NETWORK"}] Làm mới token thất bại`;

      console.error(
        "Refresh token failed:",
        error.response?.data || error.message,
      );

      await this.logout();
      throw new Error(msg);
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      ACCOUNT_ID_KEY,
      USER_ID_KEY,
    ]);
    await storeConfigService.clearCache();
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async getAccountId(): Promise<number | null> {
    const value = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
    return value ? Number(value) : null;
  }

  async getUserId(): Promise<number | null> {
    const value = await AsyncStorage.getItem(USER_ID_KEY);
    return value ? Number(value) : null;
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAccessToken();
    return Boolean(token);
  }
}

export default new AuthService();
