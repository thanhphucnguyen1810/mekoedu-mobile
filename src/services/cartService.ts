/**
 * src/services/liferay/cartService.ts  (hoặc services/cartService.ts)
 *
 * Dùng axios trực tiếp + getUserToken() — giống file gốc của bạn.
 * 
 * FIX so với file gốc:
 * 1. Memory cache _cachedCartId: trả về ngay không gọi network nếu đã biết
 * 2. Singleton mutex _resolvePromise: nhiều caller đồng thời chờ chung 1 lần
 * 3. sleep(500) sau tạo cart mới để Liferay kịp index
 * 4. Bỏ hoàn toàn channel/account API và OData filter (2 endpoint bạn không hỗ trợ)
 * 5. clearCartCache() để logout/checkout reset đúng chỗ
 */

import { ENV } from "@/src/config/env"; // hoặc import { BASE_URL, CHANNEL_ID } từ config của bạn
import { TOKEN_KEYS } from "@/src/config/tokenKeys";
import type { Cart, CartItem, CartSummary } from "@/src/types/liferay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getUserToken } from "./authService";
import { ensureUserAccount } from "./userService";

// ─── Config ───────────────────────────────────────────────────────────────────
// Dùng cùng key storage với file gốc của bạn
const CART_STORAGE_KEY = TOKEN_KEYS.CART_ID ?? "cart_id";
const BASE_URL = ENV.API_URL;
const CHANNEL_ID = ENV.CHANNEL_ID;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCartItem(raw: any): CartItem {
  const priceObj = typeof raw.price === "object" && raw.price !== null ? raw.price : null;
  const price = priceObj
    ? (priceObj.price ?? priceObj.finalPrice ?? priceObj.unitPrice ?? 0)
    : (raw.price ?? 0);
  const promoPrice = priceObj
    ? (priceObj.promoPrice ?? priceObj.discountedPrice ?? undefined)
    : undefined;

  const name =
    raw.name ?? raw.sku?.name ?? raw.product?.name ?? raw.skuName ?? raw.productName ?? "";
  const thumbnail =
    raw.thumbnail ?? raw.imageUrl ?? raw.image ??
    raw.sku?.imageUrl ?? raw.product?.imageUrl ?? "";
  const catalogName =
    raw.catalogName ?? raw.product?.catalogName ?? raw.sku?.catalogName ?? "MekoEdu";
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

async function getSavedCartId(): Promise<number | null> {
  const val = await AsyncStorage.getItem(CART_STORAGE_KEY);
  return val ? parseInt(val, 10) : null;
}

async function saveCartId(id: number): Promise<void> {
  await AsyncStorage.setItem(CART_STORAGE_KEY, String(id));
}

// ─── Module-level singleton ───────────────────────────────────────────────────
let _cachedCartId: number | null = null;
let _resolvePromise: Promise<number | null> | null = null;

/** Xóa cache — gọi sau logout hoặc checkout */
export function clearCartCache(): void {
  _cachedCartId = null;
  _resolvePromise = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────
/** Đợi cart có thể GET được (retry với backoff) */
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
        const delay = baseDelay * (attempt + 1); // 500, 1000, 1500, ...
        console.log(`[cartService] ⏳ Cart ${cartId} not ready, retry in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw err; // lỗi khác hoặc hết retry
    }
  }
  return false;
}

export async function getCart(cartId: number): Promise<Cart | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;

    const [cartRes, itemsRes] = await Promise.all([
      axios.get(`${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { pageSize: 100 },
      }),
    ]);

    const cartItems = (itemsRes.data?.items ?? []).map(toCartItem);
    const summary = toCartSummary(cartRes.data?.summary);
    console.log(cartItems);
    
    return { ...cartRes.data, cartItems, summary } as Cart;
  } catch (error) {
    console.error("[cartService] getCart failed:", error);
    return null;
  }
}

/**
 * Tìm hoặc tạo cart.
 *
 * Logic (giống file gốc, thêm cache + mutex):
 * 1. Memory cache → trả về ngay
 * 2. Mutex → nếu đang resolve thì chờ chung
 * 3. AsyncStorage saved → verify còn sống không
 * 4. Tạo mới nếu không có / hết hạn
 */
