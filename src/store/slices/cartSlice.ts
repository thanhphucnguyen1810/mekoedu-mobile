// store/slices/cartSlice.ts
import type { RootState } from '@/src/store/index';
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string | number;       // productId – key để identify trong Redux
  cartItemId: number;        // Liferay cartItemId – dùng cho PATCH / DELETE API
  skuId: number | string;
  name: string;
  thumbnail?: string;
  price: number;
  promoPrice?: number;
  catalogName?: string;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
}

interface CartState {
  items: CartItem[];
  cartId: number | null;
  loading: boolean;
  error: string | null;
  // ⚠️ Dùng array thay vì Set để Redux serializable
  selectedIds: (string | number)[];
  appliedCoupon: Coupon | null;
  syncing: boolean;
  lastSyncedAt: string | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: CartState = {
  items: [],
  cartId: null,
  loading: false,
  error: null,
  selectedIds: [],
  appliedCoupon: null,
  syncing: false,
  lastSyncedAt: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const effectivePrice = (item: CartItem): number =>
  item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
    ? item.promoPrice
    : item.price;

const sumTotal = (items: CartItem[]): number =>
  items.reduce((s, i) => s + effectivePrice(i) * i.quantity, 0);

const sumOriginal = (items: CartItem[]): number =>
  items.reduce((s, i) => s + i.price * i.quantity, 0);

const sumSavings = (items: CartItem[]): number =>
  items.reduce((s, i) => {
    if (i.promoPrice && i.promoPrice < i.price) {
      return s + (i.price - i.promoPrice) * i.quantity;
    }
    return s;
  }, 0);

// ─── Slice ────────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // ── Cart CRUD ─────────────────────────────────────────────────────────────

    setCartId(state, action: PayloadAction<number>) {
      state.cartId = action.payload;
    },

    clearCartId(state) {
      state.cartId = null;
    },

    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.error = null;
    },

    addToCart(state, action: PayloadAction<CartItem>) {
      const idx = state.items.findIndex((i) => i.id === action.payload.id);
      if (idx >= 0) {
        // Đã tồn tại – cập nhật quantity và cartItemId mới nhất từ server
        state.items[idx].quantity += action.payload.quantity;
        state.items[idx].cartItemId = action.payload.cartItemId;
      } else {
        state.items.push(action.payload);
      }
      state.error = null;
    },

    updateQuantity(state, action: PayloadAction<{ id: string | number; quantity: number }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item && action.payload.quantity > 0) {
        item.quantity = action.payload.quantity;
      }
    },

    removeFromCart(state, action: PayloadAction<string | number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.selectedIds = state.selectedIds.filter((id) => id !== action.payload);
    },

    clearCart(state) {
      state.items = [];
      state.selectedIds = [];
      state.appliedCoupon = null;
      state.error = null;
    },

    // ── Selection ─────────────────────────────────────────────────────────────

    selectItem(state, action: PayloadAction<string | number>) {
      if (!state.selectedIds.includes(action.payload)) {
        state.selectedIds.push(action.payload);
      }
    },

    deselectItem(state, action: PayloadAction<string | number>) {
      state.selectedIds = state.selectedIds.filter((id) => id !== action.payload);
    },

    toggleSelectItem(state, action: PayloadAction<string | number>) {
      const idx = state.selectedIds.indexOf(action.payload);
      if (idx >= 0) {
        state.selectedIds.splice(idx, 1);
      } else {
        state.selectedIds.push(action.payload);
      }
    },

    selectAllItems(state) {
      state.selectedIds = state.items.map((i) => i.id);
    },

    deselectAllItems(state) {
      state.selectedIds = [];
    },

    setSelectedIds(state, action: PayloadAction<(string | number)[]>) {
      state.selectedIds = action.payload;
    },

    // ── Coupon ────────────────────────────────────────────────────────────────

    applyCoupon(state, action: PayloadAction<Coupon>) {
      state.appliedCoupon = action.payload;
    },

    removeCoupon(state) {
      state.appliedCoupon = null;
    },

    // ── UI State ──────────────────────────────────────────────────────────────

    setCartLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setCartError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    setSyncing(state, action: PayloadAction<boolean>) {
      state.syncing = action.payload;
    },

    // ── Batch Sync từ Server ──────────────────────────────────────────────────
    /**
     * Gọi sau khi fetch giỏ hàng từ Liferay xong.
     * Ghi đè toàn bộ items + cartId.
     */
    syncCartFromServer(
      state,
      action: PayloadAction<{
        cartId: number;
        items: CartItem[];
        selectedIds?: (string | number)[];
        coupon?: Coupon | null;
      }>
    ) {
      state.cartId = action.payload.cartId;
      state.items = action.payload.items;
      if (action.payload.selectedIds !== undefined) {
        state.selectedIds = action.payload.selectedIds;
      }
      if (action.payload.coupon !== undefined) {
        state.appliedCoupon = action.payload.coupon;
      }
      state.lastSyncedAt = new Date().toISOString();
      state.error = null;
    },

    resetCart: () => initialState,
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export const {
  setCartId,
  clearCartId,
  setCartItems,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  selectItem,
  deselectItem,
  toggleSelectItem,
  selectAllItems,
  deselectAllItems,
  setSelectedIds,
  applyCoupon,
  removeCoupon,
  setCartLoading,
  setCartError,
  setSyncing,
  syncCartFromServer,
  resetCart,
} = cartSlice.actions;

