import { AppText } from '@/src/components/common';
import { QtyStepper } from '@/src/components/common/QtyStepper';
import { SCheckbox } from '@/src/components/common/SCheckbox';
import { AppConfig } from '@/src/config/appConfig';
import { CartItem } from '@/src/store/slices/cartSlice';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Image, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DELETE_BTN_WIDTH, MEKO_RED, SWIPE_THRESHOLD, THUMB_SIZE } from './cartConstants';
import { discountPct, effectivePrice, fmtVND } from './cartHelpers';


type Props = {
  item: CartItem;
  selected: boolean;
  onToggleSelect: (id: string | number) => void;
  onRemove: (item: CartItem) => void;
  onQuantityChange: (item: CartItem, qty: number) => void;
};

export function CartItemCard({ item, selected, onToggleSelect, onRemove, onQuantityChange }: Props) {
  const { c } = useTheme();
  const price = effectivePrice(item);
  const pct = discountPct(item);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(0);
  const cartConfig = AppConfig.cart;
  console.log('item.name:', item.name);
  console.log('item:', item);
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > 10;
        const isMoreHorizontalThanVertical = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontal && isMoreHorizontalThanVertical;
      },
      onPanResponderGrant: () => translateX.stopAnimation(),
      onPanResponderMove: (_, gestureState) => {
        let newOffset = Math.min(0, gestureState.dx);
        newOffset = Math.max(newOffset, -DELETE_BTN_WIDTH);
        dragOffset.current = newOffset;
        translateX.setValue(newOffset);
      },
      onPanResponderRelease: () => {
        if (dragOffset.current < SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -DELETE_BTN_WIDTH - 20,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onRemove(item));
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start(() => { dragOffset.current = 0; });
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.deleteButton, { backgroundColor: Colors.error, width: DELETE_BTN_WIDTH }]}>
        <View style={styles.deleteTouch}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <AppText style={styles.deleteText}>{cartConfig.deleteLabel}</AppText>
        </View>
      </View>

      <Animated.View {...panResponder.panHandlers} style={[styles.card, { transform: [{ translateX }], backgroundColor: c.bg }]}>
        <View style={styles.row}>
          <SCheckbox checked={selected} onPress={() => onToggleSelect(item.id)} size={22} />
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
            <AppText variant="body2" weight="500" numberOfLines={2} style={[styles.name, { color: c.text }]}>{item.name}</AppText>
            {(item.shortDescription || item.description) && (
              <View style={[styles.variationTag, { backgroundColor: c.bgSoft, borderColor: c.border }]}>
                <AppText variant="caption" color="textSub" numberOfLines={1}>
                  {(item.shortDescription || item.description || '').substring(0, 50)}...
                </AppText>
              </View>
            )}
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
  wrapper: { position: 'relative', marginBottom: Spacing.sm },
  deleteButton: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', borderRadius: Spacing.borderRadius.md },
  deleteTouch: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  deleteText: { color: '#fff', fontWeight: '600', marginTop: 4, fontSize: 12 },
  card: { paddingHorizontal: Spacing.md, paddingVertical: 12, borderRadius: Spacing.borderRadius.md },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  thumbWrap: { position: 'relative', width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Spacing.borderRadius.md, overflow: 'hidden', flexShrink: 0 },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saleBadge: { position: 'absolute', top: 0, left: 0, backgroundColor: Colors.error, paddingHorizontal: 5, paddingVertical: 2, borderBottomRightRadius: Spacing.borderRadius.sm },
  saleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 9 },
  info: { flex: 1, gap: 4 },
  catalogRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  catalogText: { color: Colors.neutral[400], fontSize: 11 },
  name: { lineHeight: 18 },
  variationTag: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Spacing.borderRadius.sm, borderWidth: 0.5 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceMain: { fontSize: 15, fontWeight: '700', color: MEKO_RED },
  priceOld: { textDecorationLine: 'line-through', color: Colors.neutral[400], fontSize: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
});
