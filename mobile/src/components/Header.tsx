import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { Badge } from "./Badge";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  isOnline?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title = "SURAKSHA AI",
  subtitle,
  showBack = false,
  isOnline = true,
  rightAction
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {showBack && (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primaryCyan} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightGroup}>
          <Badge
            label={isOnline ? "ONLINE" : "OFFLINE"}
            variant={isOnline ? "success" : "offline"}
          />
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.actionBtn}
            >
              <Ionicons name={rightAction.icon} size={22} color={COLORS.primaryCyan} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeHeader,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.primaryCyan,
    marginTop: 2,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    marginLeft: SPACING.md,
    padding: SPACING.xs,
  },
});
