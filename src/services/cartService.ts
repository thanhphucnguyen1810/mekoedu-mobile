/**
 * src/services/liferay/cartService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Quản lý giỏ hàng Liferay Commerce theo đúng chuẩn Liferay.
 * - Cart là Order có orderStatusInfo.code === 2 (open)
 * - Mỗi account có thể có nhiều cart open, nhưng ta ưu tiên cart có items
 *   hoặc cart mới nhất.
 * - Khi checkout, cart chuyển trạng thái khác → không tái sử dụng.
 */

import { ENV } from "@/src/config/env";
import { TOKEN_KEYS } from "@/src/config/tokenKeys";
import type { Cart, CartItem, CartSummary } from "@/src/types/liferay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getUserToken } from "./authService";
import { ensureUserAccount } from "./userService";

const CART_STORAGE_KEY = TOKEN_KEYS.CART_ID ?? "cart_id";
const BASE_URL = ENV.API_URL;
const CHANNEL_ID = ENV.CHANNEL_ID;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── URL helper ───────────────────────────────────────────────────────────────

/**
 * Chuyển relative URL của Liferay → absolute URL có thể load được.
 * "/o/commerce-media/..." → "http://host:port/o/commerce-media/..."
 */
function toAbsoluteUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCartItem(raw: any): CartItem {
  // Log raw lần đầu để biết Liferay trả field nào
  if (__DEV__) {
    const keys = Object.keys(raw);
    console.log("[cartService] raw cart item keys:", keys.join(", "));
    console.log("[cartService] raw.name:", raw.name, "| raw.productName:", raw.productName, "| raw.skuName:", raw.skuName);
    console.log("[cartService] raw.thumbnail:", raw.thumbnail, "| raw.imageUrl:", raw.imageUrl);
  }

  const priceObj = typeof raw.price === "object" && raw.price !== null ? raw.price : null;
  const price = priceObj
    ? (priceObj.price ?? priceObj.finalPrice ?? priceObj.unitPrice ?? 0)
    : (raw.price ?? 0);
  const promoPrice = priceObj
    ? (priceObj.promoPrice ?? priceObj.discountedPrice ?? undefined)
    : undefined;

  // Lấy name — thử tất cả field có thể có
  const name =
    raw.name ?? raw.sku?.name ?? raw.product?.name ?? raw.skuName ?? raw.productName ?? "";

  const rawThumb: string =
    raw.thumbnail ?? raw.imageUrl ?? raw.image ??
    raw.sku?.imageUrl ?? raw.product?.imageUrl ?? "";
  const thumbnail =
    rawThumb && !rawThumb.startsWith("http")
      ? `${BASE_URL}${rawThumb}`
      : rawThumb;

  const catalogName =
    raw.catalogName ||
    raw.product?.catalogName ||
    raw.sku?.catalogName ||
    "MekoEdu";

  const cartItemId = raw.id ?? raw.cartItemId ?? 0;

  return {
    id: raw.productId ?? raw.product?.productId ?? raw.product?.id ?? raw.skuId ?? raw.sku?.id ?? 0,
    cartItemId,
    skuId: raw.skuId ?? raw.sku?.id ?? 0,
    quantity: raw.quantity ?? 1,
    name,
    price,
    promoPrice,
    thumbnail,
    catalogName,
  };
}

function toCartSummary(raw: any): CartSummary | null {
  if (!raw) return null;
  return {
    subtotal: raw.subtotal ?? 0,
    subtotalFormatted: raw.subtotalFormatted ?? "",
    total: raw.total ?? raw.subtotal ?? 0,
    totalFormatted: raw.totalFormatted ?? raw.subtotalFormatted ?? "",
    discountAmount: raw.subtotalDiscountAmount ?? raw.discountAmount ?? 0,
    discountAmountFormatted: raw.subtotalDiscountAmountFormatted ?? "",
    shippingAmount: raw.shippingValue ?? raw.shippingAmount ?? 0,
    shippingAmountFormatted: raw.shippingValueFormatted ?? "",
    taxAmount: raw.taxValue ?? raw.taxAmount ?? 0,
    taxAmountFormatted: raw.taxValueFormatted ?? "",
  };
}

// Hàm lưu cartId
async function saveCartId(accountId: number, id: number): Promise<void> {
  await AsyncStorage.setItem(getCartStorageKey(accountId), String(id));
}

// Hàm lấy cartId
async function getSavedCartId(accountId: number): Promise<number | null> {
  const val = await AsyncStorage.getItem(getCartStorageKey(accountId));
  return val ? parseInt(val, 10) : null;
}

// ─── Module-level singleton ───────────────────────────────────────────────────

let _cachedCartId: number | null = null;
let _resolvePromise: Promise<number | null> | null = null;

export function clearCartCache(): void {
  _cachedCartId = null;
  _resolvePromise = null;
  AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
  console.log("[cartService] 🧹 Cleared cart cache + storage");
}

// ─── Kiểm tra cart open ──────────────────────────────────────────────────────

