/**
 * src/services/liferay/cartService.ts
 */

import { ENV } from "@/src/config/env";
import { TOKEN_KEYS } from "@/src/config/tokenKeys";
import type { Cart, CartItem, CartSummary, CatalogProduct } from "@/src/types/liferay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getUserToken } from "./authService";
import { getProduct } from "./catalogService";
import { ensureUserAccount } from "./userService";

const CART_STORAGE_KEY = TOKEN_KEYS.CART_ID ?? "cart_id";
const BASE_URL = ENV.API_URL;
const CHANNEL_ID = ENV.CHANNEL_ID;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── URL helper ───────────────────────────────────────────────────────────────
function toAbsoluteUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse optionsLabel từ nhiều field khác nhau mà Liferay có thể trả về.
 *
 * Liferay cart-item response có thể chứa options dưới 2 dạng:
 *   1. raw.options: JSON string của array [{skuOptionValueNames: [...], ...}]
 *   2. raw.skuOptions: array object trực tiếp (giống SKU object trong catalog)
 *
 * Cả hai đều được xử lý ở đây để đảm bảo optionsLabel không bao giờ bị mất
 * sau khi getCart refresh lại từ server.
 */
function parseOptionsLabel(raw: any): string {
  // ── Ưu tiên 1: skuOptions array trực tiếp (từ catalog SKU / addItem response) ──
  if (Array.isArray(raw.skuOptions) && raw.skuOptions.length > 0) {
    const label = raw.skuOptions
      .map((opt: any) => opt?.skuOptionValueNames?.[0] || opt?.skuOptionValueKey || '')
      .filter(Boolean)
      .join(' - ');
    if (label) return label;
  }

  // ── Ưu tiên 2: options là JSON string (Liferay cart-item delivery API) ──
  if (raw.options) {
    try {
      const arr =
        typeof raw.options === 'string' ? JSON.parse(raw.options) : raw.options;
      if (Array.isArray(arr) && arr.length > 0) {
        // Format 1: [{skuOptionValueNames: ["Xanh đen"], ...}]
        const fromNames = arr
          .map((o: any) => o?.skuOptionValueNames?.[0] || '')
          .filter(Boolean)
          .join(' - ');
        if (fromNames) return fromNames;

        // Format 2: [{value: "Xanh đen", ...}] (fallback)
        const fromValue = arr
          .map((o: any) => o?.value || o?.name || '')
          .filter(Boolean)
          .join(' - ');
        if (fromValue) return fromValue;
      }
    } catch {
      // options không phải JSON hợp lệ → bỏ qua
    }
  }

  return '';
}

