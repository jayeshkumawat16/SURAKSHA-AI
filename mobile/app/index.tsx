import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { checkBackendReachability, formatTimeAgo, isManualOffline } from "../src/services/connectivity";
import { captureCurrentLocation, formatLocationAge } from "../src/services/location";
import { getChecklistItems } from "../src/storage/guidesRepository";
import { fetchAlerts } from "../src/services/alerts";
import { AlertItem, EmergencyLocation } from "../src/types";

export default function HomeScreen() {
  const router = useRouter();

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [manualOffline, setManualOfflineState] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string>("Checking...");
  const [location, setLocation] = useState<EmergencyLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Not captured (tap to acquire)");
  const [quickReport, setQuickReport] = useState<string>("");
  const [checklistProgress, setChecklistProgress] = useState<{ total: number; completed: number }>({
    total: 10,
    completed: 0,
  });
  const [latestAlert, setLatestAlert] = useState<AlertItem | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [capturingLoc, setCapturingLoc] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    // 1. Check offline mode & backend reachability
    const offlineMode = await isManualOffline();
    setManualOfflineState(offlineMode);

    if (offlineMode) {
      setIsOnline(false);
      setLastSync("Manual Offline Mode");
    } else {
      const reach = await checkBackendReachability();
      setIsOnline(reach.reachable);
      setLastSync(reach.reachable ? "Just synced" : "Offline / Unreachable");
    }

    // 2. Load Checklist Progress
    try {
      const items = await getChecklistItems();
      const completed = items.filter((i) => i.completed).length;
      setChecklistProgress({ total: items.length, completed });
    } catch {
      // ignore
    }

    // 3. Load Alert Summary
    try {
      const alertData = await fetchAlerts();
      if (alertData.alerts && alertData.alerts.length > 0) {
        setLatestAlert(alertData.alerts[0]);
      }
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCaptureLocation = async () => {
    setCapturingLoc(true);
    const result = await captureCurrentLocation();
    setCapturingLoc(false);

    if (result.status === "granted" && result.location) {
      setLocation(result.location);
      const acc = result.location.accuracy ? ` (±${result.location.accuracy}m)` : "";
      setLocationStatus(`Lat: ${result.location.latitude}, Lon: ${result.location.longitude}${acc}`);
    } else if (result.status === "denied") {
      Alert.alert(
        "Location Permission Required",
        "Location access was denied. You can still type your manual landmark or address in the SOS screen."
      );
      setLocationStatus("Permission denied. Manual input supported.");
    } else {
      Alert.alert("GPS Timeout", result.error || "Unable to lock GPS position. Check phone settings.");
      setLocationStatus("GPS timeout. Manual input supported.");
    }
  };

  const handleQuickScenario = (hazard: string, prefill: string) => {
    router.push({
      pathname: "/assistant",
      params: { hazard, report: prefill },
    });
  };

  const handleSubmitQuickReport = () => {
    if (!quickReport.trim()) {
      Alert.alert("Input Required", "Please describe what is happening around you.");
      return;
    }
    const reportText = quickReport.trim();
    setQuickReport("");
    router.push({
      pathname: "/assistant",
      params: { report: reportText },
    });
  };

  const checklistPercentage =
    checklistProgress.total > 0
      ? Math.round((checklistProgress.completed / checklistProgress.total) * 100)
      : 0;

  return (
    <SafeScreen>
      <Header
        title="SURAKSHA AI"
        subtitle="National Disaster Command & Safety"
        isOnline={isOnline && !manualOffline}
        rightAction={{
          icon: "settings-outline",
          onPress: () => router.push("/settings"),
        }}
      />

      {(!isOnline || manualOffline) && (
        <OfflineBanner
          isManualOffline={manualOffline}
          onRetry={loadDashboardData}
        />
      )}

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
        {/* Prominent SOS Emergency Action */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.sosHeroButton}
          onPress={() => router.push("/sos")}
          accessibilityRole="button"
          accessibilityLabel="Emergency SOS Broadcast"
        >
          <View style={styles.sosContentRow}>
            <View style={styles.sosIconContainer}>
              <Ionicons name="megaphone" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.sosTextContainer}>
              <Text style={styles.sosHeroTitle}>EMERGENCY SOS</Text>
              <Text style={styles.sosHeroSubtitle}>
                Compose dispatch message & Dial 112
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* System & Location Freshness Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>SYNC STATUS</Text>
              <Text style={styles.statusValue}>{lastSync}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>LOCATION FRESHNESS</Text>
              <Text style={styles.statusValue} numberOfLines={1}>
                {location ? formatLocationAge(location.timestamp) : "Not acquired"}
              </Text>
            </View>
          </View>

          <View style={styles.locActionRow}>
            <Text style={styles.locStatusText} numberOfLines={1}>
              {locationStatus}
            </Text>
            <Button
              title={capturingLoc ? "Acquiring..." : "Get GPS"}
              size="small"
              variant="outline"
              loading={capturingLoc}
              onPress={handleCaptureLocation}
              iconName="navigate"
              style={styles.gpsBtn}
            />
          </View>
        </Card>

        {/* Live / Demo Alert Advisory Banner */}
        {latestAlert && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/alerts")}
          >
            <Card style={styles.alertCard} emergencyBorder={latestAlert.severity === "critical"}>
              <View style={styles.alertHeaderRow}>
                <View style={styles.alertHeaderLeft}>
                  <Ionicons
                    name="warning"
                    size={20}
                    color={latestAlert.severity === "critical" ? COLORS.emergencyRed : COLORS.statusWarning}
                  />
                  <Text style={styles.alertSectionTitle}>LATEST ADVISORY</Text>
                </View>
                <Badge
                  label={latestAlert.provenance === "DEMO_NOT_VERIFIED" ? "DEMO — NOT VERIFIED" : "OFFICIAL"}
                  variant={latestAlert.provenance === "DEMO_NOT_VERIFIED" ? "demo" : "critical"}
                />
              </View>
              <Text style={styles.alertTitle} numberOfLines={2}>
                {latestAlert.title}
              </Text>
              <Text style={styles.alertDesc} numberOfLines={2}>
                {latestAlert.instruction || latestAlert.description}
              </Text>
            </Card>
          </TouchableOpacity>
        )}

        {/* Report Box: "Describe what is happening" */}
        <Card highlight>
          <Text style={styles.reportTitle}>Describe What Is Happening</Text>
          <Text style={styles.reportSubtitle}>
            Report rising water, structural shaking, smoke, injuries, or hazards:
          </Text>
          <TextInput
            style={styles.reportInput}
            placeholder="e.g. Flood water rising fast into ground floor, power cut off..."
            placeholderTextColor={COLORS.textMuted}
            value={quickReport}
            onChangeText={setQuickReport}
            multiline
            numberOfLines={3}
            maxLength={1000}
          />
          <Button
            title="Get Emergency Guidance"
            variant="primary"
            iconName="flash"
            onPress={handleSubmitQuickReport}
          />
        </Card>

        {/* Quick Scenario Buttons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK SCENARIOS</Text>
          <Text style={styles.sectionHint}>One-tap situational guidance</Text>
        </View>

        <View style={styles.scenarioGrid}>
          <TouchableOpacity
            style={styles.scenarioBtn}
            onPress={() =>
              handleQuickScenario("earthquake", "Violent earthquake shaking walls indoors")
            }
          >
            <Ionicons name="pulse" size={24} color={COLORS.primaryCyan} />
            <Text style={styles.scenarioBtnText}>Earthquake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scenarioBtn}
            onPress={() =>
              handleQuickScenario("flood", "Water rising rapidly, roads inundated")
            }
          >
            <Ionicons name="water" size={24} color={COLORS.primaryCyan} />
            <Text style={styles.scenarioBtnText}>Flood</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scenarioBtn}
            onPress={() =>
              handleQuickScenario("fire", "Smoke filling corridor, fire alarm sounding")
            }
          >
            <Ionicons name="flame" size={24} color={COLORS.primaryCyan} />
            <Text style={styles.scenarioBtnText}>Fire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scenarioBtn}
            onPress={() =>
              handleQuickScenario("cyclone", "Extreme gale winds and falling trees")
            }
          >
            <Ionicons name="thunderstorm" size={24} color={COLORS.primaryCyan} />
            <Text style={styles.scenarioBtnText}>Cyclone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scenarioBtn, styles.medicalBtn]}
            onPress={() =>
              handleQuickScenario("medical", "Unconscious casualty, bleeding heavily")
            }
          >
            <Ionicons name="medkit" size={24} color={COLORS.emergencyRed} />
            <Text style={[styles.scenarioBtnText, { color: COLORS.emergencyRed }]}>
              Medical
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preparedness Checklist Snapshot */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/preparedness")}
        >
          <Card>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="checkbox-outline" size={22} color={COLORS.primaryCyan} />
                <Text style={styles.cardHeaderTitle}>Preparedness Checklist</Text>
              </View>
              <Text style={styles.progressPercent}>{checklistPercentage}%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${checklistPercentage}%` },
                ]}
              />
            </View>

            <Text style={styles.checklistSummaryText}>
              {checklistProgress.completed} of {checklistProgress.total} essential items ready.
              Tap to view grab-bag essentials.
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Quick Navigational Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/lifeline-map")}
          >
            <Ionicons name="location" size={26} color={COLORS.primaryCyan} />
            <Text style={styles.actionCardTitle}>Lifeline Map</Text>
            <Text style={styles.actionCardSub}>Shelters & Hospitals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/guides")}
          >
            <Ionicons name="book" size={26} color={COLORS.primaryCyan} />
            <Text style={styles.actionCardTitle}>Offline Guides</Text>
            <Text style={styles.actionCardSub}>Reviewed Rules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/gemini-settings")}
          >
            <Ionicons name="hardware-chip-outline" size={26} color={COLORS.primaryCyan} />
            <Text style={styles.actionCardTitle}>AI Settings</Text>
            <Text style={styles.actionCardSub}>Gemini & Offline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="shield" size={26} color={COLORS.primaryCyan} />
            <Text style={styles.actionCardTitle}>Data & Privacy</Text>
            <Text style={styles.actionCardSub}>Local Storage</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Note */}
        <View style={styles.demoNoticeContainer}>
          <Text style={styles.demoNoticeText}>
            DEMO PROTOTYPE: Sample resource and alert feeds are labelled DEMO — NOT VERIFIED.
            In immediate danger, always dial 112 (India).
          </Text>
        </View>
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
  sosHeroButton: {
    backgroundColor: COLORS.emergencyRed,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  sosContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sosIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  sosTextContainer: {
    flex: 1,
  },
  sosHeroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  sosHeroSubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: "#FFE5E5",
    marginTop: 2,
  },
  statusCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryCyan,
    marginTop: 2,
  },
  locActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SPACING.sm,
  },
  locStatusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  gpsBtn: {
    paddingHorizontal: 12,
  },
  alertCard: {
    backgroundColor: "rgba(244, 162, 97, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.statusWarning,
    marginBottom: SPACING.md,
  },
  alertHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  alertHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.statusWarning,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.sizeSubheader,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  reportInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizeBody,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  sectionHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scenarioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  scenarioBtn: {
    width: "48%",
    backgroundColor: COLORS.cardElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  medicalBtn: {
    width: "100%",
    borderColor: "rgba(230, 57, 70, 0.4)",
    backgroundColor: "rgba(230, 57, 70, 0.08)",
  },
  scenarioBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderTitle: {
    fontSize: TYPOGRAPHY.sizeSubheader,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primaryCyan,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: SPACING.xs,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primaryCyan,
    borderRadius: 4,
  },
  checklistSummaryText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  actionCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  demoNoticeContainer: {
    padding: SPACING.md,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    alignItems: "center",
  },
  demoNoticeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
});