/**
 * Kiểm tra một cart có phải là "open" (có thể tái sử dụng) không.
 * Dùng orderStatusInfo.code === 2 (Liferay Commerce chuẩn).
 */
function isCartOpen(cartData: any): boolean {
  const orderStatus = cartData?.orderStatusInfo;
  // code = 2 là "open", label = "open" cũng được
  return orderStatus?.code === 2 || orderStatus?.label?.toLowerCase() === "open";
}

/**
 * Lấy thông tin cart từ Liferay.
 * Trả về null nếu không tìm thấy hoặc lỗi.
 */
async function fetchCart(cartId: number, token: string): Promise<any | null> {
  try {
    const res = await axios.get(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// Định nghĩa prefix key
const CART_STORAGE_PREFIX = "cart_";

// Hàm tạo key cho account
function getCartStorageKey(accountId: number): string {
  return `${CART_STORAGE_PREFIX}${accountId}`;
}


// ─── Public API ───────────────────────────────────────────────────────────────

export async function getCart(cartId: number): Promise<Cart | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;

    const [cartRes, itemsRes] = await Promise.all([
      axios.get(
        `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      axios.get(
        `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`,
        { headers: { Authorization: `Bearer ${token}` }, params: { pageSize: 100 } }
      ),
    ]);

    let cartItems = (itemsRes.data?.items ?? []).map(toCartItem);

    // ✅ Nếu name trống → fetch product để lấy tên thật
    // Liferay cart item đôi khi không trả name, cần gọi thêm product API
    const itemsNeedingName = cartItems.filter((i: CartItem) => !i.name && i.id);
    if (itemsNeedingName.length > 0) {
      console.log("[cartService] Fetching product names for", itemsNeedingName.length, "items...");
      await Promise.allSettled(
        itemsNeedingName.map(async (item: CartItem) => {
          try {
            const res = await axios.get(
              `${BASE_URL}/o/headless-commerce-delivery-catalog/v1.0/channels/${CHANNEL_ID}/products/${item.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const productName = res.data?.name || res.data?.productNames?.["vi_VN"] || res.data?.productNames?.["en_US"] || "";
            if (productName) {
              item.name = productName;
            }
            // Lấy thumbnail từ product nếu cart item không có
            if (!item.thumbnail && res.data?.images?.[0]?.src) {
              item.thumbnail = toAbsoluteUrl(res.data.images[0].src);
            }
          } catch (e) {
            console.warn(`[cartService] Could not fetch product ${item.id}`);
          }
        })
      );
    }

    const summary = toCartSummary(cartRes.data?.summary);

    return { ...cartRes.data, cartItems, summary } as Cart;
  } catch (error: any) {
    const status = error?.response?.status;
    console.error(`[cartService] getCart failed (${status}):`, cartId);
    if (status === 404 || status === 403) {
      if (_cachedCartId === cartId) _cachedCartId = null;
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    }
    return null;
  }
}

/**
 * Tìm hoặc tạo cart cho account hiện tại.
 * Logic:
 * 1. Memory cache → trả về ngay.
 * 2. AsyncStorage savedId → fetch cart → nếu open → dùng.
 * 3. Gọi API tìm open cart của account → nếu có → lưu và dùng.
 * 4. Không có → tạo mới.
 */
export async function findOrCreateCart(): Promise<number | null> {
  if (_cachedCartId) return _cachedCartId;
  if (_cachedCartId) return _cachedCartId;

  if (_resolvePromise) {
    console.log("[cartService] ⏳ Chờ resolve...");
    return _resolvePromise;
  }

  _resolvePromise = _doFindOrCreate();
  try {
    const id = await _resolvePromise;
    if (id) _cachedCartId = id;
    return id;
  } finally {
    _resolvePromise = null;
  }
}

