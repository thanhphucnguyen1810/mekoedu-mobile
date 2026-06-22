/**
 * src/services/liferay/userService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Quản lý user profile và Liferay Account.
 * Dùng `http` (httpClient) với token auto-attach.
 */

import { http } from "@/src/config/httpClient";
import { TOKEN_KEYS } from "@/src/config/tokenKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserInfo } from "../types/liferay";
import { getClientToken } from "./authService";


/** Lấy thông tin user đang đăng nhập */
export async function getMyUserInfo(): Promise<UserInfo> {
  const res = await http.get<UserInfo>(
    "/o/headless-admin-user/v1.0/my-user-account"
  );  
  return res.data;
}

async function saveAccountId(accountId: number): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEYS.ACCOUNT_ID, String(accountId));
}

async function getSavedAccountId(): Promise<number | null> {
  const val = await AsyncStorage.getItem(TOKEN_KEYS.ACCOUNT_ID);
  return val ? parseInt(val, 10) : null;
}

/**
 * Đảm bảo user đã có Liferay Account.
 * Nếu chưa có, tự động tạo và gán account cho user.
 * Trả về accountId.
 */
export async function ensureUserAccount(): Promise<number | null> {
  try {
    // Kiểm tra cache
    const savedAccountId = await getSavedAccountId();
    if (savedAccountId) {
      console.log(`[userService] Using saved accountId: ${savedAccountId}`);
      return savedAccountId;
    }

    const userInfo = await getMyUserInfo();
    console.log('[userService] userInfo:', userInfo);
    
    if (userInfo.accountBriefs?.length) {
      const accountId = userInfo.accountBriefs[0].id;
      await saveAccountId(accountId);
      console.log(`[userService] Found accountId from userInfo: ${accountId}`);
      return accountId;
    }

    // Tạo mới...
    const clientToken = await getClientToken();
    const createRes = await http.post(
      "/o/headless-admin-user/v1.0/accounts",
      { name: userInfo.alternateName || userInfo.emailAddress, type: "person" },
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );

    const accountId = createRes.data?.id;
    if (!accountId) throw new Error("No accountId");

    await http.post(
      `/o/headless-admin-user/v1.0/accounts/${accountId}/user-accounts/by-email-address`,
      [userInfo.emailAddress],
      { headers: { Authorization: `Bearer ${clientToken}`, "Content-Type": "application/json" } }
    );

    await saveAccountId(accountId);
    console.log(`[userService] Created new accountId: ${accountId}`);
    return accountId;
  } catch (error) {
    console.error("[userService] ensureUserAccount failed:", error);
    return null;
  }
}
