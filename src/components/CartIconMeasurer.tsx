// src/components/CartIconMeasurer.tsx
import { useDispatch } from '@/src/store';
import { setTarget } from '@/src/store/slices/flyToCartSlice';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';

interface Props {
  children?: React.ReactNode;
  onPress?: () => void;
}

export const CartIconMeasurer: React.FC<Props> = ({ children, onPress }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const ref = useRef<View>(null);

  const measureAndSave = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      dispatch(setTarget({ x, y, width, height }));
    });
  };

  useEffect(() => {
    measureAndSave();
    const timer = setTimeout(measureAndSave, 300);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/cart');
    }
  };

  return (
    <TouchableOpacity ref={ref} onPress={handlePress} style={{ marginRight: 12 }}>
      {children || <Ionicons name="cart-outline" size={24} color="#000" />}
    </TouchableOpacity>
  );
};
