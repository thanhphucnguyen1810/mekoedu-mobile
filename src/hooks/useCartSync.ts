/**
 * src/hooks/useCartSync.ts
 */

import { ENV } from "@/src/config/env";
import * as cartService from "@/src/services/liferay";
import { findOrCreateCart } from "@/src/services/liferay";
import {
  addToCart,
  clearCart as localClearCart,
  removeFromCart as localRemoveFromCart,
  updateQuantity as localUpdateQuantity,
  selectCartId,
  selectCartItems,
  setCartError,
  setCartLoading,
  setSyncing,
  syncCartFromServer,
} from "@/src/store/slices/cartSlice";
import { selectIsAuthenticated } from "@/src/store/slices/liferayAuthSlice";
import type { CartItem } from "@/src/types/liferay";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeThumb = (thumb?: string): string => {
  if (!thumb) return "";
  return thumb.startsWith("http") ? thumb : `${ENV.API_URL}${thumb}`;
};

const mapLiferayItems = (items: CartItem[]) =>
  (items ?? []).map((item) => ({
    id: item.id,
    cartItemId: item.cartItemId,
    skuId: item.skuId,
    name: item.name,
    displayName: item.displayName,
    optionsLabel: item.optionsLabel,
    thumbnail: normalizeThumb(item.thumbnail),
    price: item.price,
    promoPrice: item.promoPrice,
    catalogName: item.catalogName,
    quantity: item.quantity,
  }));

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCartSync = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated) as boolean;
  const cartIdFromRedux = useSelector(selectCartId) as number | null;
  const cartItems = useSelector(selectCartItems);

  // ── 0. RESOLVE CART ID ────────────────────────────────────────────────────
  const resolveCartId = useCallback(async (): Promise<number | null> => {
    return findOrCreateCart();
  }, []);

  // ── 1. LOAD ────────────────────────────────────────────────────────────────
  const loadCartFromServer = useCallback(async () => {
    if (!isAuthenticated) return;

    dispatch(setCartLoading(true));
    try {
      const cartId = await resolveCartId();
      if (!cartId) {
        dispatch(
          syncCartFromServer({
            cartId: null as any,
            items: [],
            selectedIds: [],
            coupon: null,
            summary: null,
          })
        );
        return;
      }

      const cart = await cartService.getCart(cartId);
      if (!cart) return;

      const mapped = mapLiferayItems(cart.cartItems ?? []);
      dispatch(
        syncCartFromServer({
          cartId: cart.id,
          items: mapped,
          selectedIds: mapped.map((i) => i.id),
          coupon: null,
          summary: cart.summary ?? null,
        })
      );
    } catch (err) {
      console.error("[useCartSync] loadCartFromServer:", err);
      dispatch(setCartError("Không thể tải giỏ hàng"));
    } finally {
      dispatch(setCartLoading(false));
    }
  }, [dispatch, isAuthenticated, resolveCartId]);

  // ── 2. THÊM SẢN PHẨM ──────────────────────────────────────────────────────
  const addToCartAsync = useCallback(
    async (params: {
      productId: number;
      skuId: number;
      quantity?: number;
      name: string;
      displayName?: string;
      optionsLabel?: string;
      price: number;
      promoPrice?: number;
      thumbnail?: string;
      catalogName?: string;
    }): Promise<number | null> => {
      if (!isAuthenticated) {
        console.warn("[useCartSync] addToCartAsync: chưa đăng nhập.");
        return null;
      }
      if (!params.skuId || params.skuId === 0) {
        console.error("[useCartSync] addToCartAsync: skuId = 0, bỏ qua.");
        return null;
      }

      dispatch(setSyncing(true));
      try {
        const cartId = await findOrCreateCart();
        if (!cartId) {
          console.error("[useCartSync] addToCartAsync: không tạo được cartId");
          return null;
        }

        const cartItemId = await cartService.addItem(
          cartId,
          params.skuId,
          params.quantity ?? 1
        );

        if (cartItemId) {
          // Build displayName nhất quán với cartService.toCartItem
          const optionsLabel = params.optionsLabel || '';
          const displayName = params.displayName
            || (optionsLabel ? `${params.name} (${optionsLabel})` : params.name);

          dispatch(
            addToCart({
              id: params.productId,
              cartItemId,
              skuId: params.skuId,
              quantity: params.quantity ?? 1,
              name: params.name,
              displayName,
              optionsLabel,
              price: params.price,
              promoPrice: params.promoPrice,
              thumbnail: params.thumbnail || "",
              catalogName: params.catalogName || "",
            })
          );
          // Sync để lấy displayName, optionsLabel, summary chính xác từ server
          await loadCartFromServer();
        }
        return cartItemId;
      } catch (err) {
        console.error("[useCartSync] addToCartAsync:", err);
        return null;
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [isAuthenticated, dispatch, loadCartFromServer]
  );

  // ── 3. UPDATE QUANTITY ────────────────────────────────────────────────────
  /**
   * Cập nhật số lượng.
   *
   * Dùng cartItemId (không phải productId) để dispatch optimistic update,
   * vì một sản phẩm có thể có nhiều SKU/biến thể khác nhau trong giỏ.
   * Redux slice cần hỗ trợ action update theo cartItemId — nếu slice hiện tại
   * chỉ dùng productId (id), loadCartFromServer() sau PATCH sẽ tự đồng bộ lại.
   *
   * @returns true nếu thành công, false nếu thất bại
   */
  const updateQuantityAsync = useCallback(
    async (
      productId: string | number,
      cartItemId: number,
      newQty: number
    ): Promise<boolean> => {
      dispatch(setSyncing(true));

      // Optimistic update — dispatch theo cartItemId nếu slice hỗ trợ,
      // fallback về productId để tương thích với slice cũ
      dispatch(localUpdateQuantity({ id: cartItemId, quantity: newQty }));

      try {
        const ok = await cartService.updateQuantity(cartItemId, newQty);
        // Luôn sync lại từ server để đảm bảo displayName/optionsLabel/summary đúng
        await loadCartFromServer();
        return ok;
      } catch (err) {
        console.error("[useCartSync] updateQuantityAsync:", err);
        // Rollback bằng cách reload từ server
        await loadCartFromServer();
        return false;
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [dispatch, loadCartFromServer]
  );

  // ── 4. XOÁ 1 SẢN PHẨM ────────────────────────────────────────────────────
  /**
   * @returns true nếu thành công, false nếu thất bại
   */
  const removeItemAsync = useCallback(
    async (
      productId: string | number,
      cartItemId: number
    ): Promise<boolean> => {
      if (!cartItemId) {
        console.error("[useCartSync] removeItemAsync: cartItemId required");
        return false;
      }
      dispatch(setSyncing(true));
      // Optimistic: xóa khỏi UI ngay theo cartItemId
      dispatch(localRemoveFromCart(cartItemId));
      try {
        const ok = await cartService.removeItem(cartItemId);
        await loadCartFromServer();
        return ok;
      } catch (err) {
        console.error("[useCartSync] removeItemAsync:", err);
        await loadCartFromServer();
        return false;
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [dispatch, loadCartFromServer]
  );

  // ── 5. XOÁ TOÀN BỘ ───────────────────────────────────────────────────────
  /**
   * @returns true nếu thành công
   */
  const clearCartAsync = useCallback(async (): Promise<boolean> => {
    const cartId = await resolveCartId();
    if (!cartId) return false;

    dispatch(setSyncing(true));
    try {
      const ok = await cartService.clearCart(cartId);
      if (ok) {
        dispatch(localClearCart());
        await loadCartFromServer();
        return true;
      }
      await loadCartFromServer();
      return false;
    } catch (err) {
      console.error("[useCartSync] clearCartAsync:", err);
      await loadCartFromServer();
      return false;
    } finally {
      dispatch(setSyncing(false));
    }
  }, [dispatch, resolveCartId, loadCartFromServer]);

  // ── 6. COUPON ─────────────────────────────────────────────────────────────
  const applyCouponAsync = useCallback(
    async (code: string): Promise<boolean> => {
      const cartId = await resolveCartId();
      if (!cartId) return false;
      dispatch(setSyncing(true));
      try {
        const updatedCart = await cartService.applyCoupon(cartId, code);
        if (!updatedCart) return false;
        await loadCartFromServer();
        return true;
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [dispatch, resolveCartId, loadCartFromServer]
  );

  const removeCouponAsync = useCallback(async (): Promise<boolean> => {
    const cartId = await resolveCartId();
    if (!cartId) return false;
    dispatch(setSyncing(true));
    try {
      const updatedCart = await cartService.removeCoupon(cartId);
      if (!updatedCart) return false;
      await loadCartFromServer();
      return true;
    } finally {
      dispatch(setSyncing(false));
    }
  }, [dispatch, resolveCartId, loadCartFromServer]);

  // ── 7. CHECKOUT ───────────────────────────────────────────────────────────
  const checkoutAsync = useCallback(async (): Promise<{
    orderId: number;
    finalTotal: number;
  } | null> => {
    const cartId = await resolveCartId();
    if (!cartId) return null;

    dispatch(setSyncing(true));
    try {
      const result = await cartService.checkout(cartId);
      if (!result) return null;
      dispatch(localClearCart());
      return {
        orderId: result.orderId,
        finalTotal: result.summary?.total ?? 0,
      };
    } catch (err) {
      console.error("[useCartSync] checkoutAsync:", err);
      return null;
    } finally {
      dispatch(setSyncing(false));
    }
  }, [dispatch, resolveCartId]);

  // ── 8. REFRESH ────────────────────────────────────────────────────────────
  const refreshCart = useCallback(
    () => loadCartFromServer(),
    [loadCartFromServer]
  );

  return {
    loadCartFromServer,
    refreshCart,
    addToCartAsync,
    updateQuantityAsync,
    removeItemAsync,
    clearCartAsync,
    applyCouponAsync,
    removeCouponAsync,
    checkoutAsync,
    cartIdFromRedux,
    cartItems,
  };
};
