// src/components/common/AppCard.tsx
import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Card as PaperCard } from "react-native-paper";

import { C, Radius, Spacing } from "@/src/theme";

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 0 | 1 | 2 | 3 | 4;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  noBorder?: boolean;
}

export const AppCard = ({ 
  children, 
  style, 
  onPress, 
  elevation = 1,
  padding = 'md',
  noBorder = false,
  ...props 
}: AppCardProps) => {
  // Map padding values
  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return Spacing.sm;
      case 'md': return Spacing.md;
      case 'lg': return Spacing.lg;
      case 'xl': return Spacing.xl;
      default: return Spacing.md;
    }
  };

  const cardStyle = [
    styles.card,
    { 
      padding: getPadding(),
      borderWidth: noBorder ? 0 : 1,
      elevation: elevation,
    },
    style,
  ];

  // Nếu có onPress, bọc trong TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <PaperCard
          style={cardStyle}
          theme={{
            colors: { elevation: { level1: C.bg } },
            roundness: Radius.lg / 2,
          }}
          {...props}
        >
          {children}
        </PaperCard>
      </TouchableOpacity>
    );
  }

  return (
    <PaperCard
      style={cardStyle}
      theme={{
        colors: { elevation: { level1: C.bg } },
        roundness: Radius.lg / 2,
      }}
      {...props}
    >
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bg,
    marginVertical: Spacing.xs,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
});

// Variants có sẵn
export const AppCardPressable = (props: AppCardProps) => (
  <AppCard elevation={2} {...props} />
);

export const AppCardOutlined = (props: AppCardProps) => (
  <AppCard noBorder={false} elevation={0} {...props} />
);

export const AppCardElevated = (props: AppCardProps) => (
  <AppCard elevation={3} {...props} />
);
