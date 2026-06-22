// src/components/cart/CartItemCard.tsx

import { AppText } from '@/src/components/common';
import { QtyStepper } from '@/src/components/common/QtyStepper';
import { CartItem } from '@/src/store/slices/cartSlice';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, Animated, Image, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DELETE_BTN_WIDTH, MEKO_RED, THUMB_SIZE } from './cartConstants';
import { discountPct, effectivePrice, fmtVND } from './cartHelpers';

type Props = {
  item: CartItem;
  onRemove: (item: CartItem) => void;
  onQuantityChange: (item: CartItem, qty: number) => void;
};

export function CartItemCard({ item, onRemove, onQuantityChange }: Props) {
  const { c } = useTheme();
  const price = effectivePrice(item);
  const pct = discountPct(item);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(0);
  const isAlertShowing = useRef(false);

  // ✅ Dùng ref để panResponder luôn có callback mới nhất (tránh stale closure)
  const onRemoveRef = useRef(onRemove);
  const itemRef = useRef(item);
  useEffect(() => {
    onRemoveRef.current = onRemove;
    itemRef.current = item;
  });

  // Reset position khi item thay đổi
  useEffect(() => {
    translateX.setValue(0);
    dragOffset.current = 0;
    isAlertShowing.current = false;
  }, [item.id]);

  const snapBack = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      dragOffset.current = 0;
    });
  }, [translateX]);

  const snapOpen = useCallback(() => {
    Animated.spring(translateX, {
      toValue: -DELETE_BTN_WIDTH,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  // ✅ handleSwipeDelete đọc từ ref → luôn có item/onRemove mới nhất
  const handleSwipeDelete = useCallback(() => {
    if (isAlertShowing.current) return;
    isAlertShowing.current = true;

    // Snap mở hé để thấy nút đỏ trong lúc alert hiển thị
    snapOpen();

    Alert.alert(
      'Xoá khoá học',
      `Bạn có chắc muốn xoá "${itemRef.current.name}" khỏi giỏ hàng?`,
      [
        {
          text: 'Huỷ',
          style: 'cancel',
          onPress: () => {
            isAlertShowing.current = false;
            snapBack();
          },
        },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => {
            isAlertShowing.current = false;
            onRemoveRef.current(itemRef.current);
          },
        },
      ],
      { cancelable: false }
    );
  }, [snapBack, snapOpen]);

  // ✅ handleSwipeDeleteRef để panResponder dùng mà không bị stale
  const handleSwipeDeleteRef = useRef(handleSwipeDelete);
  useEffect(() => {
    handleSwipeDeleteRef.current = handleSwipeDelete;
  });

  const handleDelete = useCallback(() => {
    onRemoveRef.current(itemRef.current);
  }, []);

  // ✅ panResponder tạo 1 lần, nhưng gọi qua ref để luôn mới
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > 8;
        const isMoreHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontal && isMoreHorizontal && !isAlertShowing.current;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAlertShowing.current) return;
        let newOffset = Math.min(0, gestureState.dx + dragOffset.current);
        newOffset = Math.max(newOffset, -DELETE_BTN_WIDTH);
        translateX.setValue(newOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentOffset = dragOffset.current + gestureState.dx;
        if (currentOffset < -DELETE_BTN_WIDTH * 0.5) {
          handleSwipeDeleteRef.current();
        } else {
          snapBack();
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View style={styles.wrapper}>
      {/* Nút xóa phía sau */}
      <View style={[styles.deleteButton, { backgroundColor: Colors.error, width: DELETE_BTN_WIDTH }]}>
        <TouchableOpacity style={styles.deleteTouch} onPress={handleSwipeDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <AppText style={styles.deleteText}>Xóa</AppText>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { transform: [{ translateX }], backgroundColor: c.bg }]}
      >
        <View style={styles.row}>
          <TouchableOpacity activeOpacity={0.85} style={styles.thumbWrap}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumbPlaceholder, { backgroundColor: Colors.primary[50] }]}>
                <Ionicons name="book-outline" size={28} color={Colors.primary[300]} />
              </View>
            )}
            {pct > 0 && (
              <View style={styles.saleBadge}>
                <AppText variant="overline" style={styles.saleBadgeText}>-{pct}%</AppText>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.info}>
            {item.catalogName && (
              <View style={styles.catalogRow}>
                <Ionicons name="storefront-outline" size={11} color={Colors.neutral[400]} />
                <AppText variant="caption" style={styles.catalogText}>{item.catalogName}</AppText>
              </View>
            )}
            <AppText variant="body2" weight="500" numberOfLines={2} style={[styles.name, { color: c.text }]}>
              {item.name}
            </AppText>
            <View style={styles.priceRow}>
              <AppText style={styles.priceMain}>{fmtVND(price)}</AppText>
              {pct > 0 && <AppText variant="caption" style={styles.priceOld}>{fmtVND(item.price)}</AppText>}
            </View>
            <View style={styles.actionsRow}>
              <QtyStepper
                value={item.quantity}
                onDecrease={() => (item.quantity > 1 ? onQuantityChange(item, item.quantity - 1) : onRemove(item))}
                onIncrease={() => onQuantityChange(item, item.quantity + 1)}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.sm,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.md,
  },
  deleteTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
    fontSize: 12,
  },
  card: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  thumbWrap: {
    position: 'relative',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.error,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomRightRadius: Spacing.borderRadius.sm,
  },
  saleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 9 },
  info: { flex: 1, gap: 4 },
  catalogRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  catalogText: { color: Colors.neutral[400], fontSize: 11 },
  name: { lineHeight: 18, fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceMain: { fontSize: 15, fontWeight: '700', color: MEKO_RED },
  priceOld: { textDecorationLine: 'line-through', color: Colors.neutral[400], fontSize: 12 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
});

export default CartItemCard;
