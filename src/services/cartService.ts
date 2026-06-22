/**
 * src/services/liferay/cartService.ts
 *
 * FIX:
 * - toAbsoluteUrl: ghép BASE_URL vào relative thumbnail URL của Liferay
 * - toCartItem: log raw item để debug field name, lấy name từ nhiều nguồn
 * - getCart: sau khi map items, thêm enrichment từ product API nếu name trống
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
    raw.name ||
    raw.productName ||
    raw.skuName ||
    raw.sku?.name ||
    raw.product?.name ||
    raw.nameCurrentValue ||
    raw.title ||
    "";

  // ✅ Thumbnail: convert relative → absolute
  const rawThumb =
    raw.thumbnail ||
    raw.imageUrl ||
    raw.image ||
    raw.sku?.imageUrl ||
    raw.product?.imageUrl ||
    raw.sku?.image ||
    raw.product?.image ||
    "";
  const thumbnail = toAbsoluteUrl(rawThumb);

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

async function getSavedCartId(): Promise<number | null> {
  const val = await AsyncStorage.getItem(CART_STORAGE_KEY);
  return val ? parseInt(val, 10) : null;
}

async function saveCartId(id: number): Promise<void> {
  await AsyncStorage.setItem(CART_STORAGE_KEY, String(id));
}

// ─── Singleton ────────────────────────────────────────────────────────────────
let _cachedCartId: number | null = null;
let _resolvePromise: Promise<number | null> | null = null;

export function clearCartCache(): void {
  _cachedCartId = null;
  _resolvePromise = null;
  AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
  console.log("[cartService] 🧹 Cleared cart cache + storage");
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
    const itemsNeedingName = cartItems.filter((i) => !i.name && i.id);
    if (itemsNeedingName.length > 0) {
      console.log("[cartService] Fetching product names for", itemsNeedingName.length, "items...");
      await Promise.allSettled(
        itemsNeedingName.map(async (item) => {
          try {
            const res = await axios.get(
              `${BASE_URL}/o/headless-commerce-delivery-catalog/v1.0/products/${item.id}`,
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

export async function findOrCreateCart(): Promise<number | null> {
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

  const accountId = await ensureUserAccount();
  if (!accountId) {
    console.error("[cartService] ❌ Không có accountId");
    return null;
  }

  console.log(`[cartService] 🛒 Tạo cart mới: accountId=${accountId}`);
  try {
    const cartRes = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/channels/${CHANNEL_ID}/carts`,
      { currencyCode: "VND", accountId, channelId: parseInt(CHANNEL_ID, 10) },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    const newCartId = cartRes.data?.id;
    if (!newCartId) throw new Error("Cart response missing id");
    await sleep(500);
    await saveCartId(newCartId);
    console.log(`[cartService] ✅ Cart mới: ${newCartId}`);
    return newCartId;
  } catch (error: any) {
    console.error("[cartService] ❌ Tạo cart thất bại:", error?.response?.status, error?.response?.data);
    return null;
  }
}

export async function addItem(
  cartId: number,
  skuId: number,
  quantity = 1,
  _retry = false
): Promise<number | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;
    const res = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`,
      { skuId, quantity },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return res.data?.id ?? null;
  } catch (error: any) {
    const status = error?.response?.status;
    console.error(`[cartService] addItem failed (${status}): cartId=${cartId}, skuId=${skuId}`);
    if (!_retry && (status === 404 || status === 403)) {
      console.log("[cartService] Cart invalid → tạo cart mới và thử lại");
      _cachedCartId = null;
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      const newCartId = await findOrCreateCart();
      if (newCartId) return addItem(newCartId, skuId, quantity, true);
    }
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
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    clearCartCache();
    return {
      orderId: res.data?.id ?? res.data?.orderId ?? cartId,
      summary: toCartSummary(res.data?.summary),
    };
  } catch (error) {
    console.error("[cartService] checkout failed:", error);
    return null;
  }
}
