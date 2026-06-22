/**
 * src/hooks/useCartSync.ts
 *
 * FIX:
 * - resolveCartId luôn dùng findOrCreateCart() (có singleton mutex bên trong)
 *   thay vì dùng Redux cartId làm fast path — Redux cartId có thể stale
 *   khi nhiều component mount cùng lúc đều thấy null và đều gọi findOrCreateCart
 * - Không cần mutex riêng ở đây vì cartService đã xử lý
 */

import * as cartService from '@/src/services/cartService';
import { findOrCreateCart } from '@/src/services/liferay';
import {
  addToCart,
  clearCart as localClearCart,
  removeFromCart as localRemoveFromCart,
  updateQuantity as localUpdateQuantity,
  selectCartId,
  setCartError,
  setCartLoading,
  setSyncing,
  syncCartFromServer,
} from '@/src/store/slices/cartSlice';
import {
  selectIsAuthenticated,
} from '@/src/store/slices/liferayAuthSlice';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CartItem } from '../types/liferay';

const mapLiferayItems = (items: CartItem[]) =>
  (items ?? []).map((item) => ({
    id:          item.id,
    cartItemId:  item.cartItemId,
    skuId:       item.skuId,
    name:        item.name,
    thumbnail:   item.thumbnail,
    price:       item.price,
    promoPrice:  item.promoPrice,
    catalogName: item.catalogName,
    quantity:    item.quantity,
  }));

export const useCartSync = () => {
  const dispatch        = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated) as boolean;
  // Vẫn đọc cartId từ Redux để dùng trong useEffect dependency
  const cartIdFromRedux = useSelector(selectCartId) as number | null;

  /**
   * ✅ Luôn dùng findOrCreateCart() — nó có singleton mutex bên trong.
   * Nếu Redux đã có cartId hợp lệ thì đó là fast path trong cartService
   * (_cachedCartId), không tốn thêm network call.
   */
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
        console.warn('[useCartSync] loadCartFromServer: không tạo được cartId');
        dispatch(
          syncCartFromServer({ cartId: null as any, items: [], selectedIds: [], coupon: null, summary: null })
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
      console.error('[useCartSync] loadCartFromServer:', err);
      dispatch(setCartError('Không thể tải giỏ hàng'));
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
      price: number;
      promoPrice?: number;
      thumbnail?: string;
      catalogName?: string;
    }): Promise<number | null> => {
      if (!isAuthenticated) {
        console.warn('[useCartSync] addToCartAsync: chưa đăng nhập.');
        return null;
      }
      if (!params.skuId || params.skuId === 0) {
        console.error('[useCartSync] addToCartAsync: skuId = 0, bỏ qua.');
        return null;
      }

      dispatch(setSyncing(true));
      try {
        const cartId = await findOrCreateCart();
        if (!cartId) {
          console.error('[useCartSync] addToCartAsync: không tạo được cartId');
          return null;
        }

        const cartItemId = await cartService.addItem(cartId, params.skuId, params.quantity ?? 1);
        if (cartItemId) {
          dispatch(addToCart({
            id: params.productId,
            cartItemId,
            skuId: params.skuId,
            quantity: params.quantity ?? 1,
            name: params.name,
            price: params.price,
            promoPrice: params.promoPrice,
            thumbnail: params.thumbnail || '',
            catalogName: params.catalogName || '',
          }));
          await loadCartFromServer();
        }
        return cartItemId;
      } catch (err) {
        console.error('[useCartSync] addToCartAsync:', err);
        return null;
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [isAuthenticated, dispatch, resolveCartId, loadCartFromServer]
  );

  // ── 3. UPDATE QUANTITY ────────────────────────────────────────────────────
  const updateQuantityAsync = useCallback(
    async (productId: string | number, cartItemId: number, newQty: number) => {
      dispatch(setSyncing(true));
      try {
        dispatch(localUpdateQuantity({ id: productId, quantity: newQty }));
        await cartService.updateQuantity(cartItemId, newQty);
        await loadCartFromServer();
      } catch (err) {
        console.error('[useCartSync] updateQuantityAsync:', err);
        await loadCartFromServer();
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [dispatch, loadCartFromServer]
  );

  // ── 4. XOÁ 1 SẢN PHẨM ────────────────────────────────────────────────────
  const removeItemAsync = useCallback(
    async (productId: string | number, cartItemId: number) => {
      if (!cartItemId) {
        console.error('[useCartSync] removeItemAsync: cartItemId is required');
        return;
      }
      dispatch(setSyncing(true));
      try {
        dispatch(localRemoveFromCart(productId));
        await cartService.removeItem(cartItemId);
        await loadCartFromServer();
      } catch (err) {
        console.error('[useCartSync] removeItemAsync:', err);
        await loadCartFromServer();
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [dispatch, loadCartFromServer]
  );

  // ── 5. XOÁ TOÀN BỘ ───────────────────────────────────────────────────────
  const clearCartAsync = useCallback(async (): Promise<boolean> => {
    const cartId = await resolveCartId();
    if (!cartId) {
      console.warn('[useCartSync] clearCartAsync: no cartId');
      return false;
    }

    dispatch(setSyncing(true));
    try {
      const ok = await cartService.clearCart(cartId);
      if (ok) {
        dispatch(localClearCart());
        await loadCartFromServer();
        return true;
      } else {
        await loadCartFromServer();
        return false;
      }
    } catch (err) {
      console.error('[useCartSync] clearCartAsync error:', err);
      await loadCartFromServer();
      return false;
    } finally {
      dispatch(setSyncing(false));
    }
  }, [dispatch, resolveCartId, loadCartFromServer]);

  // ── 6. COUPON ─────────────────────────────────────────────────────────────
  const applyCouponAsync = useCallback(async (code: string): Promise<boolean> => {
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
  }, [dispatch, resolveCartId, loadCartFromServer]);

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
    if (!cartId) {
      console.warn('[useCartSync] checkoutAsync: không có cartId');
      return null;
    }
    dispatch(setSyncing(true));
    try {
      const result = await cartService.checkout(cartId);
      if (!result) return null;
      // cartService.checkout() đã gọi clearCartCache() bên trong
      dispatch(localClearCart());
      return {
        orderId: result.orderId,
        finalTotal: result.summary?.total ?? 0,
      };
    } catch (err) {
      console.error('[useCartSync] checkoutAsync:', err);
      return null;
    } finally {
      dispatch(setSyncing(false));
    }
  }, [dispatch, resolveCartId]);

  // ── 8. REFRESH ────────────────────────────────────────────────────────────
  const refreshCart = useCallback(() => loadCartFromServer(), [loadCartFromServer]);

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
  };
};