// ─── Basic Selectors ──────────────────────────────────────────────────────────

export const selectCartItems    = (s: RootState) => s.cart.items;
export const selectCartId       = (s: RootState) => s.cart.cartId;
export const selectCartLoading  = (s: RootState) => s.cart.loading;
export const selectCartError    = (s: RootState) => s.cart.error;
export const selectCartSyncing  = (s: RootState) => s.cart.syncing;
export const selectLastSyncedAt = (s: RootState) => s.cart.lastSyncedAt;
export const selectSelectedIds  = (s: RootState) => s.cart.selectedIds;
export const selectAppliedCoupon = (s: RootState) => s.cart.appliedCoupon;

// ─── Computed Selectors ───────────────────────────────────────────────────────

export const selectCartCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((c, i) => c + i.quantity, 0)
);

export const selectCartTotal = createSelector(
  [selectCartItems], sumTotal
);

export const selectCartOriginalTotal = createSelector(
  [selectCartItems], sumOriginal
);

export const selectCartSavings = createSelector(
  [selectCartItems], sumSavings
);

// ─── Selected Items ───────────────────────────────────────────────────────────

export const selectSelectedItems = createSelector(
  [selectCartItems, selectSelectedIds],
  (items, ids) => items.filter((i) => ids.includes(i.id))
);

export const selectSelectedCount = createSelector(
  [selectSelectedItems],
  (items) => items.reduce((c, i) => c + i.quantity, 0)
);

export const selectSelectedTotal = createSelector(
  [selectSelectedItems], sumTotal
);

export const selectSelectedOriginalTotal = createSelector(
  [selectSelectedItems], sumOriginal
);

export const selectSelectedSavings = createSelector(
  [selectSelectedItems], sumSavings
);

// ─── Final Total (có coupon) ──────────────────────────────────────────────────

export const selectFinalTotal = createSelector(
  [selectSelectedTotal, selectAppliedCoupon],
  (subtotal, coupon) => {
    if (!coupon || subtotal === 0) return subtotal;
    if (subtotal < (coupon.minOrderValue ?? 0)) return subtotal;
    const discount =
      coupon.discountType === 'percentage'
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
    return Math.max(0, subtotal - Math.min(discount, subtotal));
  }
);

export const selectDiscountAmount = createSelector(
  [selectSelectedTotal, selectFinalTotal],
  (sub, final) => sub - final
);

// ─── Checkout Data ────────────────────────────────────────────────────────────

export const selectCheckoutData = createSelector(
  [
    selectSelectedItems,
    selectSelectedTotal,
    selectSelectedOriginalTotal,
    selectSelectedSavings,
    selectAppliedCoupon,
    selectFinalTotal,
    selectDiscountAmount,
  ],
  (items, subtotal, originalTotal, savings, coupon, finalTotal, discountAmount) => ({
    items,
    subtotal,
    originalTotal,
    savings,
    coupon,
    finalTotal,
    discountAmount,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  })
);

// ─── Helper Selectors ─────────────────────────────────────────────────────────

export const selectIsAllSelected = createSelector(
  [selectCartItems, selectSelectedIds],
  (items, ids) => items.length > 0 && items.every((i) => ids.includes(i.id))
);

export const selectIsSomeSelected = createSelector(
  [selectSelectedIds],
  (ids) => ids.length > 0
);

export const selectIsItemSelected = (id: string | number) =>
  createSelector([selectSelectedIds], (ids) => ids.includes(id));

export const selectCartItemById = (id: string | number) =>
  createSelector([selectCartItems], (items) => items.find((i) => i.id === id));

// ─── Default Export ───────────────────────────────────────────────────────────

export default cartSlice.reducer;
