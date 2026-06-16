/**
 * app/(auth)/login.tsx
 */

import { loginSchema } from "@/src/schema/schema";
import authService from "@/src/services/authService";
import { useTheme } from "@/src/theme";
import { yupResolver } from "@hookform/resolvers/yup";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { showToast } from "../_layout";

const LOGO_URL =
  "http://192.168.1.216:8080/documents/20117/0/logo-do.png/251abcb6-32dc-95f6-29ab-bbed446cf9d7?version=1.0&t=1781164301789";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const passwordInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      await authService.login({
        username: data.email,
        password: data.password,
      });

      showToast("success", "Đăng nhập thành công");
      router.replace("/(tabs)/home");
    } catch (error: any) {
      showToast("error", "Đăng nhập thất bại");

      setError("root", {
        message: error?.message || "Đăng nhập thất bại",
      });
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
        <View style={styles.logoCard}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logoImage}
            contentFit="contain"
            transition={200}
          />
        </View>

        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.sub}>Đăng nhập vào tài khoản của bạn</Text>

        {errors.root?.message ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errors.root.message}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="ten@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                placeholderTextColor={theme.c.textSub}
              />
            )}
          />

          {errors.email?.message ? (
            <Text style={styles.fieldError}>{errors.email.message}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu</Text>

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                ref={passwordInputRef}
                style={[styles.input, errors.password && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(handleLogin)}
                placeholderTextColor={theme.c.textSub}
              />
            )}
          />

          {errors.password?.message ? (
            <Text style={styles.fieldError}>{errors.password.message}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, isSubmitting && styles.btnDisabled]}
          onPress={handleSubmit(handleLogin)}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

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
      shadowOpacity: 0.18,
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
    logoCard: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing[0],
    },
    logoImage: {
      width: 280,
      height: 100,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.c.text,
      textAlign: "center",
      marginBottom: theme.spacing[2],
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
      height: 52,
      fontSize: theme.typography.sizes.md,
      color: theme.c.text,
      ...inputShadow,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    fieldError: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 6,
      fontWeight: "500",
    },
    btnPrimary: {
      backgroundColor: theme.c.primary,
      borderRadius: theme.radius.xl,
      height: 54,
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
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
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
