
import cartService from "@/src/services/cartService";
import storeConfigService from "@/src/services/storeConfigService";
import userService from "@/src/services/userService";
import type { RootState } from "@/src/store";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: number | string;
  productId?: number;
  skuId?: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
}

const initialState: CartState = {
  items: [],
  loading: false,
};

export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async () => {
    const config = await storeConfigService.getStoreConfig();
    const accountId = await userService.getCurrentAccountId();

    const cart = await cartService.getOrCreateCart(
      Number(accountId),
      Number(config.channelId),
    );

    const itemsData = await cartService.getCartItems(cart.id);
    const items = itemsData.items ?? [];

    return items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      skuId: item.skuId,
      quantity: Number(item.quantity ?? 1),
    }));
  },
);

const isSameCartItem = (a: CartItem, b: CartItem) => {
  if (a.skuId && b.skuId) return Number(a.skuId) === Number(b.skuId);
  if (a.productId && b.productId)
    return Number(a.productId) === Number(b.productId);
  return String(a.id) === String(b.id);
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },

    addToCart(state, action: PayloadAction<CartItem>) {
      const item = action.payload;
      const existing = state.items.find((x) => isSameCartItem(x, item));

      if (existing) {
        existing.quantity += Number(item.quantity || 1);
      } else {
        state.items.push({
          id: item.id,
          productId: item.productId,
          skuId: item.skuId,
          quantity: Number(item.quantity || 1),
        });
      }
    },

    updateCartQuantity(
      state,
      action: PayloadAction<{
        id?: number | string;
        productId?: number;
        skuId?: number;
        quantity: number;
      }>,
    ) {
      const item = state.items.find((x) =>
        isSameCartItem(x, {
          id: action.payload.id ?? "",
          productId: action.payload.productId,
          skuId: action.payload.skuId,
          quantity: action.payload.quantity,
        }),
      );

      if (item) item.quantity = Number(action.payload.quantity || 0);
    },

    removeFromCart(
      state,
      action: PayloadAction<{
        id?: number | string;
        productId?: number;
        skuId?: number;
      }>,
    ) {
      state.items = state.items.filter(
        (x) =>
          !isSameCartItem(x, {
            id: action.payload.id ?? "",
            productId: action.payload.productId,
            skuId: action.payload.skuId,
            quantity: 0,
          }),
      );
    },

    clearCart(state) {
      state.items = [];
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCartItems.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;

// số sản phẩm khác nhau
export const selectCartCount = (state: RootState) => state.cart.items.length;

// tổng số lượng
export const selectCartTotalQuantity = (state: RootState) =>
  state.cart.items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

export default cartSlice.reducer;
