// app/(auth)/register.tsx
import { AppButton } from "@/src/components/common";
import type { AppDispatch, RootState } from "@/src/store";
import { clearError, liferayRegister } from "@/src/store/slices/liferayAuthSlice";
import { useTheme } from "@/src/theme";
import { Colors } from "@/src/theme/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
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
import Toast from "react-native-toast-message";
import { Image } from "react-native";
import { AppConfig } from "@/src/config/appConfig";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const validatePassword = (password: string) => ({
  length: password.length >= 8,
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  upper: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
});

const isPasswordValid = (p: string) => {
  const v = validatePassword(p);
  return v.length && v.special && v.upper && v.number;
};

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

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  "person-outline",
  "lock-closed-outline",
  "checkmark-done-outline",
];

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  steps: string[];
};

const StepIndicator = ({ currentStep, totalSteps, steps }: StepIndicatorProps) => {
  const { c } = useTheme();
  return (
    <View style={siStyles.wrap}>
      <View style={siStyles.track}>
        <View
          style={[
            siStyles.fill,
            {
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
              backgroundColor: Colors.primary[500],
            },
          ]}
        />
      </View>
      <View style={siStyles.row}>
        {steps.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const dotBg = done || active ? Colors.primary[500] : Colors.neutral[200];
          return (
            <View key={i} style={siStyles.item}>
              <View style={[siStyles.dot, { backgroundColor: dotBg }]}>
                {done ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : (
                  <Ionicons name={STEP_ICONS[i]} size={13} color={active ? "#fff" : Colors.neutral[400]} />
                )}
              </View>
              <Text
                style={[
                  siStyles.label,
                  { color: active ? Colors.primary[600] : c.textSub, fontWeight: active ? "700" : "400" },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const siStyles = StyleSheet.create({
  wrap: { marginBottom: 28, paddingHorizontal: 4 },
  track: {
    height: 3,
    backgroundColor: Colors.neutral[200],
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 14,
  },
  fill: { height: "100%", borderRadius: 2 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  item: { alignItems: "center", flex: 1, gap: 6 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11, textAlign: "center" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.liferayAuth);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const config = AppConfig.register;
  const store = AppConfig.store;

  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL = 3;
  const STEPS = ["Cá nhân", "Tài khoản", "Xác nhận"];

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const pwdValid = useMemo(() => validatePassword(form.password), [form.password]);
  const showPwdReq = passwordFocused && form.password.length > 0;
  const confirmMatch = form.confirm === form.password && form.confirm.length > 0;

  const toggleShowPassword = useCallback(() => setShowPassword(prev => !prev), []);
  const toggleShowConfirm = useCallback(() => setShowConfirm(prev => !prev), []);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const validateStep = (step: number): boolean => {
    const errs: Partial<typeof form> = {};

    if (step === 0) {
      if (!form.familyName.trim()) errs.familyName = config.errors.familyNameRequired;
      if (!form.givenName.trim()) errs.givenName = config.errors.givenNameRequired;
    }

    if (step === 1) {
      if (!form.email.includes("@")) errs.email = config.errors.emailInvalid;
      if (!isPasswordValid(form.password)) errs.password = config.errors.passwordWeak;
    }

    if (step === 2) {
      if (form.confirm !== form.password) errs.confirm = config.errors.passwordMismatch;
    }

    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((p) => Math.min(p + 1, TOTAL - 1));
      setLocalErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep((p) => Math.max(p - 1, 0));
    dispatch(clearError());
    setLocalErrors({});
  };

  const handleRegister = async () => {
    if (!validateStep(2)) return;
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
      Toast.show({
        type: "success",
        text1: "Đăng ký thành công!",
        text2: "Vui lòng đăng nhập để tiếp tục",
        position: "top",
        visibilityTime: 2000,
        autoHide: true,
        topOffset: 60,
      });
      
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 500);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-outline" size={20} color={Colors.primary[500]} />
              <Text style={styles.sectionTitle}>{config.stepPersonalInfo}</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1.2 }]}>
                <Text style={styles.label}>{config.familyNameLabel}</Text>
                <TextInput
                  style={[styles.input, localErrors.familyName && styles.inputErr]}
                  value={form.familyName}
                  onChangeText={set("familyName")}
                  placeholder={config.familyNamePlaceholder}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => givenNameRef.current?.focus()}
                  blurOnSubmit={false}
                  placeholderTextColor={theme.c.textSub}
                />
                {localErrors.familyName && <Text style={styles.errMsg}>{localErrors.familyName}</Text>}
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{config.givenNameLabel}</Text>
                <TextInput
                  ref={givenNameRef}
                  style={[styles.input, localErrors.givenName && styles.inputErr]}
                  value={form.givenName}
                  onChangeText={set("givenName")}
                  placeholder={config.givenNamePlaceholder}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  placeholderTextColor={theme.c.textSub}
                />
                {localErrors.givenName && <Text style={styles.errMsg}>{localErrors.givenName}</Text>}
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-lock-outline" size={20} color={Colors.primary[500]} />
              <Text style={styles.sectionTitle}>{config.stepAccountInfo}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{config.emailLabel}</Text>
              <View style={styles.passwordRow}>
                <Ionicons name="mail-outline" size={18} color={theme.c.textSub} style={styles.inputIconLeft} />
                <TextInput
                  ref={emailRef}
                  style={[styles.input, styles.inputWithIcon, localErrors.email && styles.inputErr]}
                  value={form.email}
                  onChangeText={set("email")}
                  placeholder={config.emailPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  placeholderTextColor={theme.c.textSub}
                />
              </View>
              {localErrors.email && <Text style={styles.errMsg}>{localErrors.email}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{config.passwordLabel}</Text>
              <View style={styles.passwordRow}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.c.textSub} style={styles.inputIconLeft} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.inputWithIcon, localErrors.password && styles.inputErr]}
                  value={form.password}
                  onChangeText={set("password")}
                  placeholder={config.passwordPlaceholder}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  placeholderTextColor={theme.c.textSub}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={toggleShowPassword}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={theme.c.textSub}
                  />
                </TouchableOpacity>
              </View>
              {localErrors.password && <Text style={styles.errMsg}>{localErrors.password}</Text>}

              {showPwdReq && (
                <View style={styles.requirements}>
                  <RequirementItem text={config.passwordRequirements.length} valid={pwdValid.length} />
                  <RequirementItem text={config.passwordRequirements.special} valid={pwdValid.special} />
                  <RequirementItem text={config.passwordRequirements.upper} valid={pwdValid.upper} />
                  <RequirementItem text={config.passwordRequirements.number} valid={pwdValid.number} />
                </View>
              )}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="check-decagram-outline" size={20} color={Colors.primary[500]} />
              <Text style={styles.sectionTitle}>{config.stepConfirmInfo}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{config.confirmPasswordLabel}</Text>
              <View style={styles.passwordRow}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.c.textSub} style={styles.inputIconLeft} />
                <TextInput
                  ref={confirmRef}
                  style={[styles.input, styles.inputWithIcon, localErrors.confirm && styles.inputErr]}
                  value={form.confirm}
                  onChangeText={set("confirm")}
                  placeholder={config.confirmPasswordPlaceholder}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                  onSubmitEditing={handleRegister}
                  placeholderTextColor={theme.c.textSub}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={toggleShowConfirm}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={theme.c.textSub}
                  />
                </TouchableOpacity>
              </View>
              {localErrors.confirm && <Text style={styles.errMsg}>{localErrors.confirm}</Text>}

              {confirmFocused && form.confirm.length > 0 && (
                <View style={styles.requirements}>
                  <RequirementItem text={confirmMatch ? config.confirmMatchText : config.confirmNotMatchText} valid={confirmMatch} />
                </View>
              )}
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>{config.reviewTitle}</Text>
              <View style={styles.reviewDivider} />
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="person-outline" size={16} color={Colors.primary[400]} />
                  <Text style={styles.reviewLabel}>{config.nameLabel}</Text>
                  <Text style={styles.reviewValue}>{form.familyName} {form.givenName}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="mail-outline" size={16} color={Colors.primary[400]} />
                  <Text style={styles.reviewLabel}>{config.emailLabel}</Text>
                  <Text style={styles.reviewValue}>{form.email}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary[400]} />
                  <Text style={styles.reviewLabel}>Bảo mật</Text>
                  <Text style={[styles.reviewValue, { color: Colors.success }]}>{config.securityStatus}</Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
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
          <Image source={store.logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.sub}>{config.subTitle}</Text>

        <StepIndicator currentStep={currentStep} totalSteps={TOTAL} steps={STEPS} />

        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderStep()}

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {currentStep > 0 && (
            <View style={styles.buttonWrapper}>
              <AppButton title={config.stepBackButton} onPress={handleBack} variant="secondary" icon="arrow-back-outline" iconPosition="left" fullWidth />
            </View>
          )}

          <View style={[styles.buttonWrapper, currentStep === 0 && styles.buttonWrapperFull]}>
            {currentStep < TOTAL - 1 ? (
              <AppButton icon="arrow-forward-outline" iconPosition="right" title={config.stepNextButton} onPress={handleNext} variant="primary" fullWidth />
            ) : (
              <AppButton title={loading ? config.registerButtonLoading : config.registerButton} onPress={handleRegister} disabled={loading} variant="primary" icon="checkmark-outline" iconPosition="left" loading={loading} fullWidth />
            )}
          </View>
        </View>

        <Text style={styles.termsText}>
          {config.termsPrefix}
          <Text style={styles.termsLink}>{config.termsLink1}</Text>
          {" & "}
          <Text style={styles.termsLink}>{config.termsLink2}</Text>
          {config.termsSuffix}
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{config.haveAccount}</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.switchLink}>{config.loginLink}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────

