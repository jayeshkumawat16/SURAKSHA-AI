import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "emergency" | "outline" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: "small" | "medium" | "large";
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  iconName,
  style,
  textStyle,
  size = "medium"
}) => {
  const isEmergency = variant === "emergency";
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";

  const getContainerStyle = (): ViewStyle => {
    if (disabled) return styles.disabledContainer;
    if (isEmergency) return styles.emergencyContainer;
    if (isOutline) return styles.outlineContainer;
    if (isSecondary) return styles.secondaryContainer;
    return styles.primaryContainer;
  };

  const getTextStyle = (): TextStyle => {
    if (disabled) return styles.disabledText;
    if (isEmergency) return styles.emergencyText;
    if (isOutline) return styles.outlineText;
    if (isSecondary) return styles.secondaryText;
    return styles.primaryText;
  };

  const minHeight = size === "large" ? 54 : size === "small" ? 40 : SPACING.touchTarget;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.baseButton, { minHeight }, getContainerStyle(), style]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isEmergency || (!isOutline && !isSecondary) ? COLORS.textDark : COLORS.primaryCyan}
        />
      ) : (
        <View style={styles.contentRow}>
          {iconName && (
            <Ionicons
              name={iconName}
              size={size === "small" ? 16 : 20}
              color={getTextStyle().color as string}
              style={styles.icon}
            />
          )}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: SPACING.sm,
  },
  baseText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  primaryContainer: {
    backgroundColor: COLORS.primaryCyan,
  },
  primaryText: {
    color: COLORS.textDark,
  },
  emergencyContainer: {
    backgroundColor: COLORS.emergencyRed,
  },
  emergencyText: {
    color: "#FFFFFF",
  },
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primaryCyan,
  },
  outlineText: {
    color: COLORS.primaryCyan,
  },
  secondaryContainer: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryText: {
    color: COLORS.textPrimary,
  },
  disabledContainer: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderWidth: 1,
  },
  disabledText: {
    color: "#6B7280",
  },
});
