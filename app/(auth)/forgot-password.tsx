// app/(auth)/forgot-password.tsx
import { AppButton } from "@/src/components/common";
import { useTheme } from "@/src/theme";
import { Colors } from "@/src/theme/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from "react-native";
import { AppConfig } from "@/src/config/appConfig";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const forgotText = AppConfig.forgotPassword;
  const store = AppConfig.store;

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", forgotText.errors.emailRequired);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Lỗi", forgotText.errors.emailInvalid);
      return;
    }

    setLoading(true);
    try {
      // TODO: Gọi API reset password
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        forgotText.successTitle,
        forgotText.successMessage(email),
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Lỗi", forgotText.errors.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Nút quay lại */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.c.text} />
        </TouchableOpacity>

        {/* Logo & tiêu đề */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={store.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{forgotText.title}</Text>
          <Text style={styles.description}>{forgotText.description}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{forgotText.emailLabel}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.c.textSub}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={forgotText.emailPlaceholder}
                placeholderTextColor={theme.c.textSub}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleSend}
              />
            </View>
          </View>
        </View>

        {/* Nút gửi */}
        <AppButton
          title={loading ? forgotText.sendButtonLoading : forgotText.sendButton}
          onPress={handleSend}
          disabled={loading}
          variant="primary"
          fullWidth
          style={styles.sendButton}
        />

        {/* Link quay lại login */}
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.backToLogin}>
            <Text style={styles.backToLoginText}>{forgotText.backToLogin}</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.c.bg,
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.layout.screenHorizontal,
      paddingVertical: theme.spacing.layout.screenVertical,
    },
    backBtn: {
      marginTop: Platform.OS === "ios" ? theme.spacing[2] : theme.spacing[4],
      marginBottom: theme.spacing[4],
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.c.bgSoft,
    },
    header: {
      alignItems: "center",
      marginBottom: theme.spacing[8],
    },
    logoWrapper: {
      width: 100,
      height: 100,
      marginBottom: theme.spacing[4],
      backgroundColor: Colors.primary[50],
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    logo: {
      width: 80,
      height: 80,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: Colors.neutral[900],
      textAlign: "center",
      marginBottom: theme.spacing[2],
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 15,
      color: theme.c.textSub,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: theme.spacing[4],
    },
    form: {
      marginBottom: theme.spacing[6],
    },
    inputGroup: {
      marginBottom: theme.spacing[4],
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.c.textSub,
      marginBottom: theme.spacing[2],
      letterSpacing: 0.5,
    },
    inputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    inputIcon: {
      position: "absolute",
      left: theme.spacing[3],
      zIndex: 1,
    },
    input: {
      height: 52,
      backgroundColor: theme.c.bg,
      borderRadius: theme.radius.lg,
      borderWidth: theme.spacing.borderWidth.normal,
      borderColor: theme.c.border,
      paddingHorizontal: theme.spacing.component.inputPadding,
      paddingLeft: 44,
      fontSize: 16,
      color: theme.c.text,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        },
        android: { elevation: 1 },
      }),
    },
    sendButton: {
      marginTop: theme.spacing[2],
      marginBottom: theme.spacing[4],
    },
    backToLogin: {
      alignItems: "center",
      paddingVertical: theme.spacing[3],
    },
    backToLoginText: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.primary[500],
    },
  });
  