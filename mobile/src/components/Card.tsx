import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  highlight?: boolean;
  emergencyBorder?: boolean;
}


export const Card: React.FC<CardProps> = ({
  children,
  style,
  highlight = false,
  emergencyBorder = false
}) => {
  return (
    <View
      style={[
        styles.card,
        highlight && styles.highlightCard,
        emergencyBorder && styles.emergencyCard,
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  highlightCard: {
    borderColor: COLORS.primaryCyan,
    backgroundColor: "rgba(16, 24, 39, 0.95)",
  },
  emergencyCard: {
    borderColor: COLORS.emergencyRed,
    backgroundColor: "rgba(35, 15, 20, 0.8)",
  },
});