export async function findOrCreateCart(): Promise<number | null> {
  // Fast path: memory cache
  if (_cachedCartId) {
    return _cachedCartId;
  }

  // Mutex: chỉ 1 lần chạy, các caller khác chờ
  if (_resolvePromise) {
    console.log("[cartService] ⏳ Đang resolve, chờ...");
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

  // ─── Bước 1: Dùng cart đã lưu ─────────────────────────────────────────────
  const savedCartId = await getSavedCartId();
  if (savedCartId) {
    try {
      console.log(`[cartService] Kiểm tra cart saved: ${savedCartId}`);
      const res = await axios.get(
        `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${savedCartId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.id) {
        console.log(`[cartService] ✅ Dùng lại cart: ${savedCartId}`);
        return savedCartId;
      }
    } catch (err: any) {
      console.log(`[cartService] Cart saved không hợp lệ (${err?.response?.status}), tạo mới`);
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    }
  }

  // ─── Bước 2: Đảm bảo có accountId ─────────────────────────────────────────
  const accountId = await ensureUserAccount();
  if (!accountId) {
    console.error("[cartService] ❌ Không có accountId");
    return null;
  }

  // ─── Bước 3: Tạo cart mới ─────────────────────────────────────────────────
  console.log(`[cartService] 🛒 Tạo cart mới: accountId=${accountId}, channel=${CHANNEL_ID}`);
  try {
    const cartRes = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/channels/${CHANNEL_ID}/carts`,
      { currencyCode: "VND", accountId, channelId: parseInt(CHANNEL_ID, 10) },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const newCartId = cartRes.data?.id;
    if (!newCartId) throw new Error("Cart response missing id");

    // ─── Bước 4: Đợi cart ready (retry) ──────────────────────────────────────
    await waitForCartReady(newCartId, token);
    
    // ─── Bước 5: Lưu và trả về ───────────────────────────────────────────────
    await saveCartId(newCartId);
    console.log(`[cartService] ✅ Tạo cart thành công: ${newCartId}`);
    return newCartId;
  } catch (error: any) {
    console.error("[cartService] ❌ Tạo cart thất bại:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return null;
  }
}

export async function addItem(cartId: number, skuId: number, quantity = 1): Promise<number | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`,
      { skuId, quantity },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return res.data?.id ?? null;
  } catch (error) {
    console.error("[cartService] addItem failed:", error);
    return null;
  }
}

export async function updateQuantity(cartItemId: number, quantity: number): Promise<boolean> {
  try {
    const token = await getUserToken();
    if (!token) return false;
    await axios.patch(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/cart-items/${cartItemId}`,
      { quantity },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return true;
  } catch (error) {
    console.error("[cartService] updateQuantity failed:", error);
    return false;
  }
}

export async function removeItem(cartItemId: number): Promise<boolean> {
  if (!cartItemId) {
    console.error("[cartService] removeItem: cartItemId không hợp lệ");
    return false;
  }
  try {
    const token = await getUserToken();
    if (!token) return false;
    await axios.delete(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/cart-items/${cartItemId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return true;
  } catch (error: any) {
    console.error("[cartService] removeItem failed:", cartItemId, error?.response?.status);
    return false;
  }
}

export async function clearCart(cartId: number): Promise<boolean> {
  try {
    const cart = await getCart(cartId);
    if (!cart?.cartItems?.length) return true;

    const token = await getUserToken();
    if (!token) return false;

    const itemIds = cart.cartItems
      .map((item) => item.cartItemId)
      .filter((id): id is number => !!id);

    let allSuccess = true;
    for (const id of itemIds) {
      try {
        await axios.delete(
          `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/cart-items/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err: any) {
        console.error(`[cartService] Failed to delete item ${id}:`, err?.response?.status);
        allSuccess = false;
      }
    }
    return allSuccess;
  } catch (error) {
    console.error("[cartService] clearCart failed:", error);
    return false;
  }
}

export async function applyCoupon(cartId: number, couponCode: string): Promise<Cart | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/coupon-code`,
      { couponCode },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
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
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
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
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
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
