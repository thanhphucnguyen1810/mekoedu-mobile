import { AppHeader } from "@/src/components/common";
import { AppText } from "@/src/components/common/AppText";
import ProductCard from "@/src/components/ProductCard";
import categoriesService from "@/src/services/categoriesService";
import { ICategory } from "@/src/services/category";
import productService, { IProduct } from "@/src/services/productService";
import { useTheme } from "@/src/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const BORDER_RADIUS = 5;

const CoursesNew = () => {
  const { c, spacing } = useTheme();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [parentCategories, setParentCategories] = useState<ICategory[]>([]);
  const [childCategories, setChildCategories] = useState<ICategory[]>([]);

  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedChildName, setSelectedChildName] = useState<string | null>(
    null,
  );
  const [selectedChildParentId, setSelectedChildParentId] = useState<
    number | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);

  const loadProducts = async (
    categoryId?: number | null,
    keyword = searchQuery,
  ) => {
    try {
      setLoading(true);

      const data = await productService.getProducts(1, 20, {
        search: keyword.trim() || undefined,
        categoryId: categoryId ?? undefined,
      });

      setProducts(data);
    } catch (error) {
      console.log("Lỗi lấy sản phẩm", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (text: string) => {
    setSearchQuery(text);

    await loadProducts(selectedCategoryId, text);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoryRes = await categoriesService.getCategories();
        setParentCategories(categoryRes);

        await loadProducts();
      } catch (e) {
        console.log("Lỗi lấy dữ liệu", e);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleParentPress = async (category: ICategory) => {
    if (selectedParentId === category.id) {
      setSelectedParentId(null);
      setChildCategories([]);
      return;
    }

    try {
      setSelectedParentId(category.id);
      setLoadingChild(true);

      const children = await categoriesService.getCategoriesChild(category.id);
      setChildCategories(children);
    } catch (error) {
      console.log("Lỗi lấy danh mục con", error);
      setChildCategories([]);
    } finally {
      setLoadingChild(false);
    }
  };

  const handleSelectAll = async () => {
    setSelectedParentId(null);
    setSelectedCategoryId(null);
    setSelectedChildName(null);
    setSelectedChildParentId(null);
    setChildCategories([]);
    await loadProducts(null, searchQuery);
  };

  const handleSelectChild = async (category: ICategory) => {
    setSelectedCategoryId(category.id);
    setSelectedChildName(category.name);
    setSelectedChildParentId(selectedParentId);
    setSelectedParentId(null);
    setChildCategories([]);
    await loadProducts(category.id, searchQuery);
  };

  const handleProductPress = (product: IProduct) => {
    router.push(`/course/${product.productId!}`);
  };

  const handleAddToCart = (product: IProduct) => {
    console.log("Thêm giỏ hàng:", product.id);
  };

  const handleBuyNow = (product: IProduct) => {
    console.log("Mua ngay:", product.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <AppHeader
        isSearchable
        showNotification
        showCart
        placeholder="Tìm kiếm khóa học..."
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <View style={[styles.filterContainer, { backgroundColor: c.bg }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterList,
            {
              paddingHorizontal: spacing.sm,
              gap: spacing.sm,
            },
          ]}
        >
          <Pressable
            onPress={handleSelectAll}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategoryId === null ? c.primary : c.bgSoft,
                borderColor: selectedCategoryId === null ? c.primary : c.border,
              },
            ]}
          >
            <AppText
              style={[
                styles.filterText,
                {
                  color: selectedCategoryId === null ? "#fff" : c.text,
                },
              ]}
            >
              Tất cả
            </AppText>
          </Pressable>

          {parentCategories.map((category) => {
            const isDropdownOpen = selectedParentId === category.id;
            const hasSelectedChild = selectedChildParentId === category.id;

            const active = isDropdownOpen || hasSelectedChild;
            const label = hasSelectedChild ? selectedChildName : category.name;

            return (
              <Pressable
                key={category.id}
                onPress={() => handleParentPress(category)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? c.primary : c.bgSoft,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
              >
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.filterText,
                    {
                      color: active ? "#fff" : c.text,
                    },
                  ]}
                >
                  {label}
                </AppText>

                <MaterialCommunityIcons
                  name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={active ? "#fff" : c.text}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedParentId !== null && (
          <View style={[styles.dropdown, { backgroundColor: c.bg }]}>
            {loadingChild ? (
              <View style={styles.dropdownLoading}>
                <ActivityIndicator size="small" color={c.primary} />
              </View>
            ) : childCategories.length === 0 ? (
              <AppText style={[styles.emptyText, { color: c.textSub }]}>
                Chưa có danh mục con
              </AppText>
            ) : (
              <View style={styles.dropdownGrid}>
                {childCategories.map((category) => {
                  const active = selectedCategoryId === category.id;

                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => handleSelectChild(category)}
                      style={[
                        styles.dropdownItem,
                        {
                          backgroundColor: active ? c.primary : c.bgSoft,
                        },
                      ]}
                    >
                      <AppText
                        numberOfLines={1}
                        style={[
                          styles.dropdownText,
                          {
                            color: active ? "#fff" : c.text,
                          },
                        ]}
                      >
                        {category.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      {selectedParentId !== null && (
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setSelectedParentId(null);
            setChildCategories([]);
          }}
        />
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: spacing.sm,
            gap: spacing.sm,
          }}
          columnWrapperStyle={{
            gap: spacing.sm,
          }}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={handleProductPress}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          )}
        />
      )}
    </View>
  );
};

export default CoursesNew;

const styles = StyleSheet.create({
  container: { flex: 1 },

  filterContainer: {
    height: 56,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 50,
  },

  filterList: {
    alignItems: "center",
  },

  filterChip: {
    height: 38,
    maxWidth: 160,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },

  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },

  dropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    zIndex: 60,
    paddingTop: 12,
    paddingBottom: 10,
  },

  dropdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },

  dropdownItem: {
    width: "48%",
    height: 54,
    borderRadius: BORDER_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 10,
  },

  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  dropdownLoading: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 14,
  },

  overlay: {
    position: "absolute",
    top: 112,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 20,
  },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
