// src/components/common/AppButton.tsx
import React from "react";
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { Button as PaperButton } from "react-native-paper";

import { C, Radius, Spacing, Typography } from "@/src/theme";

interface AppButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text';
  variant?: 'primary' | 'outline' | 'text'; // Thêm variant để dễ dùng
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AppButton = ({
  title,
  children,
  onPress,
  mode,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  size = 'medium',
  fullWidth = false,
  style,
  textStyle,
}: AppButtonProps) => {
  // Map variant sang mode
  const getMode = () => {
    if (mode) return mode;
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  // Map size sang height
  const getHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'medium': return 44;
      case 'large': return 52;
      default: return 44;
    }
  };

  // Map size sang font size
  const getFontSize = () => {
    switch (size) {
      case 'small': return 13;
      case 'medium': return 15;
      case 'large': return 16;
      default: return 15;
    }
  };

  const finalMode = getMode();
  const buttonHeight = getHeight();

  return (
    <PaperButton
      mode={finalMode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      theme={{
        colors: {
          primary: C.primary,
          surfaceDisabled: C.border,
          onSurfaceDisabled: C.textSub,
        },
        roundness: Radius.md / 2,
      }}
      style={[
        styles.button,
        { height: buttonHeight },
        finalMode === 'outlined' && styles.outlinedButton,
        fullWidth && styles.fullWidth,
        style,
      ]}
      labelStyle={[
        styles.label,
        { fontSize: getFontSize() },
        textStyle
      ]}
      contentStyle={!title && !children ? { padding: 0 } : undefined}
    >
      {children || title}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: Spacing.xs,
    justifyContent: 'center',
    minWidth: 0,
    borderRadius: Radius.md,
  },
  outlinedButton: {
    borderColor: C.primary,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    ...Typography.variants.button,
    fontWeight: '600',
  },
});
