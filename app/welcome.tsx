// app/welcome.tsx
import { useTheme } from "@/src/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { c, radius } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={[styles.brandText, { color: c.primary }]}>MEKOEDU</Text>
        <Text style={[styles.subText, { color: c.textSub }]}>
          Nền tảng học tập & thi trực tuyến hàng đầu
        </Text>
      </View>

      {/* Các nút điều hướng */}
      <View style={styles.buttonContainer}>
        {/* Nút Đăng nhập */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.primary, borderRadius: radius.md }]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>

        {/* Nút Đăng ký */}
        <TouchableOpacity
          style={[styles.button, styles.registerBtn, { borderColor: c.primary, borderRadius: radius.md }]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={[styles.registerText, { color: c.primary }]}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 28,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: "#FFECEF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#EF4444",
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
    gap: 12,
  },
  button: {
    width: "100%",
    height: 48,
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
    fontSize: 15,
  },
  registerText: {
    fontWeight: "bold",
    fontSize: 15,
  },
});