function toCartItem(raw: any): CartItem {
  const firstNonEmpty = (...values: any[]): string | undefined => {
    for (const v of values) {
      if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return undefined;
  };

  const name = firstNonEmpty(raw.name, raw.product?.name, raw.sku?.name) ?? '';
  const optionsLabel = parseOptionsLabel(raw);

  const catalogName =
    firstNonEmpty(raw.catalogName, raw.product?.catalogName, raw.product?.catalog?.name) ?? 'MekoStore';

  const rawThumb = firstNonEmpty(raw.thumbnail, raw.imageUrl) ?? '';
  const thumbnail = rawThumb && !rawThumb.startsWith('http') ? `${BASE_URL}${rawThumb}` : rawThumb;

  const priceObj = typeof raw.price === 'object' && raw.price !== null ? raw.price : null;
  const price = priceObj ? (priceObj.price ?? priceObj.finalPrice ?? 0) : (raw.price ?? 0);
  const promoPrice = priceObj ? (priceObj.promoPrice ?? undefined) : undefined;

  // displayName build sớm từ name + optionsLabel.
  // getCart sẽ overwrite chính xác hơn sau khi fetch product từ catalog.
  // Nếu getProduct fail, item vẫn có displayName dùng được.
  const displayName = optionsLabel ? `${name} (${optionsLabel})` : name;

  return {
    id: raw.productId ?? raw.product?.productId ?? raw.product?.id ?? 0,
    skuId: raw.skuId ?? raw.sku?.id ?? 0,
    cartItemId: raw.id ?? raw.cartItemId ?? 0,
    quantity: raw.quantity ?? 1,
    name,
    displayName,
    optionsLabel,
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

async function saveCartId(accountId: number, id: number): Promise<void> {
  await AsyncStorage.setItem(getCartStorageKey(accountId), String(id));
}

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
  console.log("[cartService] Cleared cart cache + storage");
}

// ─── Kiểm tra cart open ──────────────────────────────────────────────────────

function isCartOpen(cartData: any): boolean {
  const orderStatus = cartData?.orderStatusInfo;
  return orderStatus?.code === 2 || orderStatus?.label?.toLowerCase() === "open";
}

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

const CART_STORAGE_PREFIX = "cart_";

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
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { pageSize: 100 },
        }
      ),
    ]);

    let cartItems: CartItem[] = (itemsRes.data?.items ?? []).map(toCartItem);

    const productIds = [...new Set(cartItems.map(i => i.id).filter(id => id > 0))];

    if (productIds.length > 0) {
      try {
        const products = await Promise.all(productIds.map(id => getProduct(id)));

        const productMap = new Map<number, CatalogProduct>();
        productIds.forEach((requestedId, idx) => {
          const product = products[idx];
          if (product) productMap.set(requestedId, product);
        });

        cartItems = cartItems.map(item => {
          const product = productMap.get(item.id);
          if (!product) return item;

          const matchedSku = (product as any).skus?.find((s: any) => s.id === item.skuId);

          // Nếu optionsLabel đã được parse từ toCartItem thì giữ nguyên.
          // Chỉ fallback sang skuOptions của SKU catalog nếu optionsLabel còn trống.
          const optionsLabel = item.optionsLabel
            || (matchedSku?.skuOptions as any[] | undefined)
              ?.map((opt: any) => opt?.skuOptionValueNames?.[0] || '')
              .filter(Boolean)
              .join(' - ')
            || '';

          const baseName = product.name
            || product.productNames?.['vi_VN']
            || product.productNames?.['en_US']
            || '';

          return {
            ...item,
            name: item.name || baseName,
            displayName: optionsLabel ? `${baseName} (${optionsLabel})` : baseName,
            optionsLabel,
            thumbnail: item.thumbnail
              || (matchedSku?.images?.[0]?.src && toAbsoluteUrl(matchedSku.images[0].src))
              || (product.images?.[0]?.src && toAbsoluteUrl(product.images[0].src))
              || '',
            catalogName: item.catalogName || product.catalogName,
            price: item.price || matchedSku?.price?.price || 0,
            promoPrice: item.promoPrice ?? matchedSku?.price?.promoPrice,
          };
        });
      } catch (error) {
        console.error('[cartService] Error fetching products:', error);
      }
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
 */
export async function findOrCreateCart(): Promise<number | null> {
  if (_cachedCartId) return _cachedCartId;

  if (_resolvePromise) {
    console.log("[cartService]  Chờ resolve...");
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

  const accountId = await ensureUserAccount();
  if (!accountId) {
    console.error("[cartService]  Không có accountId");
    return null;
  }

  const savedId = await getSavedCartId(accountId);
  if (savedId) {
    try {
      const cartData = await fetchCart(savedId, token);
      if (cartData && isCartOpen(cartData)) {
        console.log(`[cartService] Tái sử dụng cart saved: ${savedId} (account ${accountId})`);
        return savedId;
      } else {
        console.log(`[cartService] Cart ${savedId} không còn open, sẽ tạo mới`);
        await AsyncStorage.removeItem(getCartStorageKey(accountId));
      }
    } catch (err) {
      console.warn(`[cartService] Lỗi khi kiểm tra cart saved ${savedId}:`, err);
      await AsyncStorage.removeItem(getCartStorageKey(accountId));
    }
  }

  console.log(`[cartService] Query server tìm cart open cho account ${accountId}...`);
  const url = `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/channels/${CHANNEL_ID}/account/${accountId}/carts`;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: { pageSize: 50 },
    });

    const allCarts: any[] = res.data?.items ?? [];
    const openCarts = allCarts.filter(isCartOpen);

    if (openCarts.length > 0) {
      const sorted = openCarts.sort((a: any, b: any) => {
        const aHasItems = (a.cartItems?.length ?? 0) > 0 ? 1 : 0;
        const bHasItems = (b.cartItems?.length ?? 0) > 0 ? 1 : 0;
        if (bHasItems !== aHasItems) return bHasItems - aHasItems;
        return new Date(b.dateModified ?? b.modifiedDate ?? 0).getTime()
          - new Date(a.dateModified ?? a.modifiedDate ?? 0).getTime();
      });

      const bestCart = sorted[0];
      const existingCartId: number = bestCart.id;
      console.log(`[cartService] Dùng cart từ server: ${existingCartId}`);
      await saveCartId(accountId, existingCartId);
      return existingCartId;
    }

    console.log(`[cartService] Không có cart open trên server → tạo mới`);
  } catch (err: any) {
    console.warn("[cartService] Query server cart thất bại:", {
      status: err.response?.status,
      data: err.response?.data,
    });
  }

  console.log(`[cartService] Tạo cart mới cho account ${accountId}`);
  try {
    const cartRes = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/channels/${CHANNEL_ID}/carts`,
      { currencyCode: "VND", accountId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const newCartId = cartRes.data?.id;
    if (!newCartId) throw new Error("Cart response missing id");

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
      console.log(`[cartService] Cart ${cartId} ready after ${attempt + 1} attempt(s)`);
      return true;
    } catch (err: any) {
      if (err.response?.status === 404 && attempt < maxRetries - 1) {
        const delay = baseDelay * (attempt + 1);
        console.log(`[cartService] Cart ${cartId} not ready, retry in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  return false;
}

// ─── Các hàm thao tác giỏ hàng ───────────────────────────────────────────────

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

    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    clearCartCache();
    console.log(`[cartService] Checkout OK, cleared cart cache`);

    return {
      orderId: res.data?.id ?? res.data?.orderId ?? cartId,
      summary: toCartSummary(res.data?.summary),
    };
  } catch (error) {
    console.error("[cartService] checkout failed:", error);
    return null;
  }
}
