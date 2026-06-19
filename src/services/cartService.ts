/**
 * src/services/liferay/cartService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Quản lý giỏ hàng Liferay Commerce (Delivery Cart API).
 * - Tìm hoặc tạo cart tự động (findOrCreateCart)
 * - CRUD cart items
 * - Áp dụng / gỡ coupon
 *
 * Dùng `http` (httpClient) — token auto-attach, auto-refresh.
 * Cart ID được persist vào AsyncStorage qua TOKEN_KEYS.CART_ID.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "@/src/config/env";
import { http } from "@/src/config/httpClient";
import { TOKEN_KEYS } from "@/src/config/tokenKeys";
import type { Cart, CartItem } from "@/src/types/liferay";
import { toAbsoluteUrl } from "@/src/utils/url";
import { ensureUserAccount } from "./userService";

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Đọc raw item từ Liferay → CartItem chuẩn hoá */
function toCartItem(raw: any): CartItem {
  console.log('RAW CART ITEM:', JSON.stringify(raw, null, 2));
  const priceObj = typeof raw.price === "object" && raw.price !== null ? raw.price : null;
  const price = priceObj
    ? (priceObj.price ?? priceObj.finalPrice ?? priceObj.unitPrice ?? 0)
    : (raw.price ?? 0);
  const promoPrice = priceObj
    ? (priceObj.promoPrice ?? priceObj.discountedPrice ?? undefined)
    : undefined;

  // Lấy name từ nhiều nguồn
  const name = raw.name
    ?? raw.sku?.name
    ?? raw.product?.name
    ?? raw.skuName
    ?? raw.productName
    ?? "";

  const thumbnail = raw.thumbnail
    ?? raw.imageUrl
    ?? raw.image
    ?? raw.sku?.imageUrl
    ?? raw.product?.imageUrl
    ?? raw.sku?.image
    ?? raw.product?.image
    ?? "";

  const catalogName = raw.catalogName
    ?? raw.product?.catalogName
    ?? raw.sku?.catalogName
    ?? "";

  return {
    id: raw.id,
    productId: raw.productId ?? raw.product?.productId ?? raw.product?.id ?? 0,
    skuId: raw.skuId ?? raw.sku?.id ?? 0,
    quantity: raw.quantity ?? 1,
    name,
    price,
    promoPrice,
    thumbnail: toAbsoluteUrl(thumbnail),
    catalogName,
  };
}

async function getSavedCartId(): Promise<number | null> {
  const val = await AsyncStorage.getItem(TOKEN_KEYS.CART_ID);
  return val ? parseInt(val, 10) : null;
}

async function saveCartId(id: number): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEYS.CART_ID, String(id));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Lấy cart theo ID, bao gồm danh sách items */
export async function getCart(cartId: number): Promise<Cart | null> {
  try {
    const [cartRes, itemsRes] = await Promise.all([
      http.get<Cart>(`/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}`),
      http.get<{ items: any[] }>(
        `/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`,
        { params: { pageSize: 100 } }
      ),
    ]);

    const cartItems = (itemsRes.data?.items ?? []).map(toCartItem);
    return { ...cartRes.data, cartItems };
  } catch (error) {
    console.error("[cartService] getCart failed:", error);
    return null;
  }
}

/**
 * Tìm cart đã lưu trong storage, hoặc tạo mới nếu chưa có / không hợp lệ.
 * Tự động đảm bảo user có Liferay Account trước khi tạo cart.
 */
