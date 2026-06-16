// /**
//  * liferayAuthSlice.ts
//  * Redux slice quản lý Liferay auth state.
//  * Sửa: refreshToken → refreshAccessToken (tên đúng trong liferayService)
//  *      liferayRegister không auto-login (Liferay cần verify email → dẫn về login)
//  */

// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import * as SecureStore from "expo-secure-store";

// const KEY_ACCESS  = "liferay_access_token";
// const KEY_REFRESH = "liferay_refresh_token";

// // ─── State ────────────────────────────────────────────────────────────────────

// interface LiferayAuthState {
//   accessToken:  string | null;
//   refreshToken: string | null;
//   user:         LiferayUserInfo | null;
//   loading:      boolean;
//   error:        string | null;
// }

// const initialState: LiferayAuthState = {
//   accessToken:  null,
//   refreshToken: null,
//   user:         null,
//   loading:      false,
//   error:        null,
// };

// // ─── Thunks ───────────────────────────────────────────────────────────────────

// /** Khôi phục session khi app khởi động */
// // export const rehydrateLiferayAuth = createAsyncThunk(
// //   "liferayAuth/rehydrate",
// //   async () => {
// //     const accessToken    = await SecureStore.getItemAsync(KEY_ACCESS);
// //     const storedRefresh  = await SecureStore.getItemAsync(KEY_REFRESH);
// //     if (!accessToken) return null;
// //     const user = await getMyUserInfo(accessToken).catch(() => null);
// //     return { accessToken, refreshToken: storedRefresh, user };
// //   }
// // );

// /** Đăng nhập */
// export const liferayLogin = createAsyncThunk(
//   "liferayAuth/login",
//   async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
//     try {
//       const tokens = await loginUser(email, password);
//       // Tạm thời comment dòng này để test xem lấy Token được chưa đã
//       // const user = await getMyUserInfo(tokens.access_token); 
      
//       return {
//         accessToken: tokens.access_token,
//         refreshToken: tokens.refresh_token,
//         user: null, // Cho user bằng null để test token trước
//       };
//     } catch (e: any) {
//       // In thẳng cái e này ra console để nhìn
//       console.log("FULL ERROR FROM SERVER:", e);
      
//       // Trả về message chi tiết nhất có thể
//       return rejectWithValue(e.message || "Đăng nhập thất bại");
//     }
//   }
// );

// /** Đăng ký – KHÔNG auto-login (Liferay có thể yêu cầu verify email) */
// export const liferayRegister = createAsyncThunk(
//   "liferayAuth/register",
//   async (
//     payload: RegisterPayload,  // không cần password riêng, đã có trong RegisterPayload
//     { rejectWithValue }
//   ) => {
//     try {
//       const user = await registerUser(payload);
//       return user;
//     } catch (e: unknown) {
//       const msg = e instanceof Error ? e.message : "Đăng ký thất bại";
//       // Parse lỗi Liferay thường trả về
//       if (msg.includes("409") || msg.toLowerCase().includes("duplicate")) {
//         return rejectWithValue("Email này đã được đăng ký");
//       }
//       if (msg.includes("400")) {
//         return rejectWithValue("Thông tin đăng ký không hợp lệ. Mật khẩu cần có chữ hoa, số và ký tự đặc biệt.");
//       }
//       return rejectWithValue(msg);
//     }
//   }
// );

// /** Refresh access token */
// export const liferayRefreshToken = createAsyncThunk(
//   "liferayAuth/refresh",
//   async (_, { getState, rejectWithValue }) => {
//     const state = (getState() as { liferayAuth: LiferayAuthState }).liferayAuth;
//     if (!state.refreshToken) return rejectWithValue("Không có refresh token");
//     try {
//       const tokens = await refreshAccessToken(state.refreshToken);
//       await SecureStore.setItemAsync(KEY_ACCESS,  tokens.access_token);
//       await SecureStore.setItemAsync(KEY_REFRESH, tokens.refresh_token);
//       return tokens;
//     } catch {
//       return rejectWithValue("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
//     }
//   }
// );

// /** Đăng xuất */
// export const liferayLogout = createAsyncThunk("liferayAuth/logout", async () => {
//   await SecureStore.deleteItemAsync(KEY_ACCESS);
//   await SecureStore.deleteItemAsync(KEY_REFRESH);
// });

// // ─── Slice ────────────────────────────────────────────────────────────────────

// const liferayAuthSlice = createSlice({
//   name: "liferayAuth",
//   initialState,
//   reducers: {
//     clearError(state) { state.error = null; },
//   },
//   extraReducers: (builder) => {
//     builder
//       // rehydrate
//       // .addCase(rehydrateLiferayAuth.fulfilled, (state, action) => {
//       //   if (action.payload) {
//       //     state.accessToken  = action.payload.accessToken;
//       //     state.refreshToken = action.payload.refreshToken ?? null;
//       //     state.user         = action.payload.user;
//       //   }
//       // })

//       // login
//       .addCase(liferayLogin.pending,   (state) => { state.loading = true; state.error = null; })
//       .addCase(liferayLogin.fulfilled, (state, action) => {
//         state.loading      = false;
//         state.accessToken  = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//         state.user         = action.payload.user;
//       })
//       .addCase(liferayLogin.rejected,  (state, action) => {
//         state.loading = false;
//         state.error   = action.payload as string;
//       })

//       // register
//       .addCase(liferayRegister.pending,   (state) => { state.loading = true; state.error = null; })
//       .addCase(liferayRegister.fulfilled, (state) => { state.loading = false; })
//       .addCase(liferayRegister.rejected,  (state, action) => {
//         state.loading = false;
//         state.error   = action.payload as string;
//       })

//       // refresh
//       .addCase(liferayRefreshToken.fulfilled, (state, action) => {
//         state.accessToken  = action.payload.access_token;
//         state.refreshToken = action.payload.refresh_token;
//       })
//       .addCase(liferayRefreshToken.rejected, (state) => {
//         // Token hết hạn → force logout
//         state.accessToken  = null;
//         state.refreshToken = null;
//         state.user         = null;
//       })

//       // logout
//       .addCase(liferayLogout.fulfilled, (state) => {
//         state.accessToken  = null;
//         state.refreshToken = null;
//         state.user         = null;
//       });
//   },
// });

// export const { clearError } = liferayAuthSlice.actions;
// export default liferayAuthSlice.reducer;

