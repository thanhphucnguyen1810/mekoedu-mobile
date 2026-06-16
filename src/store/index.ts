/**
 * src/store/index.ts
 * Redux store – tích hợp liferayAuth, cart, exam
 */

import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
// import liferayAuthReducer from "./slices/liferayAuthSlice";
import examReducer from "./slices/examSlice"; // bật sau khi tách examSlice

export const store = configureStore({
  reducer: {
    // liferayAuth: liferayAuthReducer,

    cart: cartReducer,
    exam: examReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // cần cho AsyncStorage thunk
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
