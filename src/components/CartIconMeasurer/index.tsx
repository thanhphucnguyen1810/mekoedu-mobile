// src/components/CartIconMeasurer/index.tsx
import { useDispatch } from '@/src/store';
import { setTarget } from '@/src/store/slices/flyToCartSlice';
import React, { ReactNode, useEffect, useRef } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';

interface CartIconMeasurerProps {
  children: ReactNode;
  onPress?: () => void;
}

export const CartIconMeasurer: React.FC<CartIconMeasurerProps> = ({ children, onPress }) => {
  const dispatch = useDispatch();
  const containerRef = useRef<View>(null);

  const updateTargetPosition = () => {
    if (containerRef.current) {
      containerRef.current.measureInWindow((x, y, width, height) => {
        dispatch(setTarget({ x, y, width, height }));
      });
    }
  };

  useEffect(() => {
    // Đo vị trí ban đầu
    const timeout = setTimeout(updateTargetPosition, 100);
    
    // Lắng nghe khi màn hình thay đổi (xoay ngang/dọc)
    const subscription = Dimensions.addEventListener('change', updateTargetPosition);
    
    return () => {
      clearTimeout(timeout);
      subscription?.remove();
    };
  }, []);

  // Cập nhật lại mỗi khi children thay đổi (số lượng giỏ hàng thay đổi)
  useEffect(() => {
    updateTargetPosition();
  }, [children]);

  return (
    <TouchableOpacity 
      ref={containerRef}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};
