import { LiferayUserInfo, logoutUser } from "@/src/services/liferayService";
import userService from "@/src/services/userService";
import { useTheme } from "@/src/theme";
import { ENV } from "@/src/types/env";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import {
  Avatar,
  Divider,
  IconButton,
  List,
  Surface,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = ENV.API_URL;

export default function ProfileScreen() {
  const { c, typography, spacing } = useTheme();
  const [userInfo, setUserInfo] = useState<LiferayUserInfo | null>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace("/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  useEffect(() => {
    const userInfo = async () => {
      const response = await userService.getMyUserInfo();
      setUserInfo(response);
    };
    userInfo();
  }, []);

  const dividerStyle = {
    backgroundColor: c.border,
    marginLeft: 42 + spacing.md,
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={[
              {
                backgroundColor: c.primary,
                paddingTop: spacing.layout.screenVertical,
                paddingBottom: spacing.lg,
                paddingHorizontal: spacing.layout.screenHorizontal,
              },
            ]}
          >
            <View
              style={[styles.headerProfile, { gap: spacing.component.iconGap }]}
            >
              <View style={styles.avatarWrapper}>
                {userInfo?.image ? (
                  <Avatar.Image
                    size={70}
                    source={{ uri: `${BASE_URL}${userInfo.image}` }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Icon
                    size={70}
                    icon="account"
                    color={c.bg}
                    style={[styles.avatar, { backgroundColor: c.primary }]}
                  />
                )}
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: userInfo?.hasLoginDate
                        ? "#4CAF50"
                        : c.bg,
                    },
                  ]}
                >
                  <IconButton
                    icon="check"
                    size={16}
                    iconColor={userInfo?.hasLoginDate ? "#fff" : c.primary}
                    style={styles.statusIcon}
                  />
                </View>
              </View>

              <View style={styles.headerText}>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.name,
                    { color: c.bg, ...typography.variants.h4 },
                  ]}
                >
                  {userInfo?.givenName} {userInfo?.familyName}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: c.bg, ...typography.variants.body2 },
                  ]}
                >
                  Tài khoản của bạn
                </Text>
              </View>
            </View>
          </View>

          <Surface
            style={[
              styles.menuGroup,
              {
                backgroundColor: c.bg,
                marginHorizontal: spacing[0],
                marginBottom: spacing.lg,
              },
            ]}
            elevation={0}
          >
            <ProfileItem
              icon="account-outline"
              title="Hồ sơ cá nhân"
              desc="Thông tin cá nhân và liên hệ"
              color={c.primary}
              theme={c}
              typography={typography}
              spacing={spacing}
            />
            <Divider style={dividerStyle} />
            <ProfileItem
              icon="map-marker-outline"
              title="Địa chỉ giao hàng"
              desc="Thông tin giao hàng của bạn"
              color={c.primary}
              theme={c}
              typography={typography}
              spacing={spacing}
            />
            <Divider style={dividerStyle} />
            <ProfileItem
              icon="shopping-outline"
              title="Đơn hàng của tôi"
              desc="Theo dõi đơn hàng và lịch sử mua"
              color={c.primary}
              theme={c}
              typography={typography}
              spacing={spacing}
            />
            <Divider style={dividerStyle} />
            <ProfileItem
              icon="heart-outline"
              title="Yêu thích"
              desc="Sản phẩm bạn đã lưu"
              color={c.primary}
              theme={c}
              typography={typography}
              spacing={spacing}
            />
            <Divider style={dividerStyle} />
            <ProfileItem
              icon="shield-check-outline"
              title="Đổi mật khẩu"
              desc="Bảo mật tài khoản"
              color={c.primary}
              theme={c}
              typography={typography}
              spacing={spacing}
            />
            <Divider style={dividerStyle} />
            <ProfileItem
              icon="help-circle-outline"
              title="Trung tâm hỗ trợ"
              desc="Giúp đỡ và giải đáp"
              color={c.primary}
              theme={c}
              typography={typography}
              spacing={spacing}
            />
          </Surface>

          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutWrapper,
              {
                backgroundColor: c.bgSoft,
                marginHorizontal: spacing.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <IconButton
              icon="logout"
              size={24}
              iconColor={c.primary}
              style={[styles.logoutButton, { backgroundColor: c.primaryLight }]}
            />

            <Text
              style={[
                styles.logoutLabel,
                { color: c.primary, ...typography.variants.button },
              ]}
            >
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ProfileItem({
  icon,
  title,
  desc,
  color,
  theme,
  typography,
  spacing,
}: any) {
  return (
    <List.Item
      title={title}
      description={desc}
      titleStyle={[
        styles.itemTitle,
        { color: theme.text, ...typography.variants.body1 },
      ]}
      descriptionStyle={[
        styles.itemDesc,
        { color: theme.textSub, ...typography.variants.body2 },
      ]}
      style={[
        styles.listItem,
        {
          backgroundColor: theme.bg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
        },
      ]}
      left={() => (
        <Avatar.Icon
          size={42}
          icon={icon}
          color={color}
          style={{ backgroundColor: color + "18" }}
        />
      )}
      right={() => <List.Icon icon="chevron-right" color={theme.textSub} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    borderRadius: 35,
  },
  statusDot: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIcon: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
  },
  alertCard: {
    marginHorizontal: 18,
    marginTop: -24,
    marginBottom: 18,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    lineHeight: 20,
  },
  actionText: {
    fontWeight: "700",
  },
  alertClose: {
    margin: 0,
  },
  menuGroup: {
    borderRadius: 20,
    overflow: "hidden",
  },
  listItem: {
    borderRadius: 16,
  },
  itemTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  itemDesc: {
    marginTop: 2,
    fontSize: 14,
  },
  groupDivider: {
    height: 1,
    marginLeft: 76,
  },
  logoutWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
  },
  logoutButton: {
    margin: 0,
    padding: 0,
    borderRadius: 14,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutLabel: {
    marginLeft: 12,
    fontWeight: "700",
  },
});
