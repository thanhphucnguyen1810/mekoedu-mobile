/**
 * src/store/slices/liferayAuthSlice.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redux slice quản lý Liferay auth state.
 *
 * THAY ĐỔI SO VỚI BẢN CŨ:
 * - Import từ services/liferay/* (đã refactor) thay vì liferayService monolith
 * - Bỏ import Constants – selectChannelId đọc từ ENV thay vì expoConfig
 * - Bỏ SecureStore – dùng AsyncStorage nhất quán với authService
 *   (authService đã lo việc persist token, slice chỉ giữ state in-memory)
 * - Giữ nguyên toàn bộ thunk logic (rehydrate, login, register, refresh, logout)
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
  accessToken:  string | null;
  refreshToken: string | null;
  user:         UserInfo | null;
  loading:      boolean;
  error:        string | null;
}

const initialState: LiferayAuthState = {
  accessToken:  null,
  refreshToken: null,
  user:         null,
  loading:      false,
  error:        null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

/**
 * Khôi phục session khi app khởi động.
 * authService đã lưu token vào AsyncStorage – chỉ cần đọc lại và verify.
 */
export const rehydrateLiferayAuth = createAsyncThunk(
  "liferayAuth/rehydrate",
  async () => {
    const accessToken = await getUserToken();
    if (!accessToken) return null;

    try {
      // Thử verify bằng access token hiện tại
      const user = await getMyUserInfo();
      return { accessToken, user };
    } catch {
      // Access token hết hạn → httpClient sẽ tự refresh (interceptor trong httpClient.ts)
      // Nếu refresh cũng thất bại, interceptor đã xoá token → trả null
      try {
        const user = await getMyUserInfo();
        const newToken = await getUserToken(); // lấy token mới sau khi interceptor refresh
        return { accessToken: newToken ?? accessToken, user };
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
    { rejectWithValue }
  ) => {
    try {
      // loginUser lưu token vào AsyncStorage
      const tokens = await loginUser(email, password);
      // getMyUserInfo dùng http client với token vừa lưu
      const user = await getMyUserInfo();
      return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, user };
    } catch (e: any) {
      return rejectWithValue(e.message ?? "Đăng nhập thất bại");
    }
  }
);

/** Đăng ký – KHÔNG auto-login (Liferay có thể yêu cầu verify email) */
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

/** Refresh access token thủ công (thường không cần – httpClient tự xử lý 401) */
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

/** Đăng xuất – logoutUser xoá token khỏi AsyncStorage */
export const liferayLogout = createAsyncThunk(
  "liferayAuth/logout",
  async () => { await logoutUser(); }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const liferayAuthSlice = createSlice({
  name: "liferayAuth",
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // rehydrate
      .addCase(rehydrateLiferayAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.user        = action.payload.user;
        }
      })

      // login
      .addCase(liferayLogin.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(liferayLogin.fulfilled, (state, { payload }) => {
        state.loading      = false;
        state.accessToken  = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.user         = payload.user;
      })
      .addCase(liferayLogin.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      })

      // register
      .addCase(liferayRegister.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(liferayRegister.fulfilled, (state) => { state.loading = false; })
      .addCase(liferayRegister.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      })

      // refresh
      .addCase(liferayRefreshToken.fulfilled, (state, { payload }) => {
        state.accessToken  = payload.access_token;
        state.refreshToken = payload.refresh_token;
      })
      .addCase(liferayRefreshToken.rejected, (state) => {
        // Token không thể refresh → force logout
        return initialState;
      })

      // logout
      .addCase(liferayLogout.fulfilled, () => initialState);
  },
});

export const { clearError } = liferayAuthSlice.actions;
export default liferayAuthSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAccessToken      = (s: RootState) => s.liferayAuth.accessToken;
export const selectRefreshToken     = (s: RootState) => s.liferayAuth.refreshToken;
export const selectUser             = (s: RootState) => s.liferayAuth.user;
export const selectAuthLoading      = (s: RootState) => s.liferayAuth.loading;
export const selectAuthError        = (s: RootState) => s.liferayAuth.error;
export const selectIsAuthenticated  = (s: RootState) => !!s.liferayAuth.accessToken;

/** Account ID của user (từ Liferay accountBriefs) */
export const selectAccountId = (s: RootState) =>
  s.liferayAuth.user?.accountBriefs?.[0]?.id ?? null;

/**
 * Channel ID đọc từ ENV (không dùng Constants.expoConfig trong selector).
 * Selector không nhận tham số state vì đây là config tĩnh.
 */
export const selectChannelId = () => parseInt(ENV.CHANNEL_ID, 10);
