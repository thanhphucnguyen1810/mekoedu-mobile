/**
 * src/services/liferay/userService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Quản lý user profile và Liferay Account.
 * Dùng `http` (httpClient) với token auto-attach.
 */

import { ENV } from "../config/env";
import { http } from "../config/httpClient";
import type { UserInfo } from "../types/liferay";
import { getClientToken } from "./authService";

/** Lấy thông tin user đang đăng nhập */
export async function getMyUserInfo(): Promise<UserInfo> {
  const res = await http.get<UserInfo>(
    "/o/headless-admin-user/v1.0/my-user-account"
  );
  return res.data;
}

/**
 * Đảm bảo user đã có Liferay Account.
 * Nếu chưa có, tự động tạo và gán account cho user.
 * Trả về accountId.
 */
export async function ensureUserAccount(): Promise<number | null> {
  try {
    const userInfo = await getMyUserInfo();
    if (userInfo.accountBriefs?.length) {
      return userInfo.accountBriefs[0].id;
    }

    // Tạo account mới bằng client token (admin quyền)
    const clientToken = await getClientToken();

    const createRes = await http.post(
      "/o/headless-admin-user/v1.0/accounts",
      { name: userInfo.alternateName || userInfo.emailAddress, type: "person" },
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );

    const accountId: number = createRes.data?.id;
    if (!accountId) throw new Error("No accountId in response");

    // Gán user vào account
    await http.post(
      `/o/headless-admin-user/v1.0/accounts/${accountId}/user-accounts/by-email-address`,
      [userInfo.emailAddress],
      { headers: { Authorization: `Bearer ${clientToken}`, "Content-Type": "application/json" } }
    );

    return accountId;
  } catch (error) {
    console.error("[userService] ensureUserAccount failed:", error);
    return null;
  }
}
