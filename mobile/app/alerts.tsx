import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { fetchAlerts } from "../src/services/alerts";
import { AlertItem } from "../src/types";

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<string>("Checking...");

  const loadAlerts = useCallback(async () => {
    const result = await fetchAlerts();
    setAlerts(result.alerts);
    setIsLive(result.isLive);
    setNotice(result.error || null);
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleOpenSourceUrl = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeScreen>
      <Header
        title="EMERGENCY ALERTS"
        subtitle="National & Regional Bulletins"
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryCyan}
          />
        }
      >
        {/* Authoritative Warning Notice */}
        <Card style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primaryCyan} />
            <Text style={styles.noticeTitle}>DISASTER ALERT PROVENANCE</Text>
          </View>
          <Text style={styles.noticeText}>
            SURAKSHA AI displays alerts parsed directly from authorized feeds (e.g. NDMA SACHET, IMD, NCS).
            We do NOT invent active alerts or claim universal earthquake lead-time predictions.
            Sample prototype records are marked <Text style={styles.boldDemo}>DEMO — NOT VERIFIED</Text>.
          </Text>
          <View style={styles.lastCheckRow}>
            <Text style={styles.lastCheckText}>Last Checked: {lastChecked}</Text>
            <Badge
              label={isLive ? "LIVE FEED ACTIVE" : "OFFLINE / DEMO CACHE"}
              variant={isLive ? "success" : "offline"}
            />
          </View>
        </Card>

        {notice && (
          <View style={styles.offlineNotice}>
            <Text style={styles.offlineNoticeText}>{notice}</Text>
          </View>
        )}

        {/* Official Portal Shortcuts */}
        <View style={styles.officialLinksRow}>
          <TouchableOpacity
            style={styles.portalPill}
            onPress={() => handleOpenSourceUrl("https://sachet.ndma.gov.in")}
          >
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primaryCyan} />
            <Text style={styles.portalText}>NDMA SACHET Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.portalPill}
            onPress={() => handleOpenSourceUrl("https://mausam.imd.gov.in")}
          >
            <Ionicons name="rainy" size={14} color={COLORS.primaryCyan} />
            <Text style={styles.portalText}>IMD Weather</Text>
          </TouchableOpacity>
        </View>

        {/* Alert Items */}
        <Text style={styles.sectionHeaderTitle}>
          ACTIVE ADVISORIES ({alerts.length})
        </Text>

        {alerts.map((alert) => {
          const isCritical = alert.severity === "critical";
          const isSevere = alert.severity === "severe";

          return (
            <Card
              key={alert.id}
              emergencyBorder={isCritical}
              style={[
                styles.alertCard,
                isSevere && !isCritical && styles.severeCard,
              ]}
            >
              <View style={styles.alertTopRow}>
                <View style={styles.hazardGroup}>
                  <Ionicons
                    name={isCritical ? "warning" : "alert-circle"}
                    size={20}
                    color={isCritical ? COLORS.emergencyRed : COLORS.statusWarning}
                  />
                  <Text style={styles.hazardName}>{alert.hazard}</Text>
                </View>
                <Badge
                  label={
                    alert.provenance === "DEMO_NOT_VERIFIED"
                      ? "DEMO — NOT VERIFIED"
                      : "OFFICIAL ALERT"
                  }
                  variant={alert.provenance === "DEMO_NOT_VERIFIED" ? "demo" : "critical"}
                />
              </View>

              <Text style={styles.alertTitle}>{alert.title}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="navigate-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.areaText}>{alert.affected_area}</Text>
              </View>

              <Text style={styles.descriptionText}>{alert.description}</Text>

              {alert.instruction && (
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionHeading}>RECOMMENDED INSTRUCTION:</Text>
                  <Text style={styles.instructionText}>{alert.instruction}</Text>
                </View>
              )}

              <View style={styles.footerRow}>
                <View style={styles.authorityCol}>
                  <Text style={styles.authorityText}>Issued by: {alert.source_authority}</Text>
                  <Text style={styles.timeText}>
                    Issued: {new Date(alert.issue_time).toLocaleString()}
                  </Text>
                </View>

                {alert.source_url && (
                  <TouchableOpacity
                    style={styles.verifyLink}
                    onPress={() => handleOpenSourceUrl(alert.source_url)}
                  >
                    <Text style={styles.verifyLinkText}>Verify Source</Text>
                    <Ionicons name="open-outline" size={12} color={COLORS.primaryCyan} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  noticeCard: {
    backgroundColor: "rgba(16, 24, 39, 0.9)",
    borderColor: COLORS.primaryCyan,
    marginBottom: SPACING.md,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  noticeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  boldDemo: {
    color: COLORS.statusWarning,
    fontWeight: "700",
  },
  lastCheckRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  lastCheckText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  offlineNotice: {
    backgroundColor: "rgba(244, 162, 97, 0.15)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.statusWarning,
    padding: SPACING.sm,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  offlineNoticeText: {
    fontSize: 11,
    color: "#FFAA5A",
  },
  officialLinksRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: SPACING.md,
  },
  portalPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  portalText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryCyan,
    marginLeft: 6,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  alertCard: {
    marginBottom: SPACING.md,
  },
  severeCard: {
    borderColor: COLORS.statusWarning,
  },
  alertTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  hazardGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  hazardName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginLeft: 6,
    textTransform: "uppercase",
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  areaText: {
    fontSize: 12,
    color: COLORS.primaryCyan,
    marginLeft: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  instructionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: SPACING.sm,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryCyan,
    marginVertical: SPACING.xs,
  },
  instructionHeading: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  authorityCol: {
    flex: 1,
  },
  authorityText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  verifyLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
  },
  verifyLinkText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primaryCyan,
    marginRight: 4,
  },
});
