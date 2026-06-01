// src/components/common/AppHeader.tsx
import { selectCartCount } from "@/src/store/slices/cartSlice";
import { useTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Badge, Searchbar } from "react-native-paper";
import { useSelector } from "react-redux";
import { AppText } from "./AppText";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  isSearchable?: boolean;
  placeholder?: string;
  
  // Quản lý trạng thái nhập liệu tìm kiếm
  searchQuery?: string;
  onSearchChange?: (text: string) => void;

  // Cấu hình Giỏ hàng
  showCart?: boolean;
  cartRoute?: string;
  onCartPress?: () => void;

  // Cấu hình Thông báo
  showNotification?: boolean;
  notificationCount?: number;
  notificationRoute?: string;
  onNotificationPress?: () => void;

  // Action bên phải (tùy chỉnh)
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
  
  // Lấy số lượng giỏ hàng từ Redux store
  const cartCount = useSelector(selectCartCount);

  // State nội bộ cho ô tìm kiếm
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const isControlled = searchQuery !== undefined && onSearchChange !== undefined;
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
    } else if (cartRoute) {
      router.push(cartRoute);
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else if (notificationRoute) {
      router.push(notificationRoute);
    }
  };

  return (
    <Appbar.Header style={[styles.headerContainer, { backgroundColor: c.bgSoft }]}>
      {/* Nút quay lại */}
      {showBack && (
        <Appbar.BackAction 
          onPress={() => router.back()} 
          color={c.text} 
        />
      )}

      {/* Ô tìm kiếm hoặc Tiêu đề */}
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
            }
          ]}
          inputStyle={[styles.searchBarInput, { color: c.text }]}
          placeholderTextColor={c.textSub}
          iconColor={c.primary}
          selectionColor={c.primary}
        />
      ) : (
        <Appbar.Content 
          title={title} 
          titleStyle={{ color: c.text, fontSize: 18, fontWeight: "600" }} 
        />
      )}

      {/* Khu vực chứa các nút tiện ích bên phải */}
      <View style={[styles.rightActions, { gap: spacing[1] }]}>
        {/* Giỏ hàng */}
        {showCart && (
          <TouchableOpacity onPress={handleCartPress} style={styles.iconWrapper}>
            <Ionicons name="cart-outline" size={24} color={c.text} />
            {cartCount > 0 && (
              <Badge 
                size={16} 
                style={[styles.badge, { backgroundColor: c.primary }]}
              >
                {cartCount}
              </Badge>
            )}
          </TouchableOpacity>
        )}

        {/* Thông báo */}
        {showNotification && (
          <TouchableOpacity onPress={handleNotificationPress} style={styles.iconWrapper}>
            <Ionicons name="notifications-outline" size={24} color={c.text} />
            {externalNotificationCount > 0 && (
              <Badge 
                size={16} 
                style={[styles.badge, { backgroundColor: c.primary }]}
              >
                {externalNotificationCount}
              </Badge>
            )}
          </TouchableOpacity>
        )}

        {/* Action tùy chỉnh (Xóa tất cả,...) */}
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.rightAction}>
            <AppText style={[styles.rightActionText, { color: c.error || '#ef4444' }]}>
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
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchBar: {
    flex: 1,
    marginRight: 4,
    height: 40,
    elevation: 0,
    justifyContent: "center",
    borderWidth: 1,
  },
  searchBarInput: {
    fontSize: 14,
    paddingLeft: 0,
    minHeight: 0,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    position: "relative",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    fontSize: 10,
    fontWeight: "bold",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  rightAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  rightActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
