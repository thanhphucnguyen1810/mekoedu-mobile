import { ENV } from "@/src/config/env";
import { getMyUserInfo, logoutUser } from "@/src/services/liferay";
import { resetCart } from "@/src/store/slices/cartSlice";
import { useTheme } from "@/src/theme";
import type { UserInfo } from "@/src/types/liferay";
import { Ionicons } from "@expo/vector-icons";
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
import { useDispatch } from "react-redux";

const BASE_URL = ENV.API_URL;

export default function ProfileScreen() {
  const { c, typography, spacing } = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      dispatch(resetCart());
      await logoutUser();
      router.replace("/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await getMyUserInfo();
        setUserInfo(response);
      } catch (error) {
        console.warn("Failed to load user info", error);
      }
    };
    loadUserInfo();
  }, []);

  const dividerStyle = {
    backgroundColor: c.border,
    marginLeft: 42 + spacing.md,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Profile */}
          <View
            style={[
              styles.headerContainer,
              {
                backgroundColor: c.primary,
                paddingTop: spacing.layout.screenVertical + 12,
                paddingBottom: spacing.xl + 8,
                paddingHorizontal: spacing.layout.screenHorizontal,
              },
            ]}
          >
            <View style={[styles.headerProfile, { gap: spacing.component.iconGap }]}>
              <View style={styles.avatarWrapper}>
                {(userInfo as any)?.image ? (
                  <Avatar.Image
                    size={80}
                    source={{ uri: `${BASE_URL}${(userInfo as any).image}` }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Icon
                    size={80}
                    icon="account"
                    color={c.bg}
                    style={[styles.avatar, { backgroundColor: c.primary + '40' }]}
                  />
                )}
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: (userInfo as any)?.hasLoginDate ? "#4CAF50" : c.bg },
                  ]}
                >
                  <IconButton
                    icon="check"
                    size={14}
                    iconColor={(userInfo as any)?.hasLoginDate ? "#fff" : c.primary}
                    style={styles.statusIcon}
                  />
                </View>
              </View>

              <View style={styles.headerText}>
                <Text
                  variant="titleLarge"
                  style={[styles.name, { color: c.bg }]}
                >
                 {userInfo?.familyName} {userInfo?.givenName} 
                </Text>
                <View style={styles.emailRow}>
                  <Ionicons name="mail-outline" size={14} color={c.bg + 'CC'} />
                  <Text style={[styles.email, { color: c.bg + 'CC' }]}>
                    {userInfo?.emailAddress || 'user@example.com'}
                  </Text>
                </View>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: c.bg + '25' }]}>
                    <Ionicons name="shield-checkmark" size={12} color={c.bg} />
                    <Text style={[styles.badgeText, { color: c.bg }]}>
                      Thành viên
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={[styles.statsContainer, { paddingHorizontal: spacing.layout.screenHorizontal }]}>
            <View style={[styles.statCard, { backgroundColor: c.bgSoft, borderColor: c.border }]}>
              <Text style={[styles.statNumber, { color: c.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: c.textSub }]}>Đơn hàng</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: c.bgSoft, borderColor: c.border }]}>
              <Text style={[styles.statNumber, { color: c.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: c.textSub }]}>Yêu thích</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: c.bgSoft, borderColor: c.border }]}>
              <Text style={[styles.statNumber, { color: c.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: c.textSub }]}>Sản phẩm</Text>
            </View>
          </View>

          {/* Menu Items */}
          <Surface
            style={[
              styles.menuGroup,
              { 
                backgroundColor: c.bg, 
                marginHorizontal: spacing.layout.screenHorizontal,
                marginBottom: spacing.lg,
                borderColor: c.border,
              },
            ]}
            elevation={0}
          >
            <ProfileItem 
              icon="person-outline" 
              title="Hồ sơ cá nhân" 
              desc="Thông tin cá nhân và liên hệ" 
              color={c.primary} 
              theme={c} 
              typography={typography} 
              spacing={spacing} 
            />
            <Divider style={dividerStyle} />
            <ProfileItem 
              icon="location-outline" 
              title="Địa chỉ giao hàng" 
              desc="Thông tin giao hàng của bạn" 
              color={c.primary} 
              theme={c} 
              typography={typography} 
              spacing={spacing} 
            />
            <Divider style={dividerStyle} />
            <ProfileItem 
              icon="receipt-outline" 
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
              icon="lock-closed-outline" 
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

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutWrapper,
              { 
                backgroundColor: c.bgSoft, 
                marginHorizontal: spacing.layout.screenHorizontal,
                marginBottom: spacing.xl,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <View style={[styles.logoutIconWrapper, { backgroundColor: c.error + '15' }]}>
              <Ionicons name="log-out-outline" size={22} color={c.error} />
            </View>
            <Text style={[styles.logoutLabel, { color: c.error }]}>
              Đăng xuất
            </Text>
            <Ionicons name="chevron-forward" size={20} color={c.textSub} style={styles.logoutArrow} />
          </TouchableOpacity>

          {/* Version Info */}
          <Text style={[styles.versionText, { color: c.textSub }]}>
            Phiên bản 1.0.0
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ProfileItem({ icon, title, desc, color, theme, typography, spacing }: any) {
  return (
    <List.Item
      title={title}
      description={desc}
      titleStyle={[styles.itemTitle, { color: theme.text }]}
      descriptionStyle={[styles.itemDesc, { color: theme.textSub }]}
      style={[styles.listItem, { backgroundColor: theme.bg, paddingHorizontal: spacing.sm }]}
      left={() => (
        <View style={[styles.iconContainer, { backgroundColor: color + '12' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      )}
      right={() => <Ionicons name="chevron-forward" size={20} color={theme.textSub} />}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: "800",
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  email: {
    fontSize: 13,
    opacity: 0.8,
  },
  badgeRow: {
    flexDirection: "row",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  
  statsContainer: {
    flexDirection: "row",
    marginTop: -28,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },

  menuGroup: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 4,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemTitle: {
    fontWeight: "600",
    fontSize: 15,
  },
  itemDesc: {
    marginTop: 1,
    fontSize: 13,
  },

  logoutWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
  },
  logoutIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoutLabel: {
    flex: 1,
    fontWeight: "600",
    fontSize: 15,
  },
  logoutArrow: {
    marginLeft: 'auto',
  },

  versionText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.5,
    marginTop: 8,
  },
});
