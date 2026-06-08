// app/(auth)/login.tsx
import { AppButton } from "@/src/components/common";
import type { AppDispatch, RootState } from "@/src/store";
import { liferayLogin } from "@/src/store/slices/liferayAuthSlice";
import { useTheme } from "@/src/theme";
import { Colors } from "@/src/theme/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const validatePassword = (password: string) => ({
  length: password.length >= 8,
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  upper: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
});

// ─── Sub-components ───────────────────────────────────────────────────────────

type RequirementItemProps = { text: string; valid: boolean };

const RequirementItem = ({ text, valid }: RequirementItemProps) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
    <Ionicons
      name={valid ? "checkmark-circle" : "close-circle"}
      size={14}
      color={valid ? Colors.success : Colors.error}
    />
    <Text style={{ fontSize: 12, color: valid ? Colors.success : Colors.error }}>
      {text}
    </Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.liferayAuth);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const pwdValid = useMemo(() => validatePassword(password), [password]);
  const showRequirements = passwordFocused && password.length > 0;

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await dispatch(liferayLogin({ email, password })).unwrap();
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.error("Login error:", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoGroup}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.logoText}>MekoEdu</Text>
        </View>

        <Text style={styles.title}>Chào mừng trở lại</Text>

        {/* Error banner */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form Group */}
        <View style={styles.formGroup}>
          {/* Email field */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={theme.c.textSub} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={email}
                onChangeText={setEmail}
                placeholder="ten@example.com"
                placeholderTextColor={theme.c.textSub}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.c.textSub} style={styles.inputIconLeft} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.inputWithIcon]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.c.textSub}
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="done"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(prev => !prev)}
                activeOpacity={0.7}
                accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={theme.c.textSub}
                />
              </TouchableOpacity>
            </View>

            {/* Password requirements */}
            {showRequirements && (
              <View style={styles.requirements}>
                <RequirementItem text="8 ký tự trở lên" valid={pwdValid.length} />
                <RequirementItem text="Ít nhất 1 ký tự đặc biệt" valid={pwdValid.special} />
                <RequirementItem text="Ít nhất 1 chữ hoa" valid={pwdValid.upper} />
                <RequirementItem text="Ít nhất 1 chữ số" valid={pwdValid.number} />
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionGroup}>
          <AppButton
            title={loading ? "Đang xử lý..." : "Đăng nhập"}
            onPress={handleLogin}
            disabled={loading}
            variant="primary"
            fullWidth
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Chưa có tài khoản? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.switchLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles - ĐỒNG NHẤT VỚI REGISTER ─────────────────────────────────────────

const inputShadow = Platform.select({
  ios: { 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 3 
  },
  android: { elevation: 1 },
  default: {},
});

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.c.bg,
    },
    container: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.layout.screenHorizontal,
      paddingVertical: theme.spacing.layout.screenVertical,
    },

    // Logo - giống register
    logoGroup: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing[3],
      marginBottom: theme.spacing[4],
    },
    logoBadge: {
      width: 46,
      height: 46,
      borderRadius: theme.radius.xl,
      backgroundColor: Colors.primary[500],
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: { 
          shadowColor: Colors.primary[600], 
          shadowOffset: { width: 0, height: 3 }, 
          shadowOpacity: 0.25, 
          shadowRadius: 5 
        },
        android: { elevation: 4 },
      }),
    },
    logoLetter: {
      color: Colors.neutral[0],
      fontSize: 22,
      fontWeight: "700",
    },
    logoText: {
      fontSize: 26,
      fontWeight: "800",
      color: Colors.primary[600],
      letterSpacing: -0.5,
    },

    title: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors.neutral[900],
      textAlign: "center",
      marginBottom: theme.spacing[6],
      letterSpacing: -0.3,
    },

    // Error banner
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing[2],
      backgroundColor: Colors.primary[50],
      borderRadius: theme.radius.lg,
      borderWidth: theme.spacing.borderWidth.normal,
      borderColor: Colors.primary[200],
      padding: theme.spacing[3],
      marginBottom: theme.spacing[4],
    },
    errorText: {
      flex: 1,
      color: Colors.error,
      fontSize: 13,
      lineHeight: 18,
    },

    // Form Group
    formGroup: {
      marginBottom: theme.spacing[6],
      gap: theme.spacing[2],
    },
    field: {
      gap: theme.spacing[1],
    },
    label: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.c.textSub,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: theme.spacing[2],
    },

    // Input wrapper - giống register
    inputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    inputIconLeft: {
      position: "absolute",
      left: 14,
      zIndex: 1,
    },
    input: {
      height: 50,
      backgroundColor: theme.c.bg,
      borderRadius: theme.radius.lg,
      borderWidth: theme.spacing.borderWidth.normal,
      borderColor: theme.c.border,
      paddingHorizontal: theme.spacing.component.inputPadding,
      fontSize: 15,
      color: theme.c.text,
      ...inputShadow,
    },
    inputWithIcon: {
      paddingLeft: 40,
    },
    eyeBtn: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 50,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },

    // Password requirements
    requirements: {
      marginTop: theme.spacing[2],
      gap: theme.spacing[1],
    },

    // Actions
    actionGroup: {
      gap: theme.spacing[4],
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    switchText: {
      fontSize: 14,
      color: theme.c.textSub,
    },
    switchLink: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.primary[500],
    },
  });
  