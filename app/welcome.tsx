// app/welcome.tsx
import { useTheme } from "@/src/theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppButton } from "@/src/components/common";

export default function WelcomeScreen() {
  const { c, radius, spacing } = useTheme(); // Thêm spacing
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header Logo */}
      <View style={styles.logoContainer}>
        <View style={[styles.logoBox, { backgroundColor: c.primaryLight }]}>
          <Text style={[styles.logoText, { color: c.primary }]}>M</Text>
        </View>
        <Text style={[styles.brandText, { color: c.primary }]}>MEKOEDU</Text>
        <Text style={[styles.subText, { color: c.textSub }]}>
          Nền tảng học tập & thi trực tuyến hàng đầu
        </Text>
      </View>

      {/* Các nút điều hướng */}
      <View style={[styles.buttonContainer, { gap: spacing.md }]}>
        <AppButton 
          title="Đăng nhập" 
          onPress={() => router.push("/(auth)/login")} 
          variant="primary"
        />
        
        <AppButton 
          title="Đăng ký" 
          onPress={() => router.push("/(auth)/register")} 
          variant="outline"
        />
      </View>
    </View>
  );
}

// Import Typography để dùng
import { Typography } from "@/src/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 32, // Giảm từ 48 xuống 32 vì đã có khung viền
    paddingHorizontal: 24, // Giảm từ 28 xuống 24
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20, // Bo góc tròn hơn
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 42,
    fontWeight: "900",
  },
  brandText: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 12,
  },
  subText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  registerBtn: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  loginText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  registerText: {
    fontWeight: "bold",
  },
});
