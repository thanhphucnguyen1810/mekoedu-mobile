import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { useTheme } from '@/src/theme';

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

interface CategoryGridProps {
  categories: readonly Category[];
  onCategoryPress?: (id: string) => void;
}

// Breakpoints cho responsive
const BREAKPOINTS = {
  phone: 480,
  tablet: 768,
  tabletLg: 1024,
};

function getVisibleItemCount(width: number): number {
  if (width >= BREAKPOINTS.tabletLg) return 8.5;
  if (width >= BREAKPOINTS.tablet) return 6.5;
  if (width >= BREAKPOINTS.phone) return 6.2;
  return 5.2;
}

function getIconBoxSize(width: number): number {
  if (width >= BREAKPOINTS.tabletLg) return 64;
  if (width >= BREAKPOINTS.tablet) return 58;
  if (width >= BREAKPOINTS.phone) return 56;
  return 52;
}

function getLabelFontSize(width: number): number {
  if (width >= BREAKPOINTS.tablet) return 12;
  return 11;
}

export const CategoryGrid = ({ categories, onCategoryPress }: CategoryGridProps) => {
  const { width: windowWidth } = useWindowDimensions();
  
  const { c, colors, radius, spacing, typography } = useTheme();

  const visibleCount = getVisibleItemCount(windowWidth);
  const iconBoxSize = getIconBoxSize(windowWidth);
  const labelFontSize = getLabelFontSize(windowWidth);

  const availableWidth = windowWidth - spacing.layout.screenHorizontal * 2;
  const itemWidth = availableWidth / visibleCount;

  const CategoryImage = ({ url, size, borderRadius }: { url: string; size: number; borderRadius: number }) => {
    const [hasError, setHasError] = React.useState(false);

    if (!url || hasError) {
      return (
        <View
          style={[
            styles.fallbackImage,
            {
              width: size,
              height: size,
              borderRadius,
              backgroundColor: colors.neutral[200],
            },
          ]}
        >
          <Text style={{ color: colors.neutral[500], fontSize: size * 0.3 }}>
            🖼️
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri: url }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius,
          }
        ]}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  };

  return (
    <FlatList
      data={categories}
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
          style={[styles.item, { width: itemWidth, gap: spacing.sm - 2 }]}
          onPress={() => onCategoryPress?.(item.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={item.name}
        >
          <View
            style={[
              styles.imageBox,
              {
                width: iconBoxSize,
                height: iconBoxSize,
                borderRadius: radius.md,
                backgroundColor: colors.primary[100],
                shadowColor: colors.neutral[1000],
              },
            ]}
          >
            <CategoryImage 
              url={item.imageUrl} 
              size={iconBoxSize} 
              borderRadius={radius.md}
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
  imageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  image: {
    // Style sẽ được override inline
  },
  fallbackImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
});
