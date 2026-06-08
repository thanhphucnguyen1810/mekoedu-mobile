import { AppHeader } from "@/src/components/common";
import { AppText } from "@/src/components/common/AppText";
import categoriesService from "@/src/services/categoriesService";

import { ICategory } from "@/src/services/category";
import { useTheme } from "@/src/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const Categories = () => {
  const { c, spacing } = useTheme();

  const [parentCategories, setParentCategories] = useState<ICategory[]>([]);
  const [childCategories, setChildCategories] = useState<ICategory[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [loadingParent, setLoadingParent] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);

  useEffect(() => {
    const loadParentCategories = async () => {
      try {
        const parents = await categoriesService.getCategories();

        setParentCategories(parents);

        if (parents.length > 0) {
          setSelectedParentId(parents[0].id);
          loadChildCategories(parents[0].id);
        }
      } catch (error) {
        console.warn("Load parent categories failed", error);
      } finally {
        setLoadingParent(false);
      }
    };

    loadParentCategories();
  }, []);

  const loadChildCategories = async (parentId: number) => {
    try {
      setLoadingChild(true);
      const children = await categoriesService.getCategoriesChild(parentId);
      setChildCategories(children);
    } catch (error) {
      console.warn("Load child categories failed", error);
      setChildCategories([]);
    } finally {
      setLoadingChild(false);
    }
  };

  const handleParentPress = (parentId: number) => {
    setSelectedParentId(parentId);
    loadChildCategories(parentId);
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <AppHeader showBack title="Danh mục" />

      <View style={[styles.container, { borderTopColor: c.border }]}>
        <View style={[styles.parentBox, { backgroundColor: c.bgSoft }]}>
          {loadingParent ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={c.primary} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {parentCategories.map((category) => {
                const active = category.id === selectedParentId;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleParentPress(category.id)}
                    style={[
                      styles.parentItem,
                      {
                        backgroundColor: active ? c.primary : "transparent",
                        borderBottomColor: c.border,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.parentText,
                        {
                          color: active ? "#fff" : c.text,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {category.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={styles.childBox}>
          {loadingChild ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={c.primary} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.childContent,
                {
                  padding: spacing.sm,
                  gap: spacing.sm,
                },
              ]}
            >
              {childCategories.length === 0 ? (
                <AppText style={styles.emptyText}>Chưa có danh mục con</AppText>
              ) : (
                childCategories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.childCard,
                      {
                        backgroundColor: c.bgSoft,
                      },
                    ]}
                  >
                    <AppText
                      style={[styles.childText, { color: c.text }]}
                      numberOfLines={2}
                    >
                      {category.name}
                    </AppText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

export default Categories;

const ITEM_HEIGHT = 76;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  parentBox: {
    width: 104,
  },

  parentItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  parentText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 17,
  },

  divider: {
    width: StyleSheet.hairlineWidth,
  },

  childBox: {
    flex: 1,
  },

  childContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },

  childCard: {
    width: "48%",
    height: ITEM_HEIGHT,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  childText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },

  emptyText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 24,
    width: "100%",
  },

  loadingBox: {
    paddingTop: 24,
    alignItems: "center",
  },
});
