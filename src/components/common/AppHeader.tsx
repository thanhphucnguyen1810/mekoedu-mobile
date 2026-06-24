// src/components/common/AppHeader.tsx
import { AppConfig } from '@/src/config/appConfig';
import { selectCartCount } from "@/src/store/slices/cartSlice";
import { useTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Badge, Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from "react-redux";
import { CartIconMeasurer } from "../CartIconMeasurer";
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
  placeholder: placeholderProp,
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
  const insets = useSafeAreaInsets();
  
  const cartCount = useSelector(selectCartCount);
  const placeholder = placeholderProp || AppConfig.header.searchPlaceholder;

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
    <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: c.bgSoft }]}>
      <View style={[styles.headerInner, { paddingHorizontal: spacing[2] }]}>
        {/* Nút quay lại */}
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
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
          <AppText variant="body1" weight="600" style={[styles.title, { color: c.text }]}>
            {title}
          </AppText>
        )}

        {/* Khu vực chứa các nút tiện ích bên phải */}
        <View style={[styles.rightActions, { gap: spacing[1] }]}>
          {/* Giỏ hàng */}
          {showCart && (
            <CartIconMeasurer onPress={handleCartPress}>
              <View style={styles.iconWrapper}>
                <Ionicons name="cart-outline" size={24} color={c.text} />
                {cartCount > 0 && (
                  <Badge size={16} style={[styles.badge, { backgroundColor: c.primary }]} textColor="#fff">
                      {cartCount}
                  </Badge>
                )}
              </View>
            </CartIconMeasurer>
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

          {/* Action tùy chỉnh */}
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.rightAction}>
              <AppText style={[styles.rightActionText, { color: c.error || '#ef4444' }]}>
                {rightAction.label}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    // paddingTop sẽ được set dynamic
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  backButton: {
    marginRight: 4,
  },
  searchBar: {
    flex: 1,
    marginRight: 4,
    height: 40,
    elevation: 0,
    borderWidth: 1,
  },
  searchBarInput: {
    fontSize: 14,
    paddingLeft: 0,
    minHeight: 0,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
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
    color: "#fff"
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
