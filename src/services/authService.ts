/**
 * src/services/liferay/authService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Xử lý toàn bộ luồng xác thực với Liferay OAuth2.
 * FIX: logoutUser chỉ xóa ACCESS + REFRESH token.
 * ACCOUNT_ID và CART_ID được GIỮ LẠI để khi đăng nhập lại,
 * cartService.findOrCreateCart() tìm thấy cart cũ thay vì tạo mới.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ENV } from "../config/env";
import { TOKEN_KEYS } from "../config/tokenKeys";
import type { RegisterPayload, TokenResponse, UserInfo } from "../types/liferay";
import { clearCartCache } from "./cartService";
import { clearAccountCache, saveAccountId } from "./userService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function basicAuthHeader(): string {
  return `Basic ${btoa(`${ENV.CLIENT_ID}:${ENV.CLIENT_SECRET}`)}`;
}

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

export async function registerUser(payload: RegisterPayload): Promise<UserInfo & { accountId?: number }> {
  const { access_token: clientToken } = await oauthPost({
    grant_type: "client_credentials",
  });

  const screenName =
    payload.screenName ??
    payload.emailAddress
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase() +
      Math.floor(Math.random() * 9000 + 1000);

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
    const userData = res.data;
    try {
      const accountId = await createAccountForUser(
        userData.id,
        userData.emailAddress,
        userData.alternateName || screenName,
        clientToken
      );
      await saveAccountId(accountId);
      console.log(`[authService] Register + accountId saved: ${accountId}`);
      return { ...userData, accountId };

    } catch (accountError) {
      console.error("[authService] Không thể tạo account cho user:", accountError);
      return userData;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const d = error.response.data;
      throw new Error(d.detail ?? d.title ?? d.message ?? `Register failed [${error.response.status}]`);
    }
    throw error;
  }
}

async function createAccountForUser(
  userId: number,
  email: string,
  alternateName: string,
  clientToken: string
): Promise<number> {
  const createRes = await axios.post(
    `${ENV.API_URL}/o/headless-admin-user/v1.0/accounts`,
    {
      name: alternateName || email.split("@")[0],
      type: "person",
      description: `Account for ${email}`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
    }
  );

  const accountId = createRes.data?.id;
  if (!accountId) {
    throw new Error("Không thể tạo account: response thiếu accountId");
  }

  await axios.post(
    `${ENV.API_URL}/o/headless-admin-user/v1.0/accounts/${accountId}/user-accounts/by-email-address`,
    [email],
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
      },
    }
  );

  return accountId;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ access_token: string; refresh_token: string }> {
  const tokens = await oauthPost({
    grant_type: "password",
    username: email.trim(),
    password,
  });

  clearAccountCache();
  clearCartCache();
  await AsyncStorage.multiRemove([TOKEN_KEYS.ACCOUNT_ID, TOKEN_KEYS.CART_ID]);

  await persistTokens(tokens);
  try {
    const { ensureUserAccount } = await import("./userService");
    await ensureUserAccount();
    console.log("[authService] accountId restored after login");
  } catch (e) {
    console.warn("[authService] ensureUserAccount after login failed:", e);
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? "",
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const tokens = await oauthPost({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  await persistTokens(tokens);
  return tokens;
}

/**
 * Đăng xuất: chỉ xóa ACCESS + REFRESH token.
 */
export async function logoutUser(): Promise<void> {
  await AsyncStorage.multiRemove([
    TOKEN_KEYS.ACCESS,
    TOKEN_KEYS.REFRESH,
    TOKEN_KEYS.ACCOUNT_ID,
  ]);
  clearCartCache();
  clearAccountCache();
  console.log("[authService] Logged out – token cleared, cart/account cache preserved");
}

export async function getClientToken(): Promise<string> {
  const tokens = await oauthPost({ grant_type: "client_credentials" });
  return tokens.access_token;
}
