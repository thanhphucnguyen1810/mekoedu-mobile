import { registerSchema } from "@/src/schema/schema";
import authService from "@/src/services/authService";
import { useTheme } from "@/src/theme";
import { yupResolver } from "@hookform/resolvers/yup";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useMemo, useRef, useState } from "react";
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

type RegisterForm = {
  familyName: string;
  givenName: string;
  email: string;
  password: string;
  confirm: string;
};

const LOGO_URL =
  "http://192.168.1.216:8080/documents/20117/0/logo-do.png/251abcb6-32dc-95f6-29ab-bbed446cf9d7?version=1.0&t=1781164301789";

export default function RegisterScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const givenNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [apiError, setApiError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      familyName: "",
      givenName: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authService.register({
        familyName: data.familyName.trim(),
        givenName: data.givenName.trim(),
        emailAddress: data.email.trim().toLowerCase(),
        password: data.password,
      });
      reset();
      showToast("success", "Đăng ký thành công");
    } catch (error: any) {
      console.log("Register error:", error.response?.data || error.message);

      setApiError(
        error.response?.data?.title ||
          error.response?.data?.message ||
          error.message ||
          "Đăng ký thất bại",
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
        <View style={styles.logoCard}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logoImage}
            contentFit="contain"
            transition={200}
          />
        </View>

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.sub}>Đăng ký để bắt đầu hành trình học tập</Text>

        {apiError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1.2 }]}>
            <Text style={styles.label}>Họ</Text>
            <Controller
              control={control}
              name="familyName"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.familyName && styles.inputErr]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Nguyễn"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => givenNameRef.current?.focus()}
                  blurOnSubmit={false}
                  placeholderTextColor={theme.c.textSub}
                />
              )}
            />
            {errors.familyName?.message && (
              <Text style={styles.errMsg}>{errors.familyName.message}</Text>
            )}
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Tên</Text>
            <Controller
              control={control}
              name="givenName"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  ref={givenNameRef}
                  style={[styles.input, errors.givenName && styles.inputErr]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="An"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                  placeholderTextColor={theme.c.textSub}
                />
              )}
            />
            {errors.givenName?.message && (
              <Text style={styles.errMsg}>{errors.givenName.message}</Text>
            )}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                ref={emailRef}
                style={[styles.input, errors.email && styles.inputErr]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="ten@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                placeholderTextColor={theme.c.textSub}
              />
            )}
          />
          {errors.email?.message && (
            <Text style={styles.errMsg}>{errors.email.message}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                ref={passwordRef}
                style={[styles.input, errors.password && styles.inputErr]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                blurOnSubmit={false}
                placeholderTextColor={theme.c.textSub}
              />
            )}
          />
          {errors.password?.message && (
            <Text style={styles.errMsg}>{errors.password.message}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <Controller
            control={control}
            name="confirm"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                ref={confirmRef}
                style={[styles.input, errors.confirm && styles.inputErr]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                placeholderTextColor={theme.c.textSub}
              />
            )}
          />
          {errors.confirm?.message && (
            <Text style={styles.errMsg}>{errors.confirm.message}</Text>
          )}
        </View>

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Mật khẩu yêu cầu ít nhất 8 ký tự, bao gồm chữ hoa và chữ số.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, isSubmitting && styles.btnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Đăng ký tài khoản</Text>
          )}
        </TouchableOpacity>

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

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
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
      padding: theme.spacing[4],
      marginBottom: theme.spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.error,
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
    },
    input: {
      backgroundColor: theme.c.bg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.c.border,
      paddingHorizontal: theme.spacing[4],
      height: 50,
      fontSize: theme.typography.sizes.md,
      color: theme.c.text,
    },
    inputErr: {
      borderColor: theme.colors.error,
    },
    errMsg: {
      fontSize: 11,
      color: theme.colors.error,
      marginTop: theme.spacing[1],
    },
    hintContainer: {
      marginBottom: theme.spacing[6],
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
      marginBottom: theme.spacing[5],
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
    logoCard: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing[0],
    },
    logoImage: {
      width: 280,
      height: 100,
    },
  });
