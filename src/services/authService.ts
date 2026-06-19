/**
 * src/services/liferay/authService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Xử lý toàn bộ luồng xác thực với Liferay OAuth2:
 *   - registerUser   – tạo tài khoản mới (client_credentials flow)
 *   - loginUser      – đăng nhập, lưu token vào AsyncStorage
 *   - refreshAccessToken – làm mới access token
 *   - logoutUser     – xóa token
 *   - getUserToken   – lấy access token từ storage
 *
 * Không phụ thuộc vào `http` (httpClient) để tránh vòng lặp interceptor.
 * Dùng `fetch` thuần cho các OAuth2 endpoint.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ENV } from "../config/env";
import { TOKEN_KEYS } from "../config/tokenKeys";
import type { RegisterPayload, TokenResponse, UserInfo } from "../types/liferay";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tạo Basic Auth header từ CLIENT_ID + CLIENT_SECRET */
function basicAuthHeader(): string {
  return `Basic ${btoa(`${ENV.CLIENT_ID}:${ENV.CLIENT_SECRET}`)}`;
}

/** Gọi /o/oauth2/token với URLSearchParams body */
async function oauthPost(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${ENV.API_URL}/o/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams(params).toString(),
  });

  const responseText = await res.text();

  let data: any = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.warn("OAuth Response không phải là JSON hợp lệ:", responseText);
    }
  }
  
  if (!res.ok) {
    throw new Error(data.error_description ?? data.error ?? `OAuth error ${res.status}`);
  }
  return data as TokenResponse;
}

/** Lưu token mới vào AsyncStorage */
async function persistTokens(data: TokenResponse): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, data.access_token);
  if (data.refresh_token) {
    await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh_token);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getUserToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEYS.ACCESS);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEYS.REFRESH);
  } catch {
    return null;
  }
}

/**
 * Đăng ký tài khoản mới trên Liferay.
 * Dùng client_credentials token (không cần user đăng nhập).
 */
export async function registerUser(payload: RegisterPayload): Promise<UserInfo> {
  // 1. Lấy client token
  const { access_token: clientToken } = await oauthPost({
    grant_type: "client_credentials",
  });

  // 2. Sinh screenName nếu không truyền
  const screenName =
    payload.screenName ??
    payload.emailAddress
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase() +
      Math.floor(Math.random() * 9000 + 1000);

  // 3. Tạo user
  try {
    const res = await axios.post<UserInfo>(
      `${ENV.API_URL}/o/headless-admin-user/v1.0/user-accounts`,
      {
        emailAddress: payload.emailAddress.trim(),
        givenName: payload.givenName.trim(),
        familyName: payload.familyName.trim(),
        alternateName: screenName,
        password: payload.password,
      },
      {
        headers: {
          "Content-Type": "application/json", 
          Authorization: `Bearer ${clientToken}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const d = error.response.data;
      throw new Error(d.detail ?? d.title ?? d.message ?? `Register failed [${error.response.status}]`);
    }
    throw error;
  }
}

/**
 * Đăng nhập bằng Resource Owner Password Credentials (ROPC).
 * Trả về tokens + thông tin user cơ bản.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ access_token: string; refresh_token: string }> {
  const tokens = await oauthPost({
    grant_type: "password",
    username: email.trim(),
    password,
  });

  await persistTokens(tokens);
  return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
}

/** Làm mới access token bằng refresh token */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const tokens = await oauthPost({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  await persistTokens(tokens);
  return tokens;
}

/** Đăng xuất: xóa toàn bộ token khỏi storage */
export async function logoutUser(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH]);
}

/** Lấy client_credentials token (không cần user đăng nhập) */
export async function getClientToken(): Promise<string> {
  const tokens = await oauthPost({ grant_type: "client_credentials" });
  return tokens.access_token;
}
