/**
 * src/utils/url.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Các helper xử lý URL, đặc biệt là chuyển relative URL của Liferay
 * (dạng /o/commerce-media/...) thành absolute URL.
 */


import { ENV } from "../config/env";

/**
 * Chuyển relative URL → absolute URL dựa vào ENV.API_URL.
 * Nếu đã là absolute thì chỉ đồng bộ protocol với BASE_URL.
 *
 * @example
 * toAbsoluteUrl("/o/commerce-media/thumbnail/123")
 * // → "http://192.168.2.152:8080/o/commerce-media/thumbnail/123"
 */
// export function toAbsoluteUrl(url?: string): string {
//   if (!url) return "";
//   if (!url.startsWith("http")) {
//     return `${ENV.API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
//   }

//   // Đồng bộ protocol (http ↔ https) với BASE_URL
//   const baseProtocol = ENV.API_URL.startsWith("https") ? "https://" : "http://";
//   return url.replace(/^https?:\/\//, baseProtocol);
// }

export function toAbsoluteUrl(url?: string): string {
  if (!url) return "";

  // Relative URL
  if (url.startsWith("/")) {
    return `${ENV.API_URL}${url}`;
  }

  // Absolute URL từ Liferay cũ
  try {
    const parsed = new URL(url);

    return `${ENV.API_URL}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * Normalize toàn bộ mảng images của một product.
 * Đảm bảo field `src` luôn là absolute URL.
 */
export function normalizeImages(
  images?: Array<{ src?: string; url?: string; [key: string]: unknown }>
) {
  if (!images) return [];
  return images.map((img) => ({
    ...img,
    src: toAbsoluteUrl(img.src ?? img.url),
  }));
}
