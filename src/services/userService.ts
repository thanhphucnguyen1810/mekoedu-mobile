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

let _cachedAccountId: number | null = null;
 
/** Xóa cache – gọi khi logout */
export function clearAccountCache(): void {
  _cachedAccountId = null;
}

export async function saveAccountId(accountId: number): Promise<void> {
  _cachedAccountId = accountId;
  await AsyncStorage.setItem(TOKEN_KEYS.ACCOUNT_ID, String(accountId));
}
 
async function getSavedAccountId(): Promise<number | null> {
  // Memory cache trước
  if (_cachedAccountId) return _cachedAccountId;
  const val = await AsyncStorage.getItem(TOKEN_KEYS.ACCOUNT_ID);
  if (val) {
    _cachedAccountId = parseInt(val, 10);
    return _cachedAccountId;
  }
  return null;
}

/** Lấy thông tin user đang đăng nhập */
export async function getMyUserInfo(): Promise<UserInfo> {
  const res = await http.get<UserInfo>(
    "/o/headless-admin-user/v1.0/my-user-account"
  );  
  return res.data;
}

/**
 * Đảm bảo user đã có Liferay Account.
 * * Thứ tự ưu tiên:
 * 1. Memory cache → trả về ngay (0 network call)
 * 2. AsyncStorage → trả về ngay (0 network call)
 * 3. userInfo.accountBriefs → 1 network call, lưu lại
 * 4. Tạo mới account + gán user → 3 network calls, lưu lại
 */
export async function ensureUserAccount(): Promise<number | null> {
  try {
    // ─── 1 & 2: Cache hit ────────────────────────────────────────────────────
    const saved = await getSavedAccountId();
    if (saved) {
      console.log(`[userService] accountId from cache: ${saved}`);
      return saved;
    }
 
    // ─── 3: Lấy từ Liferay userInfo ──────────────────────────────────────────
    const userInfo = await getMyUserInfo();
    console.log("[userService] userInfo:", userInfo);
 
    if (userInfo.accountBriefs?.length) {
      const accountId = userInfo.accountBriefs[0].id;
      await saveAccountId(accountId);
      console.log(`[userService] accountId from userInfo: ${accountId}`);
      return accountId;
    }
 
    // ─── 4: Tạo mới account ──────────────────────────────────────────────────
    console.log("[userService] Tạo mới account cho user...");
    const clientToken = await getClientToken();
 
    const createRes = await http.post(
      "/o/headless-admin-user/v1.0/accounts",
      {
        name: userInfo.alternateName || userInfo.emailAddress.split("@")[0],
        type: "person",
        description: `Account for ${userInfo.emailAddress}`,
      },
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );
 
    const accountId = createRes.data?.id;
    if (!accountId) throw new Error("Create account response missing id");
 
    // Gán user vào account
    await http.post(
      `/o/headless-admin-user/v1.0/accounts/${accountId}/user-accounts/by-email-address`,
      [userInfo.emailAddress],
      {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "Content-Type": "application/json",
        },
      }
    );
 
    await saveAccountId(accountId);
    console.log(`[userService] Created new accountId: ${accountId}`);
    return accountId;
  } catch (error) {
    console.error("[userService] ensureUserAccount failed:", error);
    return null;
  }
}
