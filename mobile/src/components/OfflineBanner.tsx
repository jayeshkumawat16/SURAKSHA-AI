import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../constants/theme";

interface OfflineBannerProps {
  message?: string;
  isManualOffline?: boolean;
  onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message,
  isManualOffline = false,
  onRetry
}) => {
  const displayMsg =
    message ||
    (isManualOffline
      ? "Manual Offline Mode Active. Operating strictly with local safety engine and on-device database."
      : "No network connection. SURAKSHA AI is operating offline with verified local safety protocols.");

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={20} color={COLORS.statusWarning} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.text}>{displayMsg}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    borderColor: COLORS.statusWarning,
    borderLeftWidth: 4,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: "#E2E8F0",
    lineHeight: 16,
  },
  retryBtn: {
    marginLeft: SPACING.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(244, 162, 97, 0.2)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.statusWarning,
  },
  retryText: {
    fontSize: TYPOGRAPHY.sizeBadge,
    color: COLORS.statusWarning,
    fontWeight: "700",
  },
});
