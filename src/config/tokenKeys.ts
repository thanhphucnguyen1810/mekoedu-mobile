/**
 * src/config/tokenKeys.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tập trung tất cả AsyncStorage key liên quan đến auth.
 * Import từ đây thay vì viết string trực tiếp ở mỗi file.
 */

export const TOKEN_KEYS = {
  ACCESS:  "access_token",
  REFRESH: "refresh_token",
  CART_ID: "liferay_cart_id",
} as const;
