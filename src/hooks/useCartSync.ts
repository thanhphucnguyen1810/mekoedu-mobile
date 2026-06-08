import { cartService, LiferayCartItem } from '@/src/services/cartService';
import { findOrCreateCart } from '@/src/services/liferayService';
import {
  removeFromCart as localRemoveFromCart,
  updateQuantity as localUpdateQuantity,
  selectCartId,
  setCartError,
  setCartLoading,
  setSyncing,
  syncCartFromServer,
} from '@/src/store/slices/cartSlice';
import {
  selectAccountId,
  selectIsAuthenticated,
} from '@/src/store/slices/liferayAuthSlice';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// ─── Map Liferay items → Redux CartItem shape ─────────────────────────────────

const mapLiferayItems = (items: LiferayCartItem[]) =>
  (items ?? []).map((item) => ({
    id:          item.productId,
    cartItemId:  item.id,
    skuId:       item.skuId,
    name:        item.name,
    thumbnail:   item.thumbnail,
    price:       item.price,
    promoPrice:  item.promoPrice,
    catalogName: item.catalogName,
    quantity:    item.quantity,
  }));

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCartSync = () => {
  const dispatch        = useDispatch();
  const accountId       = useSelector(selectAccountId) as number | null;
  const isAuthenticated = useSelector(selectIsAuthenticated) as boolean;
  const cartIdFromRedux = useSelector(selectCartId) as number | string | null;

  // ── Helper: resolve cartId – ONLY trả về number hợp lệ hoặc null ────────────
  const resolveCartId = useCallback(async (): Promise<number | null> => {
    // Nếu Redux đã có cartId dạng số → dùng luôn
    if (cartIdFromRedux && typeof cartIdFromRedux === 'number') {
      return cartIdFromRedux;
    }
    // Gọi findOrCreateCart – hàm này tự lo lưu AsyncStorage + trả number
    const id = await findOrCreateCart();
    return id; // number | null, không bao giờ là "current"
  }, [cartIdFromRedux]);

  // ── 1. LOAD giỏ hàng từ server ────────────────────────────────────────────
  const loadCartFromServer = useCallback(async () => {
    if (!isAuthenticated) return;

    dispatch(setCartLoading(true));
    try {
      const cartId = await resolveCartId();
      if (!cartId) {
        console.warn('[useCartSync] loadCartFromServer: không tạo được cartId, giỏ rỗng');
        dispatch(
          syncCartFromServer({ cartId: null as any, items: [], selectedIds: [], coupon: null })
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

      // Validate skuId – nếu = 0 thì không gọi API vì sẽ lỗi 400
      if (!params.skuId || params.skuId === 0) {
        console.error('[useCartSync] addToCartAsync: skuId = 0, bỏ qua. Kiểm tra lại CourseCard.');
        return null;
      }

      dispatch(setSyncing(true));
      try {
        const cartId = await resolveCartId();
        if (!cartId) {
          console.error('[useCartSync] addToCartAsync: không tạo được cartId');
          return null;
        }

        console.log(`📡 [useCartSync] addItem – cartId=${cartId}, skuId=${params.skuId}`);

        const cartItemId = await cartService.addItem(cartId, params.skuId, params.quantity ?? 1);
        console.log(`📥 [useCartSync] addItem trả về cartItemId=${cartItemId}`);

        if (cartItemId) {
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

  // ── 3. CẬP NHẬT SỐ LƯỢNG ─────────────────────────────────────────────────
  const updateQuantityAsync = useCallback(
    async (productId: string | number, cartItemId: number, newQty: number) => {
      dispatch(setSyncing(true));
      try {
        dispatch(localUpdateQuantity({ id: productId, quantity: newQty }));
        const ok = await cartService.updateQuantity(cartItemId, newQty);
        if (!ok) await loadCartFromServer();
      } catch (err) {
        console.error('[useCartSync] updateQuantityAsync:', err);
        await loadCartFromServer();
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [dispatch, loadCartFromServer]
  );

  // ── 4. XOÁ SẢN PHẨM ──────────────────────────────────────────────────────
  const removeItemAsync = useCallback(
    async (productId: string | number, cartItemId: number) => {
      dispatch(setSyncing(true));
      try {
        dispatch(localRemoveFromCart(productId));
        const ok = await cartService.removeItem(cartItemId);
        if (!ok) await loadCartFromServer();
      } catch (err) {
        console.error('[useCartSync] removeItemAsync:', err);
        await loadCartFromServer();
      } finally {
        dispatch(setSyncing(false));
      }
    },
    [dispatch, loadCartFromServer]
  );

  // ── 5. REFRESH ────────────────────────────────────────────────────────────
  const refreshCart = useCallback(() => loadCartFromServer(), [loadCartFromServer]);

  return {
    loadCartFromServer,
    refreshCart,
    addToCartAsync,
    updateQuantityAsync,
    removeItemAsync,
  };
};