export async function findOrCreateCart(): Promise<number | null> {
  
  // 0. Lấy accountId của User đang đăng nhập hiện tại
  const accountId = await ensureUserAccount();
  if (!accountId) {
    console.error("[cartService] No accountId, cannot create/verify cart");
    return null;
  }
  
  // 1. Thử dùng cart đã lưu
  const savedId = await getSavedCartId();
  if (savedId) {
    try {
      const res = await http.get(
        `/o/headless-commerce-delivery-cart/v1.0/carts/${savedId}`
      );
      
      // Xác thực Id giỏ hàng và so khớp accountId
      const cartAccountId = res.data?.accountId;
      if (res.data?.id && cartAccountId === accountId) {
        return savedId;
      } else {
        console.warn("[cartService] Cart owner mismatched or invalid, clearing local storage");
        await AsyncStorage.removeItem(TOKEN_KEYS.CART_ID);
      }
      if (res.data?.id) return savedId;
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEYS.CART_ID);
    }
  }

  try {
    const res = await http.get(
      "/o/headless-commerce-delivery-cart/v1.0/carts",
      {
        params: {
          filter: `accountId eq ${accountId}`
        }
      }
    );

    const existingCart = res.data?.items?.find(
      (c: any) => c.orderStatusInfo?.label === "Open"
    );

    if (existingCart?.id) {
      await saveCartId(existingCart.id);
      return existingCart.id;
    }
  } catch (e) {
    console.warn("Cannot find existing cart", e);
  }

  // 3. Tạo cart mới cho accountId nếu các bước trên không oke
  try {
    const res = await http.post(
      `/o/headless-commerce-delivery-cart/v1.0/channels/${ENV.CHANNEL_ID}/carts`,
      { currencyCode: "VND", accountId, channelId: parseInt(ENV.CHANNEL_ID, 10) }
    );
    const newId: number = res.data?.id;
    if (!newId) throw new Error("Cart response missing id");
    await saveCartId(newId);
    return newId;
  } catch (error) {
    console.error("[cartService] findOrCreateCart failed:", error);
    return null;
  }
}

/** Thêm sản phẩm vào cart. Trả về cartItemId hoặc null nếu lỗi. */
export async function addItem(
  cartId: number,
  skuId: number,
  quantity = 1
): Promise<number | null> {
  try {
    const res = await http.post<CartItem>(
      `/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`,
      { skuId, quantity }
    );
    return res.data.id ?? null;
  } catch (error) {
    console.error("[cartService] addItem failed:", error);
    return null;
  }
}

/** Cập nhật số lượng của 1 cart item */
export async function updateQuantity(cartItemId: number, quantity: number): Promise<boolean> {
  try {
    await http.patch(
      `/o/headless-commerce-delivery-cart/v1.0/cart-items/${cartItemId}`,
      { quantity }
    );
    return true;
  } catch (error) {
    console.error("[cartService] updateQuantity failed:", error);
    return false;
  }
}

/** Xoá 1 cart item */
export async function removeItem(cartItemId: number): Promise<boolean> {
  try {
    await http.delete(
      `/o/headless-commerce-delivery-cart/v1.0/cart-items/${cartItemId}`
    );
    return true;
  } catch (error) {
    console.error("[cartService] removeItem failed:", error);
    return false;
  }
}

/** Xoá toàn bộ items trong cart */
export async function clearCart(cartId: number): Promise<boolean> {
  try {
    const cart = await getCart(cartId);
    if (!cart?.cartItems?.length) return true;
    await Promise.all(cart.cartItems.map((item) => removeItem(item.id)));
    return true;
  } catch (error) {
    console.error("[cartService] clearCart failed:", error);
    return false;
  }
}

/** Áp dụng coupon code */
export async function applyCoupon(cartId: number, couponCode: string): Promise<Cart | null> {
  try {
    const res = await http.post<Cart>(
      `/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/coupon-code/${couponCode}`,
      {}
    );
    return res.data;
  } catch (error) {
    console.error("[cartService] applyCoupon failed:", error);
    return null;
  }
}

/** Gỡ coupon code */
export async function removeCoupon(cartId: number): Promise<Cart | null> {
  try {
    const res = await http.delete<Cart>(
      `/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/coupon-code`
    );
    return res.data;
  } catch (error) {
    console.error("[cartService] removeCoupon failed:", error);
    return null;
  }
}
