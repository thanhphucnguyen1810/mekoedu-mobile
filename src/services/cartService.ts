import Constants from "expo-constants";
import { AxiosError } from "axios";
import { liferayClient } from "./api";
import { getUserToken } from "./liferayService";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
const BASE_URL = extra.LIFERAY_BASE_URL ?? "http://192.168.2.152:8080";

// Relative URL → absolute URL (Liferay trả thumbnail dạng /o/commerce-media/...)
const toAbsUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiferayCartItem {
  id: number;
  productId: number;
  skuId: number;
  quantity: number;
  name: string;
  price: number;
  promoPrice?: number;
  thumbnail?: string;
  catalogName?: string;
}

export interface LiferayCart {
  id: number;
  accountId: number;
  channelId: number;
  cartItems: LiferayCartItem[];
  total: number;
  subtotal: number;
  discountTotal?: number;
}

// ─── CartService ──────────────────────────────────────────────────────────────

class CartService {

  private async getAuthHeaders() {
    const token = await getUserToken();
    if (!token) throw new Error("No access token found");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // ── 1. GET CART BY ID ────────────────────────────────────────────────────────
  /**
   * GET /carts/{id} không trả cartItems → phải gọi thêm GET /carts/{id}/items
   * Thumbnail Liferay trả dạng relative "/o/commerce-media/..." → cần prefix BASE_URL
   */
  async getCart(cartId: number): Promise<LiferayCart | null> {
    try {
      const headers = await this.getAuthHeaders();

      const [cartRes, itemsRes] = await Promise.all([
        liferayClient.get<LiferayCart>(`/carts/${cartId}`, { headers }),
        liferayClient.get<{ items: any[] }>(
          `/carts/${cartId}/items`,
          { headers, params: { pageSize: 100 } }
        ),
      ]);

      const rawItems: any[] = itemsRes.data?.items ?? [];

      const cartItems: LiferayCartItem[] = rawItems.map((item: any) => {
        // Price: object { price, promoPrice } hoặc number
        const priceObj  = typeof item.price === 'object' ? item.price : null;
        const price     = priceObj
          ? (priceObj.price ?? priceObj.finalPrice ?? priceObj.unitPrice ?? 0)
          : (item.price ?? 0);
        const promoPrice = priceObj
          ? (priceObj.promoPrice ?? priceObj.discountedPrice ?? undefined)
          : undefined;

        return {
          id:          item.id,
          productId:   item.productId ?? item.product?.productId ?? item.product?.id ?? 0,
          skuId:       item.skuId ?? item.sku?.id ?? 0,
          quantity:    item.quantity ?? 1,
          name:        item.name ?? '',
          price,
          promoPrice,
          // FIX: prefix BASE_URL vào relative thumbnail URL
          thumbnail:   toAbsUrl(item.thumbnail ?? item.imageUrl ?? item.image ?? ''),
          catalogName: item.catalogName ?? item.product?.catalogName ?? '',
        };
      });

      console.log(`[CartService] getCart OK – cartId=${cartId}, items=${cartItems.length}`);
      return { ...cartRes.data, cartItems };
    } catch (error) {
      this.handleError(error, "getCart");
      return null;
    }
  }

  // ── 2. ADD ITEM TO CART ──────────────────────────────────────────────────────
  async addItem(cartId: number, skuId: number, quantity: number = 1): Promise<number | null> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await liferayClient.post<LiferayCartItem>(
        `/carts/${cartId}/items`,
        { skuId, quantity },
        { headers }
      );
      console.log(`[CartService] addItem OK – cartItemId=${res.data.id}`);
      return res.data.id ?? null;
    } catch (error) {
      this.handleError(error, "addItem");
      return null;
    }
  }

  // ── 3. UPDATE QUANTITY ───────────────────────────────────────────────────────
  async updateQuantity(cartItemId: number, quantity: number): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      await liferayClient.patch(`/cart-items/${cartItemId}`, { quantity }, { headers });
      console.log(`[CartService] updateQuantity OK – cartItemId=${cartItemId}, qty=${quantity}`);
      return true;
    } catch (error) {
      this.handleError(error, "updateQuantity");
      return false;
    }
  }

  // ── 4. REMOVE ITEM ───────────────────────────────────────────────────────────
  async removeItem(cartItemId: number): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      await liferayClient.delete(`/cart-items/${cartItemId}`, { headers });
      console.log(`[CartService] removeItem OK – cartItemId=${cartItemId}`);
      return true;
    } catch (error) {
      this.handleError(error, "removeItem");
      return false;
    }
  }

  // ── 5. CLEAR CART ────────────────────────────────────────────────────────────
  async clearCart(cartId: number): Promise<boolean> {
    try {
      const cart = await this.getCart(cartId);
      if (!cart || !cart.cartItems?.length) return true;
      await Promise.all(cart.cartItems.map((item) => this.removeItem(item.id)));
      console.log(`[CartService] clearCart OK – removed ${cart.cartItems.length} items`);
      return true;
    } catch (error) {
      this.handleError(error, "clearCart");
      return false;
    }
  }

  // ── 6. APPLY COUPON ──────────────────────────────────────────────────────────
  async applyCoupon(cartId: number, couponCode: string): Promise<LiferayCart | null> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await liferayClient.post<LiferayCart>(
        `/carts/${cartId}/coupon-code/${couponCode}`, {}, { headers }
      );
      return res.data;
    } catch (error) {
      this.handleError(error, "applyCoupon");
      return null;
    }
  }

  // ── 7. REMOVE COUPON ─────────────────────────────────────────────────────────
  async removeCoupon(cartId: number): Promise<LiferayCart | null> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await liferayClient.delete<LiferayCart>(
        `/carts/${cartId}/coupon-code`, { headers }
      );
      return res.data;
    } catch (error) {
      this.handleError(error, "removeCoupon");
      return null;
    }
  }

  // ── ERROR HANDLER ────────────────────────────────────────────────────────────
  private handleError(error: unknown, method: string): void {
    if (error instanceof AxiosError) {
      console.error(`[CartService] ${method} failed:`, {
        status:  error.response?.status,
        message: error.response?.data?.message ?? error.message,
        url:     error.config?.url,
      });
    } else {
      console.error(`[CartService] ${method} failed:`, error);
    }
  }
}

export const cartService = new CartService();
