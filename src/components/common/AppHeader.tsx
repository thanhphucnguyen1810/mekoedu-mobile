// src/components/common/AppHeader.tsx
import { AppDispatch } from "@/src/store";
import { fetchCartItems, selectCartCount } from "@/src/store/slices/cartSlice";
import { useTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Searchbar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { AppText } from "./AppText";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  isSearchable?: boolean;
  placeholder?: string;

  searchQuery?: string;
  onSearchChange?: (text: string) => void;

  showCart?: boolean;
  cartRoute?: string;
  onCartPress?: () => void;

  showNotification?: boolean;
  notificationCount?: number;
  notificationRoute?: string;
  onNotificationPress?: () => void;

  rightAction?: {
    label: string;
    onPress: () => void;
  };
}

export const AppHeader = ({
  title,
  showBack = false,
  isSearchable = false,
  placeholder = "Tìm kiếm khóa học...",
  searchQuery,
  onSearchChange,
  showCart = false,
  cartRoute = "/cart",
  onCartPress,
  showNotification = false,
  notificationCount: externalNotificationCount = 0,
  notificationRoute = "/notifications",
  onNotificationPress,
  rightAction,
}: AppHeaderProps) => {
  const router = useRouter();
  const { c, spacing } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const cartCount = useSelector(selectCartCount);

  useEffect(() => {
    if (showCart) {
      dispatch(fetchCartItems());
    }
  }, [dispatch, showCart]);

  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const isControlled =
    searchQuery !== undefined && onSearchChange !== undefined;

  const currentSearchValue = isControlled ? searchQuery : localSearchQuery;

  const handleSearchTextChange = (text: string) => {
    if (isControlled) {
      onSearchChange?.(text);
    } else {
      setLocalSearchQuery(text);
    }
  };

  const handleCartPress = () => {
    if (onCartPress) {
      onCartPress();
    } else {
      router.push(cartRoute as any);
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push(notificationRoute as any);
    }
  };

  const renderBadge = (count: number) => {
    if (count <= 0) return null;

    return (
      <View style={[styles.badge, { backgroundColor: c.primary }]}>
        <AppText style={styles.badgeText}>{count > 99 ? "99+" : count}</AppText>
      </View>
    );
  };

  return (
    <Appbar.Header
      style={[
        styles.headerContainer,
        {
          backgroundColor: c.bgSoft,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      {showBack && (
        <Appbar.BackAction
          onPress={() => router.back()}
          color={c.text}
          style={styles.backButton}
        />
      )}

      {isSearchable ? (
        <Searchbar
          placeholder={placeholder}
          value={currentSearchValue}
          onChangeText={handleSearchTextChange}
          style={[
            styles.searchBar,
            {
              backgroundColor: c.bg,
              borderColor: c.border,
            },
          ]}
          inputStyle={[styles.searchBarInput, { color: c.text }]}
          placeholderTextColor={c.textSub}
          iconColor={c.primary}
          selectionColor={c.primary}
        />
      ) : (
        <Appbar.Content
          title={title}
          titleStyle={[styles.title, { color: c.text }]}
        />
      )}

      <View style={[styles.rightActions, { gap: spacing.xs ?? 6 }]}>
        {showCart && (
          <TouchableOpacity
            onPress={handleCartPress}
            style={[styles.iconButton, { backgroundColor: c.bg }]}
            activeOpacity={0.75}
          >
            <Ionicons name="cart-outline" size={23} color={c.text} />
            {renderBadge(cartCount)}
          </TouchableOpacity>
        )}

        {showNotification && (
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={[styles.iconButton, { backgroundColor: c.bg }]}
            activeOpacity={0.75}
          >
            <Ionicons name="notifications-outline" size={23} color={c.text} />
            {renderBadge(externalNotificationCount)}
          </TouchableOpacity>
        )}

        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.rightAction}
            activeOpacity={0.75}
          >
            <AppText
              style={[styles.rightActionText, { color: c.error || "#ef4444" }]}
            >
              {rightAction.label}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    elevation: 0,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    marginLeft: -8,
    marginRight: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  searchBar: {
    flex: 1,
    height: 40,
    elevation: 0,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: "center",
  },

  searchBarInput: {
    fontSize: 14,
    minHeight: 0,
    paddingLeft: 0,
  },

  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 2,
    right: 1,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 11,
  },

  rightAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  rightActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
