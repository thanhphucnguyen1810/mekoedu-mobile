// app/(auth)/login.tsx
import { AppButton } from "@/src/components/common";
import { AppConfig } from "@/src/config/appConfig";
import { clearCartCache } from "@/src/services/cartService";
import type { AppDispatch, RootState } from "@/src/store";
import { resetCart } from "@/src/store/slices/cartSlice";
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
  Image
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

export const validatePassword = (password: string) => ({
  length: password.length >= 8,
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  upper: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
});


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

  const loginText = AppConfig.login;
  const store = AppConfig.store;

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await dispatch(liferayLogin({ email, password })).unwrap();
      clearCartCache();
      dispatch(resetCart());
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      console.error("Login error:", err);
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
        <View style={styles.logoContainer}>
          <Image
            source={store.logo}
            style={[styles.logoImage, { width: store.logoWidth, height: store.logoHeight }]}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>{loginText.title}</Text>

        {/* Error banner */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.formGroup}>
          <View style={styles.field}>
            <Text style={styles.label}>{loginText.emailLabel}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={theme.c.textSub} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={email}
                onChangeText={setEmail}
                placeholder={loginText.emailPlaceholder}
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

          <View style={styles.field}>
            <Text style={styles.label}>{loginText.passwordLabel}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.c.textSub} style={styles.inputIconLeft} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.inputWithIcon]}
                value={password}
                onChangeText={setPassword}
                placeholder={loginText.passwordPlaceholder}
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
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={theme.c.textSub}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.forgotRow}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotLink}>{loginText.forgotPassword}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionGroup}>
          <AppButton
            title={loading ? loginText.loginButtonLoading : loginText.loginButton}
            onPress={handleLogin}
            disabled={loading}
            variant="primary"
            fullWidth
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{loginText.noAccount}</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.switchLink}>{loginText.signupLink}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
    flex: { flex: 1, backgroundColor: theme.c.bg },
    container: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.layout.screenHorizontal,
      paddingVertical: theme.spacing.layout.screenVertical,
    },
    logoContainer: { alignItems: "center", marginBottom: theme.spacing[8] },
    logoImage: { width: 300, height: 100 },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors.neutral[900],
      textAlign: "center",
      marginBottom: theme.spacing[6],
      letterSpacing: -0.3,
    },
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
    errorText: { flex: 1, color: Colors.error, fontSize: 13, lineHeight: 18 },
    formGroup: { marginBottom: theme.spacing[6], gap: theme.spacing[2] },
    field: { gap: theme.spacing[1] },
    label: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.c.textSub,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: theme.spacing[2],
    },
    inputWrapper: { position: "relative", justifyContent: "center" },
    inputIconLeft: { position: "absolute", left: 14, zIndex: 1 },
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
    inputWithIcon: { paddingLeft: 40 },
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
    actionGroup: { gap: theme.spacing[4] },
    switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    switchText: { fontSize: 14, color: theme.c.textSub },
    switchLink: { fontSize: 14, fontWeight: "700", color: Colors.primary[500] },
    forgotRow: { alignItems: "flex-end", marginTop: theme.spacing[1] },
    forgotLink: { fontSize: 13, color: Colors.primary[500], fontWeight: "500" },
    // Unused legacy styles kept for safety
    logoGroup: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[3], marginBottom: theme.spacing[4] },
    logoBadge: { width: 46, height: 46, borderRadius: theme.radius.xl, backgroundColor: Colors.primary[500], alignItems: "center", justifyContent: "center" },
    logoLetter: { color: Colors.neutral[0], fontSize: 22, fontWeight: "700" },
    logoText: { fontSize: 26, fontWeight: "800", color: Colors.primary[600], letterSpacing: -0.5 },
    requirements: { marginTop: theme.spacing[2], gap: theme.spacing[1] },
  });
