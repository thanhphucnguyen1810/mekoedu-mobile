// FlyToCartOverlay.tsx
import { useDispatch, useSelector } from '@/src/store';
import { hideFly } from '@/src/store/slices/flyToCartSlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const FlyToCartOverlay = () => {
  const dispatch = useDispatch();
  const { visible, origin, target, color, imageUrl } = useSelector((state) => state.flyToCart);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;   
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !origin || !target) return;

    const FLY_SIZE = 56;
    const HALF = FLY_SIZE / 2;

    const startX = origin.x - HALF;
    const startY = origin.y - HALF;
    const endX = target.x + target.width / 2 - HALF;
    const endY = target.y + target.height / 2 - HALF;

    translateX.setValue(startX);
    translateY.setValue(startY);
    scale.setValue(0.8);
    opacity.setValue(1);
    rotate.setValue(0);

    const moveEasing = Easing.bezier(0.25, 0.1, 0.25, 1); 
    const duration = 1100; 

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: endX,
        duration,
        easing: moveEasing,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: endY,
        duration,
        easing: moveEasing,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotate, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => dispatch(hideFly()));

    return () => {
      translateX.stopAnimation();
      translateY.stopAnimation();
    };
  }, [visible, origin, target, translateX, translateY, scale, opacity, rotate, dispatch]);

  if (!visible) return null;

  const spin = rotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '10deg', '0deg'], 
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flyIcon,
        {
          transform: [{ translateX }, { translateY }, { scale }, { rotate: spin }],
          opacity,
        },
      ]}
    >
      <View style={[styles.innerBadge, !imageUrl && { backgroundColor: (color || '#ee4d2d') + '15' }]}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image} 
            resizeMode="cover" 
          />
        ) : (
          <Ionicons 
            name="bag-check" 
            size={32}
            color={color || '#ee4d2d'} 
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  flyIcon: {
    position: 'absolute',
    width: 62, 
    height: 62,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 10,
  },
  innerBadge: {
    width: 64, 
    height: 64,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', 
    borderWidth: 2,
    borderColor: '#FFFFFF', 
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default FlyToCartOverlay;
