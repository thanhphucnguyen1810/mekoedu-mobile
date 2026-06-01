/**
 * app/(auth)/register.tsx
 */

import type { AppDispatch, RootState } from "@/src/store";
import { clearError, liferayRegister } from "@/src/store/slices/liferayAuthSlice";
import { useTheme } from "@/src/theme";
import { Link, router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function RegisterScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.liferayAuth);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Refs để chuyển focus mượt mà
  const givenNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [form, setForm] = useState({
    givenName: "",
    familyName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [localErrors, setLocalErrors] = useState<Partial<typeof form>>({});

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.familyName.trim()) errs.familyName = "Vui lòng nhập họ";
    if (!form.givenName.trim()) errs.givenName = "Vui lòng nhập tên";
    if (!form.email.includes("@")) errs.email = "Email không hợp lệ";
    if (form.password.length < 8) {
      errs.password = "Tối thiểu 8 ký tự";
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = "Cần có ít nhất 1 chữ hoa";
    } else if (!/[0-9]/.test(form.password)) {
      errs.password = "Cần có ít nhất 1 chữ số";
    }
    if (form.confirm !== form.password) errs.confirm = "Mật khẩu không khớp";
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    dispatch(clearError());

    const result = await dispatch(
      liferayRegister({
        givenName: form.givenName.trim(),
        familyName: form.familyName.trim(),
        emailAddress: form.email.trim(),
        password: form.password,
      })
    );

    if (liferayRegister.fulfilled.match(result)) {
      Alert.alert(
        "Thành công! 🎉",
        "Vui lòng đăng nhập để tiếp tục.",
        [{ text: "Đăng nhập ngay", onPress: () => router.replace("/(auth)/login") }]
      );
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

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.sub}>Đăng ký để bắt đầu hành trình học tập</Text>

        {/* API error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Họ + Tên */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1.2 }]}>
            <Text style={styles.label}>Họ</Text>
            <TextInput
              style={[styles.input, localErrors.familyName && styles.inputErr]}
              value={form.familyName}
              onChangeText={set("familyName")}
              placeholder="Nguyễn"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => givenNameRef.current?.focus()}
              blurOnSubmit={false}
              placeholderTextColor={theme.c.textSub}
            />
            {localErrors.familyName && <Text style={styles.errMsg}>{localErrors.familyName}</Text>}
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Tên</Text>
            <TextInput
              ref={givenNameRef}
              style={[styles.input, localErrors.givenName && styles.inputErr]}
              value={form.givenName}
              onChangeText={set("givenName")}
              placeholder="An"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              placeholderTextColor={theme.c.textSub}
            />
            {localErrors.givenName && <Text style={styles.errMsg}>{localErrors.givenName}</Text>}
          </View>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email công việc</Text>
          <TextInput
            ref={emailRef}
            style={[styles.input, localErrors.email && styles.inputErr]}
            value={form.email}
            onChangeText={set("email")}
            placeholder="ten@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            placeholderTextColor={theme.c.textSub}
          />
          {localErrors.email && <Text style={styles.errMsg}>{localErrors.email}</Text>}
        </View>

        {/* Mật khẩu */}
        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            ref={passwordRef}
            style={[styles.input, localErrors.password && styles.inputErr]}
            value={form.password}
            onChangeText={set("password")}
            placeholder="••••••••"
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            blurOnSubmit={false}
            placeholderTextColor={theme.c.textSub}
          />
          {localErrors.password && <Text style={styles.errMsg}>{localErrors.password}</Text>}
        </View>

        {/* Xác nhận mật khẩu */}
        <View style={styles.field}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            ref={confirmRef}
            style={[styles.input, localErrors.confirm && styles.inputErr]}
            value={form.confirm}
            onChangeText={set("confirm")}
            placeholder="••••••••"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            placeholderTextColor={theme.c.textSub}
          />
          {localErrors.confirm && <Text style={styles.errMsg}>{localErrors.confirm}</Text>}
        </View>

        {/* Hint Policy */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Mật khẩu yêu cầu ít nhất 8 ký tự, bao gồm chữ hoa và chữ số.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.c.bg} size="small" />
          ) : (
            <Text style={styles.btnText}>Đăng ký tài khoản</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <Text style={styles.termsLink}>Điều khoản</Text> &{" "}
          <Text style={styles.termsLink}>Bảo mật</Text> của MekoEdu.
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.switchLink}>Đăng nhập</Text>
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: {
      elevation: 1.5,
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
      width: 44,
      height: 44,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.c.primary,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: theme.c.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        android: { elevation: 3 },
      }),
    },
    logoLetter: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
    },
    logoText: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.colors.primary[600],
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.c.text,
      textAlign: "center",
      marginBottom: theme.spacing[1],
    },
    sub: {
      fontSize: theme.typography.sizes.sm,
      color: theme.c.textSub,
      textAlign: "center",
      marginBottom: theme.spacing[7],
    },
    errorBox: {
      backgroundColor: theme.colors.primary[50],
      borderRadius: theme.radius.lg,
      padding: theme.spacing.component.cardPadding,
      marginBottom: theme.spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.primary[200],
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.typography.sizes.sm,
      fontWeight: "500",
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing[3],
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
      letterSpacing: 0.5,
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
    inputErr: {
      borderColor: theme.colors.error,
    },
    errMsg: {
      fontSize: 11,
      color: theme.colors.error,
      marginTop: theme.spacing[1],
      marginLeft: 2,
    },
    hintContainer: {
      marginBottom: theme.spacing[6],
      paddingHorizontal: 4,
    },
    hintText: {
      fontSize: 12,
      color: theme.c.textSub,
      fontStyle: "italic",
      lineHeight: 16,
    },
    btnPrimary: {
      backgroundColor: theme.c.primary,
      borderRadius: theme.radius.xl,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing[4],
      ...Platform.select({
        ios: {
          shadowColor: theme.c.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        android: { elevation: 3 },
      }),
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
    termsText: {
      fontSize: 12,
      color: theme.c.textSub,
      textAlign: "center",
      marginBottom: theme.spacing[6],
      lineHeight: 18,
    },
    termsLink: {
      color: theme.c.primary,
      fontWeight: "600",
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: theme.spacing[4],
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
