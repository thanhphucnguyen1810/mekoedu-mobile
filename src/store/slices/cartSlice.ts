// src/store/slices/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string | number;
  name: string;
  thumbnail?: string;
  /** Giá gốc (VND) */
  price: number;
  /** Giá khuyến mãi – 0 hoặc undefined nếu không có */
  promoPrice?: number;
  catalogName?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  /** Mã coupon đang áp dụng (để dùng sau) */
  couponCode: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState: CartState = {
  items: [],
  couponCode: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /**
     * Thêm sản phẩm vào giỏ.
     * Nếu id đã tồn tại → tăng số lượng, không thêm mới.
     */
    addToCart(state, action: PayloadAction<Omit<CartItem, "quantity"> & { quantity?: number }>) {
      const { quantity = 1, ...product } = action.payload;
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...product, quantity });
      }
    },

    /**
     * Xóa 1 sản phẩm khỏi giỏ theo id.
     */
    removeFromCart(state, action: PayloadAction<string | number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },

    /**
     * Cập nhật số lượng của 1 sản phẩm.
     * Nếu quantity <= 0 → xóa khỏi giỏ.
     */
    updateQuantity(
      state,
      action: PayloadAction<{ id: string | number; quantity: number }>
    ) {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.id !== id);
      } else {
        const item = state.items.find((i) => i.id === id);
        if (item) item.quantity = quantity;
      }
    },

    /**
     * Xóa toàn bộ giỏ hàng.
     */
    clearCart(state) {
      state.items = [];
      state.couponCode = null;
    },

    /**
     * Áp dụng / xóa coupon code.
     */
    setCouponCode(state, action: PayloadAction<string | null>) {
      state.couponCode = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCouponCode,
} = cartSlice.actions;

export default cartSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
import type { RootState } from "@/src/store";

/** Tất cả items trong giỏ */
export const selectCartItems = (state: RootState) => state.cart.items;

/** Tổng số lượng sản phẩm (dùng cho badge icon) */
export const selectCartCount = (state: RootState) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

/** Tổng tiền sau khuyến mãi */
export const selectCartTotal = (state: RootState) =>
  state.cart.items.reduce((sum, i) => {
    const price =
      i.promoPrice && i.promoPrice > 0 && i.promoPrice < i.price
        ? i.promoPrice
        : i.price;
    return sum + price * i.quantity;
  }, 0);

/** Tiết kiệm được */
export const selectCartSavings = (state: RootState) =>
  state.cart.items.reduce((sum, i) => {
    const saving =
      i.promoPrice && i.promoPrice > 0 && i.promoPrice < i.price
        ? (i.price - i.promoPrice) * i.quantity
        : 0;
    return sum + saving;
  }, 0);
  