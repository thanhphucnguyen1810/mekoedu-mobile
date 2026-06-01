// app/index.tsx
import { useTheme } from "@/src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const { c } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const checkAppLaunch = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const hasLaunched = await AsyncStorage.getItem("hasLaunched");

        if (hasLaunched === null) {
          await AsyncStorage.setItem("hasLaunched", "true");
          router.replace("/onboarding");
        } else {
          router.replace("/welcome");
        }
      } catch (error) {
        router.replace("/welcome");
      }
    };

    checkAppLaunch();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Vùng Logo Trung Tâm */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={[styles.brandText, { color: c.primary }]}>MEKOEDU</Text>
        <Text style={[styles.subText, { color: c.textSub }]}>Học tập & Thi trực tuyến</Text>
      </View>

      {/* Footer bản quyền */}
      <Text style={[styles.footerText, { color: c.textSub }]}>
        Powered by Mekosoft • v1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 36,
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
    fontSize: 14,
    fontWeight: "500",
  },
  footerText: {
    fontSize: 11,
  },
});


// test dữ liệu giữa web vs mobile