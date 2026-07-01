// app/search.tsx
import { AppHeader } from "@/src/components/common/AppHeader";
import { AppText } from "@/src/components/common/AppText";
import { getProducts } from "@/src/services/liferay";
import { useTheme } from "@/src/theme";
import { CatalogProduct } from "@/src/types/liferay";
import { extractBrands, formatVnd, getDisplayPrice, getProductBrand } from "@/src/utils/searchHelpers";
import { toAbsoluteUrl } from "@/src/utils/url";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function SearchScreen() {
  const { c } = useTheme();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounce gọi API tìm kiếm mỗi khi query đổi ──────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setActiveBrand(null);
      return;
    }

    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getProducts({ search: query.trim(), page: 1, pageSize: 30 });
        setResults(res.items ?? []);
        setActiveBrand(null); // reset filter brand mỗi lần có kết quả mới
      } catch (error) {
        console.warn("[SearchScreen] search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const brandOptions = useMemo(() => extractBrands(results), [results]);

  const displayedResults = useMemo(() => {
    if (!activeBrand) return results;
    return results.filter((p) => getProductBrand(p) === activeBrand);
  }, [results, activeBrand]);

  const handleSelectProduct = (item: CatalogProduct) => {
    router.push({
      pathname: "/course/[id]",
      params: { id: item.productId ?? item.id, source: "liferay" },
    });
  };

  // ── Render 1 dòng kết quả: ảnh trái, giá cam trên, tên dưới ─────────────
  const renderItem = ({ item }: { item: CatalogProduct }) => {
    const { price, promoPrice } = getDisplayPrice(item);
    const finalPrice = promoPrice ?? price;
    const imageUrl = toAbsoluteUrl(item.thumbnail || item.images?.[0]?.src || "");

    return (
      <TouchableOpacity
        style={[styles.resultRow, { borderBottomColor: c.border }]}
        onPress={() => handleSelectProduct(item)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbWrapper}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: c.bgSoft }]} />
          )}
        </View>
        <View style={styles.resultInfo}>
          <AppText variant="body2" style={[styles.resultPrice, { color: c.primary }]}>
            {formatVnd(finalPrice)}
          </AppText>
          <AppText variant="caption" numberOfLines={2} style={[styles.resultName, { color: c.text }]}>
            {item.name}
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Khối lọc theo thương hiệu, hiện ngay dưới thanh search ──────────────
  const renderBrandFilter = () => {
    if (brandOptions.length === 0) return null;
    return (
      <View style={[styles.brandSection, { borderBottomColor: c.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandChipRow}
        >
          {brandOptions.map((brand) => {
            const active = activeBrand === brand;
            return (
              <TouchableOpacity
                key={brand}
                onPress={() => setActiveBrand(active ? null : brand)}
                style={[
                  styles.brandChip,
                  {
                    borderColor: active ? c.primary : c.border,
                    backgroundColor: active ? c.primary + "12" : c.bg,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  style={{ color: active ? c.primary : c.text, fontWeight: active ? "700" : "500" }}
                >
                  {brand}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ── Nội dung chính theo trạng thái ───────────────────────────────────────
  const renderBody = () => {
    if (!query.trim()) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="search-outline" size={32} color={c.textSub} />
          <AppText variant="body" style={{ color: c.textSub }}>
            Nhập từ khoá để tìm sản phẩm
          </AppText>
        </View>
      );
    }

    if (loading && results.length === 0) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      );
    }

    if (displayedResults.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="sad-outline" size={32} color={c.textSub} />
          <AppText variant="body" style={{ color: c.textSub }}>
            Không tìm thấy sản phẩm phù hợp
          </AppText>
        </View>
      );
    }

    return (
      <FlatList
        data={displayedResults}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <AppHeader
        showBack
        isSearchable
        placeholder="Tìm kiếm sản phẩm..."
        searchQuery={query}
        onSearchChange={setQuery}
        autoFocus
      />
      {renderBrandFilter()}
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },

  brandSection: {
    borderBottomWidth: 0.5,
    paddingVertical: 10,
  },
  brandChipRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
  },
  thumbWrapper: {
    width: 56,
    height: 56,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  thumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultPrice: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  resultName: {
    fontSize: 13,
    lineHeight: 18,
  },
});
