/**
 * src/store/slices/liferayAuthSlice.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redux slice quản lý Liferay auth state.
 *
 * THAY ĐỔI SO VỚI BẢN CŨ:
 * - liferayLogin.fulfilled: dispatch loadCartFromServer() để badge giỏ hàng
 *   trong AppHeader hiển thị đúng số lượng ngay sau khi đăng nhập.
 * - rehydrateLiferayAuth.fulfilled: tương tự — khi app khởi động và phát hiện
 *   user đã login, cũng load cart luôn.
 * - Dùng AppDispatch type để tránh circular import với store.
 */

import { ENV } from "@/src/config/env";
import {
  getMyUserInfo,
  getUserToken,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "@/src/services/liferay";
import type { RegisterPayload, UserInfo } from "@/src/types/liferay";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../index";

// ─── State ────────────────────────────────────────────────────────────────────

interface LiferayAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: LiferayAuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

/**
 * Khôi phục session khi app khởi động.
 * Sau khi xác nhận token còn hợp lệ, dispatch loadCartFromServer để badge cập nhật.
 */
export const rehydrateLiferayAuth = createAsyncThunk(
  "liferayAuth/rehydrate",
  async (_, { dispatch }) => {
    const accessToken = await getUserToken();
    if (!accessToken) return null;

    try {
      const user = await getMyUserInfo();
      const result = { accessToken, user };

      // ✅ Load cart sau khi rehydrate để badge hiện đúng
      _dispatchLoadCart(dispatch);

      return result;
    } catch {
      try {
        const user = await getMyUserInfo();
        const newToken = await getUserToken();
        const result = { accessToken: newToken ?? accessToken, user };

        _dispatchLoadCart(dispatch);

        return result;
      } catch {
        return null;
      }
    }
  }
);

/** Đăng nhập */
export const liferayLogin = createAsyncThunk(
  "liferayAuth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // loginUser đã gọi ensureUserAccount() để restore accountId vào cache
      const tokens = await loginUser(email, password);
      const user = await getMyUserInfo();

      // ✅ Load cart ngay sau login để AppHeader badge hiện đúng số lượng
      _dispatchLoadCart(dispatch);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user,
      };
    } catch (e: any) {
      return rejectWithValue(e.message ?? "Đăng nhập thất bại");
    }
  }
);

/** Đăng ký – KHÔNG auto-login */
export const liferayRegister = createAsyncThunk(
  "liferayAuth/register",
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      return await registerUser(payload);
    } catch (e: any) {
      const msg: string = e.message ?? "Đăng ký thất bại";
      if (msg.includes("409") || msg.toLowerCase().includes("duplicate")) {
        return rejectWithValue("Email này đã được đăng ký");
      }
      if (msg.includes("400")) {
        return rejectWithValue(
          "Thông tin không hợp lệ. Mật khẩu cần có chữ hoa, số và ký tự đặc biệt."
        );
      }
      return rejectWithValue(msg);
    }
  }
);

/** Refresh access token thủ công */
export const liferayRefreshToken = createAsyncThunk(
  "liferayAuth/refresh",
  async (_, { getState, rejectWithValue }) => {
    const { refreshToken } = (getState() as RootState).liferayAuth;
    if (!refreshToken) return rejectWithValue("Không có refresh token");
    try {
      return await refreshAccessToken(refreshToken);
    } catch {
      return rejectWithValue("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    }
  }
);

/** Đăng xuất */
export const liferayLogout = createAsyncThunk("liferayAuth/logout", async (_, { dispatch }) => {
  await logoutUser();
  // ✅ Xóa cart items khỏi Redux khi logout
  const { resetCart } = await import("./cartSlice");
  dispatch(resetCart());
});

// ─── Helper: dispatch loadCartFromServer không tạo circular import ────────────

/**
 * Lazy import useCartSync không khả thi trong thunk.
 * Thay vào đó, dispatch một action đặc biệt mà CartSyncListener lắng nghe,
 * hoặc import trực tiếp từ cartSlice + cartService.
 *
 * Giải pháp đơn giản: import cartService và syncCartFromServer trực tiếp.
 */
async function _dispatchLoadCart(dispatch: any): Promise<void> {
  try {
    const [{ findOrCreateCart, getCart }, { syncCartFromServer }] = await Promise.all([
      import("@/src/services/liferay"),
      import("./cartSlice"),
    ]);

    const cartId = await findOrCreateCart();
    if (!cartId) return;

    const cart = await getCart(cartId);
    if (!cart) return;

    const items = (cart.cartItems ?? []).map((item: any) => {
      // Đảm bảo thumbnail là absolute URL nếu Liferay trả về path tương đối
      const thumb: string = item.thumbnail ?? "";
      const thumbnail =
        thumb && !thumb.startsWith("http")
          ? `${ENV.API_URL}${thumb}`
          : thumb;

      return {
        id: item.id,
        cartItemId: item.cartItemId,
        skuId: item.skuId,
        name: item.name,
        thumbnail,
        price: item.price,
        promoPrice: item.promoPrice,
        catalogName: item.catalogName,
        quantity: item.quantity,
      };
    });

    dispatch(
      syncCartFromServer({
        cartId: cart.id,
        items,
        selectedIds: items.map((i: any) => i.id),
        coupon: null,
        summary: cart.summary ?? null,
      })
    );

    console.log(
      `[liferayAuthSlice] ✅ Cart loaded after auth: ${items.length} items`
    );
  } catch (e) {
    console.warn("[liferayAuthSlice] ⚠️ _dispatchLoadCart failed:", e);
  }
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const liferayAuthSlice = createSlice({
  name: "liferayAuth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // rehydrate
      .addCase(rehydrateLiferayAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.user;
        }
      })

      // login
      .addCase(liferayLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(liferayLogin.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.accessToken = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.user = payload.user;
      })
      .addCase(liferayLogin.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      // register
      .addCase(liferayRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(liferayRegister.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(liferayRegister.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      // refresh
      .addCase(liferayRefreshToken.fulfilled, (state, { payload }) => {
        state.accessToken = payload.access_token;
        state.refreshToken = payload.refresh_token;
      })
      .addCase(liferayRefreshToken.rejected, (state) => {
        return initialState;
      })

      // logout
      .addCase(liferayLogout.fulfilled, () => initialState);
  },
});

export const { clearError } = liferayAuthSlice.actions;
export default liferayAuthSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAccessToken = (s: RootState) => s.liferayAuth.accessToken;
export const selectRefreshToken = (s: RootState) => s.liferayAuth.refreshToken;
export const selectUser = (s: RootState) => s.liferayAuth.user;
export const selectAuthLoading = (s: RootState) => s.liferayAuth.loading;
export const selectAuthError = (s: RootState) => s.liferayAuth.error;
export const selectIsAuthenticated = (s: RootState) => !!s.liferayAuth.accessToken;

export const selectAccountId = (s: RootState) =>
  s.liferayAuth.user?.accountBriefs?.[0]?.id ?? null;

export const selectChannelId = () => parseInt(ENV.CHANNEL_ID, 10);
