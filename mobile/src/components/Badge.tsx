import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY } from "../constants/theme";

interface BadgeProps {
  label: string;
  variant?: "critical" | "severe" | "moderate" | "demo" | "offline" | "success" | "cyan" | "default";
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = "default" }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case "critical":
        return { bg: "rgba(230, 57, 70, 0.25)", text: "#FF4D4D", border: "#E63946" };
      case "severe":
        return { bg: "rgba(244, 162, 97, 0.25)", text: "#FFAA5A", border: "#F4A261" };
      case "moderate":
        return { bg: "rgba(233, 196, 106, 0.2)", text: "#F3C969", border: "#E9C46A" };
      case "demo":
        return { bg: "rgba(255, 183, 3, 0.2)", text: "#FFD166", border: "#FFB703" };
      case "offline":
        return { bg: "rgba(148, 163, 184, 0.2)", text: "#CBD5E1", border: "#64748B" };
      case "success":
        return { bg: "rgba(42, 157, 143, 0.25)", text: "#48CAE4", border: "#2A9D8F" };
      case "cyan":
        return { bg: "rgba(0, 229, 255, 0.15)", text: "#00E5FF", border: "#00E5FF" };
      default:
        return { bg: COLORS.cardElevated, text: COLORS.textSecondary, border: COLORS.border };
    }
  };

  const styleConfig = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }
      ]}
    >
      <Text style={[styles.text, { color: styleConfig.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: TYPOGRAPHY.sizeBadge,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
