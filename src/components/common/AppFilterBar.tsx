import { useTheme } from "@/src/theme";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Menu } from "react-native-paper";

// Import trực tiếp dữ liệu có sẵn của bạn để tái sử dụng
import { HOME_DATA } from "@/src/components/Home/HomeRegistry";

// Bộ lọc giá tiền (vẫn giữ tĩnh vì HOME_DATA hiện tại chưa có thông tin khoảng giá)
const PRICE_OPTIONS = [
  { id: "all", label: "Giá Tiền" },
  { id: "under_500", label: "Dưới 500k" },
  { id: "500_1000", label: "500k - 1M" },
  { id: "1000_2000", label: "1M - 2M" },
  { id: "above_2000", label: "Trên 2M" },
];

// Bộ lọc đánh giá theo số sao (giữ tĩnh)
const RATING_OPTIONS = [
  { id: "all", label: "Đánh giá" },
  { id: "5", label: "5 sao" },
  { id: "4_above", label: ">= 4 sao" },
  { id: "3_above", label: ">= 3 sao" },
];

interface AppFilterBarProps {
  onPriceSelect?: (id: string, label: string) => void;
  onRatingSelect?: (id: string, label: string) => void;
  onCategorySelect?: (id: string, label: string) => void;
  onTeacherSelect?: (id: string, label: string) => void;
  onAdvancedFilterPress?: () => void;

  categories?: Array<{ id: string; name: string }>;
  teachers?: Array<{ id: string; name: string }>;

  isAdvancedActive?: boolean;
}

export const AppFilterBar = ({
  onPriceSelect,
  onRatingSelect,
  onCategorySelect,
  onTeacherSelect,
  onAdvancedFilterPress,
  categories,
  teachers,
  isAdvancedActive = false,
}: AppFilterBarProps) => {
  const { c, spacing, radius, typography } = useTheme();

  // State điều khiển đóng/mở menu của từng cột
  const [priceMenuVisible, setPriceMenuVisible] = useState(false);
  const [ratingMenuVisible, setMenuRatingVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [teacherMenuVisible, setTeacherMenuVisible] = useState(false);

  // 1. TỰ ĐỘNG XỬ LÝ DANH MỤC TỪ HOME_DATA
  const dynamicCategoryList = useMemo(() => {
    const rawList = categories || HOME_DATA.categories;

    const unique = rawList.reduce((acc, current) => {
      const exists = acc.find((item) => item.name === current.name);
      if (!exists && current.id !== "more") {
        return acc.concat([current]);
      }
      return acc;
    }, [] as typeof rawList);

    return unique.map((item) =>
      item.id === "all" ? { ...item, name: "Danh mục" } : item
    );
  }, [categories]);

  // 2. TỰ ĐỘNG TRÍCH XUẤT GIẢNG VIÊN (brandName) TỪ SẢN PHẨM TRONG HOME_DATA
  const dynamicTeacherList = useMemo(() => {
    if (teachers) {
      return [{ id: "all", name: "Giảng viên" }, ...teachers.filter((t) => t.id !== "all")];
    }

    // Lọc ra danh sách các thương hiệu (brandName) không trùng lặp từ HOME_DATA.products
    const uniqueBrands = Array.from(
      new Set(HOME_DATA.products.map((p) => p.brandName))
    );

    const list = uniqueBrands.map((brand) => ({
      id: brand.toLowerCase(),
      name: brand,
    }));

    return [{ id: "all", name: "Giảng viên" }, ...list];
  }, [teachers]);

  // Khởi tạo State ban đầu dựa trên phần tử đầu tiên của các danh sách động
  const [selectedPrice, setSelectedPrice] = useState(PRICE_OPTIONS[0]);
  const [selectedRating, setSelectedRating] = useState(RATING_OPTIONS[0]);
  const [selectedCategory, setSelectedCategory] = useState(dynamicCategoryList[0]);
  const [selectedTeacher, setSelectedTeacher] = useState(dynamicTeacherList[0]);

  const renderDropdownMenu = (
    visible: boolean,
    setVisible: (v: boolean) => void,
    selectedItem: { id: string; label?: string; name?: string },
    options: Array<{ id: string; label?: string; name?: string }>,
    onSelect: (item: any) => void
  ) => {
    const labelText = selectedItem.label || selectedItem.name || "";
    const isDefault = selectedItem.id === "all";
    const activeColor = isDefault ? c.text : c.primary;

    return (
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => setVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                typography.variants.caption,
                { color: activeColor, fontWeight: !isDefault ? "700" : "400" }
              ]}
              numberOfLines={1}
            >
              {labelText}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={16}
              color={activeColor}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        }
        contentStyle={{ backgroundColor: c.bg, borderRadius: radius.md }}
      >
        {options.map((opt) => (
          <Menu.Item
            key={opt.id}
            onPress={() => {
              onSelect(opt);
              setVisible(false);
            }}
            title={opt.label || opt.name}
            titleStyle={[
              typography.variants.caption,
              { color: opt.id === selectedItem.id ? c.primary : c.text }
            ]}
          />
        ))}
      </Menu>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.bgSoft,
          borderRadius: radius.md,
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[3],
        }
      ]}
    >
      <View style={styles.dropdownsContainer}>
        {/* 1. Bộ lọc Giá */}
        {renderDropdownMenu(
          priceMenuVisible,
          setPriceMenuVisible,
          selectedPrice,
          PRICE_OPTIONS,
          (item) => {
            setSelectedPrice(item);
            onPriceSelect?.(item.id, item.label);
          }
        )}

        {/* 2. Bộ lọc Sao */}
        {renderDropdownMenu(
          ratingMenuVisible,
          setMenuRatingVisible,
          selectedRating,
          RATING_OPTIONS,
          (item) => {
            setSelectedRating(item);
            onRatingSelect?.(item.id, item.label);
          }
        )}

        {/* 3. Bộ lọc Danh mục (Động từ HOME_DATA.categories) */}
        {renderDropdownMenu(
          categoryMenuVisible,
          setCategoryMenuVisible,
          selectedCategory,
          dynamicCategoryList,
          (item) => {
            setSelectedCategory(item);
            onCategorySelect?.(item.id, item.name || item.label);
          }
        )}

        {/* 4. Bộ lọc Giảng viên (Động từ HOME_DATA.products) */}
        {renderDropdownMenu(
          teacherMenuVisible,
          setTeacherMenuVisible,
          selectedTeacher,
          dynamicTeacherList,
          (item) => {
            setSelectedTeacher(item);
            onTeacherSelect?.(item.id, item.name || item.label);
          }
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: c.border }]} />

      <TouchableOpacity
        style={styles.advancedFilterButton}
        onPress={onAdvancedFilterPress}
        activeOpacity={0.7}
      >
        <Feather
          name="filter"
          size={18}
          color={isAdvancedActive ? c.primary : c.text}
        />
        <Text
          style={[
            typography.variants.overline,
            {
              color: isAdvancedActive ? c.primary : c.text,
              marginTop: 2,
              fontWeight: "bold"
            }
          ]}
        >
          Lọc
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dropdownsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  arrowIcon: {
    marginLeft: 1,
  },
  divider: {
    width: 1,
    height: 24,
    opacity: 0.6,
  },
  advancedFilterButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 12,
  },
});
