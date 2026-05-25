import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Card as PaperCard } from "react-native-paper";

import { C, Radius, Spacing } from "@/src/theme";

type AppCardProps = React.ComponentProps<typeof PaperCard> & {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const AppCard = ({ children, style, ...props }: AppCardProps) => {
  return (
    <PaperCard
      style={[styles.card, style]}
      theme={{
        colors: { elevation: { level1: C.bg } },
        roundness: Radius.lg / 2,
      }}
      {...props}
    >
      {children}
    </PaperCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bg,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
});
