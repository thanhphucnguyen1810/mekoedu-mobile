import { configureStore } from "@reduxjs/toolkit";
import { useDispatch as useReduxDispatch, useSelector as useReduxSelector, TypedUseSelectorHook } from "react-redux";
import cartReducer from "./slices/cartSlice";
import liferayAuthReducer from "./slices/liferayAuthSlice";
import examReducer from "./slices/examSlice";
import flyToCartReducer from "./slices/flyToCartSlice";

export const store = configureStore({
  reducer: {
    liferayAuth: liferayAuthReducer,
    cart: cartReducer,
    exam: examReducer,
    flyToCart: flyToCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


export const useDispatch = () => useReduxDispatch<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
