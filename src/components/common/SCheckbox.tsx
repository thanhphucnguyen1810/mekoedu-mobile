import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEKO_RED } from '@/src/components/cart/cartConstants';
import { Colors } from '@/src/theme';

export function SCheckbox({
  checked,
  onPress,
  size = 22,
}: {
  checked: boolean;
  onPress: () => void;
  size?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: checked ? MEKO_RED : 'transparent',
            borderColor: checked ? MEKO_RED : Colors.neutral[300],
            transform: [{ scale }],
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={size * 0.6} color="#fff" />}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
