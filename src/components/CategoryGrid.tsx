import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { useTheme } from '@/src/theme';

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface Category {
  id: string;
  name: string;
  iconName: MaterialIconName;
}

interface CategoryGridProps {
  data: readonly Category[];
  onCategoryPress?: (id: string) => void;
}

// Breakpoints cho responsive
const BREAKPOINTS = {
  phone: 480,    // điện thoại thường
  tablet: 768,   // tablet nhỏ
  tabletLg: 1024, // tablet lớn / iPad Pro
};

// Tính số item hiển thị dựa theo chiều rộng màn hình
function getVisibleItemCount(width: number): number {
  if (width >= BREAKPOINTS.tabletLg) return 8.5;
  if (width >= BREAKPOINTS.tablet) return 6.5;
  if (width >= BREAKPOINTS.phone) return 6.2;
  return 5.2;
}

// Kích thước icon box tương ứng
function getIconBoxSize(width: number): number {
  if (width >= BREAKPOINTS.tabletLg) return 64;
  if (width >= BREAKPOINTS.tablet) return 58;
  if (width >= BREAKPOINTS.phone) return 56;
  return 52;
}

// Font size label tương ứng
function getLabelFontSize(width: number): number {
  if (width >= BREAKPOINTS.tablet) return 12;
  return 11;
}

export const CategoryGrid = ({ data, onCategoryPress }: CategoryGridProps) => {
  const { width: windowWidth } = useWindowDimensions();
  
  const { c, colors, radius, spacing, typography } = useTheme();

  const visibleCount = getVisibleItemCount(windowWidth);
  const iconBoxSize = getIconBoxSize(windowWidth);
  const labelFontSize = getLabelFontSize(windowWidth);

  const availableWidth = windowWidth - spacing.layout.screenHorizontal * 2;
  const itemWidth = availableWidth / visibleCount;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        { paddingVertical: spacing.xs }
      ]}
      snapToInterval={itemWidth}
      decelerationRate="fast"
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.item, { width: itemWidth, gap: spacing.sm - 2 }]} // gap: 6px
          onPress={() => onCategoryPress?.(item.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={item.name}
        >
          <View
            style={[
              styles.iconBox,
              {
                width: iconBoxSize,
                height: iconBoxSize,
                borderRadius: radius.md,
                backgroundColor: colors.primary[100], 
                shadowColor: colors.neutral[1000],
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.iconName as any}
              size={Math.round(iconBoxSize * 0.44)}
              color={c.text}
            />
          </View>

          <Text
            style={[
              typography.variants.caption,
              styles.label,
              {
                color: c.text,
                fontSize: labelFontSize,
                lineHeight: labelFontSize + 3,
                paddingHorizontal: spacing[1] / 2,
              },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};


const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  label: {
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
});