const inputShadow = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
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
        ios: { shadowColor: Colors.primary[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5 },
        android: { elevation: 4 },
      }),
    },
    logoLetter: { color: Colors.neutral[0], fontSize: 22, fontWeight: "700" },
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
      marginBottom: theme.spacing[1],
      letterSpacing: -0.3,
    },
    sub: {
      fontSize: 14,
      color: theme.c.textSub,
      textAlign: "center",
      marginBottom: theme.spacing[6],
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

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: theme.spacing[4],
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.neutral[800],
    },

    row: { flexDirection: "row", gap: theme.spacing[3] },
    field: { marginBottom: theme.spacing[4] },
    label: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.c.textSub,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: theme.spacing[2],
    },

    passwordRow: { position: "relative", justifyContent: "center" },
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
    // passwordInput: { paddingRight: 52 },
    inputErr: { borderColor: Colors.error, borderWidth: 1.5 },
    errMsg: { fontSize: 11, color: Colors.error, marginTop: theme.spacing[1], marginLeft: 2 },

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

    requirements: { marginTop: theme.spacing[2], gap: theme.spacing[1] },

    reviewCard: {
      backgroundColor: Colors.neutral[50],
      borderRadius: theme.radius.lg,
      padding: theme.spacing[4],
      borderWidth: 1,
      borderColor: Colors.neutral[100],
      marginTop: theme.spacing[2],
    },
    reviewTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.neutral[700],
      marginBottom: theme.spacing[2],
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    reviewDivider: {
      height: 1,
      backgroundColor: Colors.neutral[200],
      marginBottom: theme.spacing[3],
    },
    reviewLabel: { fontSize: 13, color: theme.c.textSub, width: 90 },
    reviewValue: { fontSize: 13, color: theme.c.text, fontWeight: "500", flex: 1 },

    navRow: {
      flexDirection: "row",
      gap: theme.spacing[3],
      marginTop: theme.spacing[2],
      marginBottom: theme.spacing[5],
    },
    buttonWrapper: {
      flex: 1,
    },
    buttonWrapperFull: {
      flex: 1,
    },
    termsText: {
      fontSize: 12,
      color: theme.c.textSub,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: theme.spacing[4],
    },
    termsLink: { color: Colors.primary[500], fontWeight: "600" },
    switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    switchText: { fontSize: 14, color: theme.c.textSub },
    switchLink: { fontSize: 14, fontWeight: "700", color: Colors.primary[500] },

        logoContainer: {
      alignItems: "center",
      marginBottom: theme.spacing[8], // tăng khoảng cách dưới logo
    },

    logoImage: {
      width: 300,
      height: 100,
    },
    
  });