async function _doFindOrCreate(): Promise<number | null> {
  const token = await getUserToken();
  if (!token) return null;

  // ─── Bước 1: Lấy accountId ──────────────────────────────────────────────────
  const accountId = await ensureUserAccount();
  if (!accountId) {
    console.error("[cartService]  Không có accountId");
    return null;
  }

  // ─── Bước 2: Kiểm tra cart saved theo accountId ──────────────────────────
  const savedId = await getSavedCartId(accountId);
  if (savedId) {
    try {
      const cartData = await fetchCart(savedId, token);
      if (cartData && isCartOpen(cartData)) {
        console.log(`[cartService] Tái sử dụng cart saved: ${savedId} (account ${accountId})`);
        return savedId;
      } else {
        console.log(`[cartService] Cart ${savedId} không còn open, sẽ tạo mới`);
        // Xóa key cũ để tránh dùng lại
        await AsyncStorage.removeItem(getCartStorageKey(accountId));
      }
    } catch (err) {
      console.warn(`[cartService] Lỗi khi kiểm tra cart saved ${savedId}:`, err);
      await AsyncStorage.removeItem(getCartStorageKey(accountId));
    }
  }

  // ─── Bước 3: Tạo mới cart ──────────────────────────────────────────────────
  console.log(`[cartService] 🛒 Tạo cart mới cho account ${accountId}`);
  try {
    const cartRes = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/channels/${CHANNEL_ID}/carts`,
      {
        currencyCode: "VND",
        accountId,
        channelId: parseInt(CHANNEL_ID, 10),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const newCartId = cartRes.data?.id;
    if (!newCartId) throw new Error("Cart response missing id");

    // Đợi cart ready
    await waitForCartReady(newCartId, token);

    await saveCartId(accountId, newCartId);
    console.log(`[cartService] Tạo cart thành công: ${newCartId}`);
    return newCartId;
  } catch (error: any) {
    console.error("[cartService] Tạo cart thất bại:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    return null;
  }
}

/** Đợi cart có thể GET được (retry) */
async function waitForCartReady(
  cartId: number,
  token: string,
  maxRetries = 5,
  baseDelay = 500
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await axios.get(
        `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`[cartService] ✅ Cart ${cartId} ready after ${attempt + 1} attempt(s)`);
      return true;
    } catch (err: any) {
      if (err.response?.status === 404 && attempt < maxRetries - 1) {
        const delay = baseDelay * (attempt + 1);
        console.log(`[cartService] ⏳ Cart ${cartId} not ready, retry in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  return false;
}

// ─── Các hàm thao tác giỏ hàng (giữ nguyên) ─────────────────────────────────

export async function addItem(
  cartId: number,
  skuId: number,
  quantity = 1,
  retry = false
): Promise<number | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`,
      { skuId, quantity },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data?.id ?? null;
  } catch (error: any) {
    const status = error?.response?.status;
    console.error(`[cartService] addItem failed (${status}): cartId=${cartId}, skuId=${skuId}`);
    if (!retry && (status === 404 || status === 403)) {
      console.log("[cartService] Cart invalid → tạo cart mới và thử lại");
      _cachedCartId = null;
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      const newCartId = await findOrCreateCart();
      if (newCartId) return addItem(newCartId, skuId, quantity, true);
    }
    return null;
  }
}

export async function updateQuantity(
  cartItemId: number,
  quantity: number
): Promise<boolean> {
  try {
    const token = await getUserToken();
    if (!token) return false;
    await axios.patch(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/cart-items/${cartItemId}`,
      { quantity },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return true;
  } catch (error: any) {
    console.error(`[cartService] updateQuantity failed (${error?.response?.status}):`, cartItemId);
    return false;
  }
}

export async function removeItem(cartItemId: number): Promise<boolean> {
  if (!cartItemId) return false;
  try {
    const token = await getUserToken();
    if (!token) return false;
    await axios.delete(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/cart-items/${cartItemId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return true;
  } catch (error: any) {
    console.error(`[cartService] removeItem failed (${error?.response?.status}):`, cartItemId);
    return false;
  }
}

export async function clearCart(cartId: number): Promise<boolean> {
  try {
    const cart = await getCart(cartId);
    if (!cart?.cartItems?.length) return true;
    const token = await getUserToken();
    if (!token) return false;
    const itemIds = cart.cartItems.map((i) => i.cartItemId).filter((id): id is number => !!id);
    let ok = true;
    for (const id of itemIds) {
      try {
        await axios.delete(
          `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/cart-items/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e: any) {
        console.error(`[cartService] delete item ${id} failed:`, e?.response?.status);
        ok = false;
      }
    }
    return ok;
  } catch (error) {
    console.error("[cartService] clearCart failed:", error);
    return false;
  }
}

export async function applyCoupon(
  cartId: number,
  couponCode: string
): Promise<Cart | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/coupon-code`,
      { couponCode },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { ...res.data, summary: toCartSummary(res.data?.summary) } as Cart;
  } catch (error) {
    console.error("[cartService] applyCoupon failed:", error);
    return null;
  }
}

export async function removeCoupon(cartId: number): Promise<Cart | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.patch(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}`,
      { couponCode: "" },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { ...res.data, summary: toCartSummary(res.data?.summary) } as Cart;
  } catch (error) {
    console.error("[cartService] removeCoupon failed:", error);
    return null;
  }
}

export async function getCartPaymentUrl(cartId: number): Promise<string | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.get(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/payment-url`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.paymentURL ?? res.data?.url ?? null;
  } catch (error) {
    console.error("[cartService] getCartPaymentUrl failed:", error);
    return null;
  }
}

export async function checkout(cartId: number): Promise<{
  orderId: number;
  summary: CartSummary | null;
} | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/checkout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Cart cũ đã thành order → xóa cache để lần mua tiếp tạo cart mới
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    clearCartCache();
    console.log(`[cartService] ✅ Checkout OK, cleared cart cache`);

    return {
      orderId: res.data?.id ?? res.data?.orderId ?? cartId,
      summary: toCartSummary(res.data?.summary),
    };
  } catch (error) {
    console.error("[cartService] checkout failed:", error);
    return null;
  }
}
