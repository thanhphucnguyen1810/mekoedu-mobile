// app/index.tsx
import { useTheme } from "@/src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const { c } = useTheme();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const checkAppLaunch = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
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
      <View style={[styles.circleDecor, styles.circle1, { borderColor: c.textSub + "10" }]} />
      <View style={[styles.circleDecor, styles.circle2, { borderColor: c.textSub + "05" }]} />

      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer, 
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.logoBox}>
            <Image
              source={require("@/src/assets/images/logo-icon.jpg")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>          
          <View style={[styles.badge, { backgroundColor: c.textSub + "15" }]}>
            <Text style={[styles.subText, { color: c.text }]}>Chất lượng hàng đầu, dịch vụ tận tâm</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer bản quyền chỉn chu */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: c.textSub }]}>
          Powered by <Text style={{ fontWeight: "600" }}>Mekosoft</Text>
        </Text>
        <Text style={[styles.versionText, { color: c.textSub + "80" }]}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden", // Để giấu các vòng tròn trang trí tràn viền
  },
  // Style cho các vòng tròn background
  circleDecor: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  circle1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.4,
    left: -width * 0.1,
  },
  circle2: {
    width: width * 1.5,
    height: width * 1.5,
    bottom: -width * 0.6,
    right: -width * 0.3,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 24, // Bo tròn mềm mại kiểu Modern Squircle
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    // Hiệu ứng đổ bóng chuẩn UI cao cấp
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4, // Dành cho Android
  },
  logoImage: {
    width: "70%",
    height: "70%",
  },
  brandText: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 40,
    zIndex: 2,
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
