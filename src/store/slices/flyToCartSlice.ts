// src/store/slices/flyToCartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FlyOrigin {
  x: number;
  y: number;
}

export interface FlyTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlyToCartState {
  visible: boolean;
  origin: FlyOrigin | null;
  target: FlyTarget | null;
  color: string;
  imageUrl?: string;
}

const initialState: FlyToCartState = {
  visible: false,
  origin: null,
  target: null,
  color: '#ee4d2d',
};

const flyToCartSlice = createSlice({
  name: 'flyToCart',
  initialState,
  reducers: {
    showFly: (state, action: PayloadAction<{ origin: FlyOrigin; color?: string; imageUrl?: string }>) => {
      state.visible = true;
      state.origin = action.payload.origin;
      if (action.payload.color) state.color = action.payload.color;
      if (action.payload.imageUrl) state.imageUrl = action.payload.imageUrl;
    },
    hideFly: (state) => {
      state.visible = false;
      state.origin = null;
      state.imageUrl = undefined;
    },
    setTarget: (state, action: PayloadAction<FlyTarget>) => {
      state.target = action.payload;
    },
  },
});

export const { showFly, hideFly, setTarget } = flyToCartSlice.actions;
export default flyToCartSlice.reducer;
