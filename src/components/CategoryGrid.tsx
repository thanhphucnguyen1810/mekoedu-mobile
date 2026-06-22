import { useLiferayCategories } from "@/src/hooks/useLiferayCatalog";
import { Colors, Spacing, useTheme } from "@/src/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { AppConfig } from "../config/appConfig";

const ROOT_PADDING = 0; 
const VISUAL_PAD = 0; 

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  numberOfTaxonomyCategories?: number;
}

interface CategoryGridProps {
  categories?: readonly Category[];
  onCategoryPress?: (id: string) => void;
  autoFetch?: boolean;
  activeCategoryId?: string;
  showAllOption?: boolean;
  onAllPress?: () => void;
}

const BREAKPOINTS = { phone: 480, tablet: 768, tabletLg: 1024 };

function getVisibleItemCount(width: number) {
  if (width >= BREAKPOINTS.tabletLg) return 8.5;
  if (width >= BREAKPOINTS.tablet) return 6.5;
  if (width >= BREAKPOINTS.phone) return 6.2;
  return 5.2;
}

function getIconBoxSize(width: number) {
  if (width >= BREAKPOINTS.tabletLg) return 64;
  if (width >= BREAKPOINTS.tablet) return 58;
  if (width >= BREAKPOINTS.phone) return 56;
  return 52;
}

const CategoryImage = ({
  url, size, borderRadius, name, colors,
}: {
  url: string; size: number; borderRadius: number; name: string; colors: any;
}) => {
  const [hasError, setHasError] = React.useState(false);
  const hasUrl = !!url && url.length > 0;

  if (!hasUrl || hasError) {
    return (
      <View
        style={[
          styles.fallbackImage,
          { width: size, height: size, borderRadius, backgroundColor: colors.primary[100] },
        ]}
      >
        <Text style={{ color: colors.primary[500], fontSize: size * 0.38, fontWeight: "800" }}>
          {(name?.[0] ?? "?").toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius }}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
};

export const CategoryGrid = ({
  categories: propCategories,
  onCategoryPress,
  autoFetch = true,
  activeCategoryId,
  showAllOption = false,
  onAllPress,
}: CategoryGridProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const { c, colors, typography } = useTheme();

  const { categories: fetchedCategories, loading, error } = useLiferayCategories();

  const rawCategories = propCategories ?? (autoFetch ? fetchedCategories : []);
  const isLoading = autoFetch && !propCategories && loading;

  const config = AppConfig.home.categories;

  // Tính lại không gian thực sự bên trong (sau khi trừ ROOT_PADDING)
  const availableWidth = windowWidth - (ROOT_PADDING * 2);

  const visibleCount = getVisibleItemCount(windowWidth);
  const iconBoxSize = getIconBoxSize(windowWidth);
  const labelFontSize = windowWidth >= BREAKPOINTS.tablet ? 12 : 11;
  
  // Tính độ rộng của mỗi item
  const itemWidth = availableWidth / visibleCount;

  const handleCategoryPress = (categoryId: string, isAllButton: boolean = false) => {
    if (isAllButton) {
      // Nếu là nút "Tất cả"
      if (onAllPress) {
        onAllPress();
      } else {
        router.push("/category");
      }
    } else {
      // Nếu là category bình thường
      if (onCategoryPress) {
        onCategoryPress(categoryId);
      } else {
        router.push(`/category/${categoryId}`);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer]}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  }

  if (error && !propCategories) {
    return (
      <View style={[styles.errorContainer]}>
        <Text style={{ color: colors.error }}>{config.errorMessage}</Text>
      </View>
    );
  }

  let displayData: any[] = [...rawCategories];
  if (showAllOption) {
    displayData = [
      { id: "ALL_CATEGORY_KEY", name: config.allLabel, imageUrl: "", isAllButton: true },
      ...displayData,
    ];
  }

  if (displayData.length === 0) return null;

  const renderItem = ({ item }: { item: any }) => {
    const isAllButton = item.isAllButton === true;
    const isActive = isAllButton ? !activeCategoryId : String(item.id) === String(activeCategoryId);

    const tileBackground = isAllButton ? colors.primary[500] : c.bgSoft;
    const tileBorderColor = isAllButton ? "transparent" : isActive ? colors.primary[500] : c.border;
    const tileBorderWidth = isAllButton ? 0 : isActive ? 2 : 1;
    const tileRadius = 18;

    return (
      <TouchableOpacity
        style={[styles.itemWrapper, { width: itemWidth }]}
        onPress={() => handleCategoryPress(String(item.id), isAllButton)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.tile,
            {
              width: iconBoxSize,
              height: iconBoxSize,
              borderRadius: tileRadius,
              backgroundColor: tileBackground,
              borderColor: tileBorderColor,
              borderWidth: tileBorderWidth,
            },
          ]}
        >
          {isAllButton ? (
            <MaterialCommunityIcons name="apps" size={iconBoxSize * 0.45} color="#FFFFFF" />
          ) : (
            <CategoryImage
              url={item.imageUrl}
              size={iconBoxSize - (isActive ? 4 : 0)}
              borderRadius={tileRadius - 2}
              name={item.name}
              colors={colors}
            />
          )}
        </View>

        <Text
          style={[
            typography.variants.caption,
            styles.label,
            {
              color: isActive ? colors.primary[500] : c.text,
              fontSize: labelFontSize,
              lineHeight: labelFontSize + 3,
              fontWeight: isActive ? "700" : "500",
              marginTop: Spacing.xs,
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={displayData}
      keyExtractor={(item) => {
        if (item.isAllButton) {
          return 'all-categories-button';
        }
        return `category-${String(item.id)}`;
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
      ListHeaderComponent={() => <View style={{ width: VISUAL_PAD }} />}
      ListFooterComponent={() => <View style={{ width: VISUAL_PAD }} />}
      contentContainerStyle={{
        paddingVertical: Spacing.sm,
      }}
      snapToInterval={itemWidth}
      decelerationRate="fast"
      renderItem={renderItem}
    />
  );
};

export default CategoryGrid;

const styles = StyleSheet.create({
  itemWrapper: { alignItems: "center" },
  tile: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: Colors.neutral[950],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  fallbackImage: { alignItems: "center", justifyContent: "center" },
  label: { textAlign: "center", width: "100%" },
  loaderContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  errorContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
});
