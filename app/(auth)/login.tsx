/**
 * app/(auth)/login.tsx
 * Màn hình đăng nhập – gọi Liferay OAuth2 Resource Owner Password Grant
 * thông qua loginUser service.
 */

import { loginUser } from "@/src/services/liferayService";
import type { AppDispatch, RootState } from "@/src/store";
import { useTheme } from "@/src/theme";
import { Link, router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.liferayAuth);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // useEffect(() => {
  //   const checkLogin = async () => {
  //     const token = await AsyncStorage.getItem("access_token");

  //     if (token) {
  //       router.replace("/(tabs)/home");
  //     }
  //   };

  //   checkLogin();
  // }, []);

  // Ref để chuyển focus mượt mà từ Email sang Mật khẩu
  const passwordInputRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    try {
      console.log("Email state:", email);
      console.log("Password state:", password);

      if (!email || !password) {
        console.error("Email or password is empty");
        return;
      }

      const response = await loginUser(email, password);
      console.log("Login response:", response);

      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("Login error:", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoDot}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.logoText}>MekoEdu</Text>
        </View>

        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.sub}>Đăng nhập vào tài khoản Liferay của bạn</Text>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ten@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            placeholderTextColor={theme.c.textSub}
          />
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={true} // Giữ nguyên mặc định để hệ thống tự render 1 con mắt duy nhất
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            placeholderTextColor={theme.c.textSub}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.c.bg} size="small" />
          ) : (
            <Text style={styles.btnText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Chưa có tài khoản? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.switchLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Style động theo theme
const createStyles = (theme: ReturnType<typeof useTheme>) => {
  const inputShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: {
      elevation: 1.5,
    },
    default: {},
  });

  const buttonShadow = Platform.select({
    ios: {
      shadowColor: theme.c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
    default: {},
  });

  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    container: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing[6],
      paddingVertical: theme.spacing[8],
    },
    logoWrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing[5],
      gap: theme.spacing[3],
    },
    logoDot: {
      width: 46,
      height: 46,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.c.primary,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: theme.c.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    logoLetter: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "700",
    },
    logoText: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.colors.primary[600],
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.c.text,
      textAlign: "center",
      marginBottom: theme.spacing[2],
      letterSpacing: -0.3,
    },
    sub: {
      fontSize: theme.typography.sizes.sm,
      color: theme.c.textSub,
      textAlign: "center",
      marginBottom: theme.spacing[8],
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: theme.colors.primary[50],
      borderRadius: theme.radius.lg,
      padding: theme.spacing.component.cardPadding,
      marginBottom: theme.spacing[5],
      borderWidth: 1,
      borderColor: theme.colors.primary[200],
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.typography.sizes.sm,
      fontWeight: "500",
      lineHeight: 18,
    },
    field: {
      marginBottom: theme.spacing[4],
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.c.textSub,
      marginBottom: theme.spacing[2],
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    input: {
      backgroundColor: theme.c.bg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.c.border,
      paddingHorizontal: theme.spacing.component.inputPadding,
      height: 50,
      fontSize: theme.typography.sizes.md,
      color: theme.c.text,
      ...inputShadow,
    },
    btnPrimary: {
      backgroundColor: theme.c.primary,
      borderRadius: theme.radius.xl,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing[4],
      marginBottom: theme.spacing[6],
      ...buttonShadow,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: "#fff",
      fontSize: theme.typography.sizes.md,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: theme.spacing[2],
    },
    switchText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.c.textSub,
    },
    switchLink: {
      fontSize: theme.typography.sizes.sm,
      color: theme.c.primary,
      fontWeight: "700",
    },
  });
};
