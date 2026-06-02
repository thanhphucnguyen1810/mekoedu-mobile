import { AppHeader, AppText } from "@/src/components/common";
import { clearAuthTokens } from "@/src/services/tokenService";
import { useTheme } from "@/src/theme";
import { router } from "expo-router";
import { Button, StyleSheet, View } from "react-native";

export default function ProfileScreen() {
  const { c, spacing, typography } = useTheme();

  const logout = async () => {
    clearAuthTokens();
    router.replace("/welcome");
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <AppHeader title="Thông tin cá nhân" />
      <View style={{ padding: spacing.layout.screenHorizontal }}>
        <AppText style={{ color: c.text, ...typography.variants.h3 }}>
          Chào mừng bạn quay trở lại!
        </AppText>
        <Button title="Đăng xuất" onPress={logout}></Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
