import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/src/components/common';
import { useTheme, Colors, Spacing } from '@/src/theme';

export function QtyStepper({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.wrap, { borderColor: c.border }]}>
      <TouchableOpacity style={[styles.btn, { backgroundColor: c.bgSoft }]} onPress={onDecrease}>
        <Ionicons name="remove" size={14} color={c.text} />
      </TouchableOpacity>
      <View style={styles.valWrap}>
        <AppText variant="body2" weight="600" style={styles.val}>{value}</AppText>
      </View>
      <TouchableOpacity style={[styles.btn, { backgroundColor: c.bgSoft }]} onPress={onIncrease}>
        <Ionicons name="add" size={14} color={c.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderWidth: 0.5, borderRadius: Spacing.borderRadius.sm, overflow: 'hidden' },
  btn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  valWrap: { width: 36, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: Colors.neutral[200] },
  val: { fontSize: 13 },
});
