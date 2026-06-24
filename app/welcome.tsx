// app/welcome.tsx
import { AppButton } from "@/src/components/common";
import { AppConfig } from "@/src/config/appConfig";
import { useTheme } from "@/src/theme";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  const { c, spacing } = useTheme();
  const router = useRouter();
  const welcomeText = AppConfig.welcome;
  const store = AppConfig.store;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.logoContainer}>
        <Image
          source={store.logo}
          style={[{ width: store.logoWidth, height: store.logoHeight }]}
          resizeMode="contain"
          testID="app_logo" // 👈 THÊM DÒNG NÀY
        />
      </View>

      {/* Auth Section */}
      <View style={styles.authSection}>
        <View style={styles.authTitleContainer}>
          <View style={[styles.authLine, { backgroundColor: c.border }]} />
          <Text 
            style={[styles.authTitle, { color: c.textSub }]}
            testID="auth_title" // 👈 THÊM DÒNG NÀY
          >
            {welcomeText.authTitle}
          </Text>
          <View style={[styles.authLine, { backgroundColor: c.border }]} />
        </View>

        <View style={[styles.buttonContainer, { gap: spacing.md }]}>
          <AppButton
            title={welcomeText.loginButton}
            onPress={() => router.push("/(auth)/login")}
            variant="primary"
            testID="login_button" // 👈 THÊM DÒNG NÀY
          />
          <AppButton
            title={welcomeText.registerButton}
            onPress={() => router.push("/(auth)/register")}
            variant="outline"
            testID="register_button" // 👈 THÊM DÒNG NÀY
          />
        </View>

        <View style={styles.supportSection}>
          <Ionicons name="shield-checkmark-outline" size={14} color={c.primary} />
          <Text 
            style={[styles.supportText, { color: c.textSub }]}
            testID="support_text" // 👈 THÊM DÒNG NÀY
          >
            {welcomeText.supportText}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ... styles giữ nguyên

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: "space-around", 
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 200,
  },
  authSection: {
    width: "100%",
    paddingHorizontal: 24,
    flex: 1,
    justifyContent: "center",
  },
  authTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  authLine: {
    flex: 1,
    height: 1,
  },
  authTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  buttonContainer: { width: "100%" },
  socialSection: { marginTop: 32 },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: { flex: 1, height: 0.5 },
  dividerText: { fontSize: 13, marginHorizontal: 16 },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 40,
    marginBottom: 20,
  },
  supportText: { fontSize: 12 },
});
