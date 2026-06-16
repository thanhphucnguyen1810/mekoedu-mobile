import { AppHeader } from "@/src/components/common";
import { AppText } from "@/src/components/common/AppText";
import ProductCard from "@/src/components/ProductCard";
import categoriesService, { ICategory } from "@/src/services/categoriesService";
import productService, { IProduct } from "@/src/services/productService";
import { useTheme } from "@/src/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const BORDER_RADIUS = 5;

const Courses = () => {
  const { c, spacing } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();

  // Ép kiểu ID từ router về Number một cách an toàn
  const routeCategoryId = useMemo(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    return id ? Number(id) : null;
  }, [params.id]);

  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [parentCategories, setParentCategories] = useState<ICategory[]>([]);
  const [childCategories, setChildCategories] = useState<ICategory[]>([]);

  const [openedParentId, setOpenedParentId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    routeCategoryId,
  );

  // Lưu trữ danh mục con đang được chọn theo ID của danh mục cha tương ứng
  // Cấu trúc: { [parentId: number]: ICategory }
  const [selectedChildMap, setSelectedChildMap] = useState<
    Record<number, ICategory>
  >({});

  const [loading, setLoading] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);

  // Hàm tải sản phẩm dựa theo ID danh mục và từ khóa tìm kiếm
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
      setProducts(data ?? []);
    } catch (error) {
      console.log("Lỗi lấy sản phẩm", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tải danh mục con tách riêng để tái sử dụng
  const fetchChildCategories = async (parentId: number) => {
    try {
      setLoadingChild(true);
      const children = await categoriesService.getCategoriesChild(parentId);
      setChildCategories(children ?? []);
    } catch (error) {
      console.log("Lỗi lấy danh mục con", error);
      setChildCategories([]);
    } finally {
      setLoadingChild(false);
    }
  };

  // 1. Chỉ lấy danh mục cha MỘT LẦN DUY NHẤT khi component được khởi tạo
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryRes = await categoriesService.getCategories();
        setParentCategories(categoryRes ?? []);
      } catch (error) {
        console.log("Lỗi lấy danh mục", error);
      }
    };
    loadCategories();
  }, []);

  // 2. Chỉ đồng bộ việc chọn danh mục & tải sản phẩm khi chuyển trang sang (GIỮ ĐÓNG MENU CON)
  useEffect(() => {
    setSearchQuery("");
    setSelectedCategoryId(routeCategoryId);
    loadProducts(routeCategoryId, "");

    // Không tự động mở menu con, luôn reset về trạng thái đóng khi nhận route mới
    setOpenedParentId(null);
    setChildCategories([]);
    setSelectedChildMap({});
  }, [routeCategoryId]);

  const handleSearchChange = async (text: string) => {
    setSearchQuery(text);
    await loadProducts(selectedCategoryId, text);
  };

  // 3. Khi nhấn vào danh mục cha
  const handleParentPress = async (category: ICategory) => {
    const catId = Number(category.id);

    // NẾU DANH MỤC CHA NÀY ĐÃ CÓ DANH MỤC CON ĐƯỢC CHỌN:
    // Nhấn vào lần nữa sẽ RESET đổi lại hiển thị danh mục cha ban đầu và lọc theo cha.
    if (selectedChildMap[catId]) {
      setSelectedChildMap((prev) => {
        const updated = { ...prev };
        delete updated[catId]; // Xóa danh mục con đã chọn khỏi bộ nhớ lưu trữ
        return updated;
      });

      setSelectedCategoryId(catId);
      setOpenedParentId(null);
      setChildCategories([]);
      await loadProducts(catId, searchQuery);
      return;
    }

    // Luồng xử lý đóng/mở dropdown bình thường khi chưa chọn danh mục con trước đó
    setSelectedCategoryId(catId);
    await loadProducts(catId, searchQuery);

    if (openedParentId === catId) {
      setOpenedParentId(null);
      setChildCategories([]);
      return;
    }

    // Mở dropdown và tải các danh mục con lên
    setOpenedParentId(catId);
    await fetchChildCategories(catId);
  };

  // 4. Khi nhấn nút "Tất cả" -> Reset mọi bộ lọc và text hiển thị
  const handleSelectAll = async () => {
    setOpenedParentId(null);
    setSelectedCategoryId(null);
    setChildCategories([]);
    setSelectedChildMap({});
    setSearchQuery("");
    await loadProducts(null, "");
  };

  // 5. Khi người dùng CHỦ ĐỘNG chọn danh mục con trong dropdown
  const handleSelectChild = async (childCategory: ICategory) => {
    const childCatId = Number(childCategory.id);

    if (openedParentId !== null) {
      // Lưu lại thông tin danh mục con đã chọn tương ứng với danh mục cha hiện tại
      setSelectedChildMap((prev) => ({
        ...prev,
        [openedParentId]: childCategory,
      }));
    }

    setSelectedCategoryId(childCatId);
    setOpenedParentId(null);
    setChildCategories([]);
    await loadProducts(childCatId, searchQuery);
  };

  const handleProductPress = (product: IProduct) => {
    router.push(`/course/${product.productId ?? product.id}`);
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
            const catId = Number(category.id);
            const isDropdownOpen = openedParentId === catId;

            // Tìm xem danh mục cha này có danh mục con nào đang được lưu không
            const selectedChild = selectedChildMap[catId];

            // Trạng thái active sáng màu:
            // Hoặc là chính ID cha được chọn, hoặc là ID của danh mục con thuộc cha này đang được chọn
            const active =
              Number(selectedCategoryId) === catId ||
              (selectedChild &&
                Number(selectedCategoryId) === Number(selectedChild.id));

            // Text hiển thị: Nếu có danh mục con được chọn thì hiển thị tên con, ngược lại hiển thị tên cha
            const displayTitle = selectedChild
              ? selectedChild.name
              : category.name;

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
                  {displayTitle}
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

        {openedParentId !== null && (
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
                  const catId = Number(category.id);
                  const active = Number(selectedCategoryId) === catId;

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

      {openedParentId !== null && (
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setOpenedParentId(null);
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
          ListEmptyComponent={
            <View style={styles.emptyProductBox}>
              <AppText style={{ color: c.textSub }}>Không có sản phẩm</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ width: "48%" }}>
              <ProductCard item={item} onPress={handleProductPress} />
            </View>
          )}
        />
      )}
    </View>
  );
};

export default Courses;

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

  emptyProductBox: {
    paddingVertical: 40,
    alignItems: "center",
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
