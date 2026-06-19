// src/hooks/useFlyToCart.ts
import { useDispatch } from '@/src/store';
import { FlyOrigin, showFly } from '@/src/store/slices/flyToCartSlice';

export const useFlyToCart = () => {
  const dispatch = useDispatch();

  const flyFrom = (origin: FlyOrigin, color?: string, imageUrl?: string) => {
    dispatch(showFly({ origin, color, imageUrl }));
  };

  return { flyFrom };
};
