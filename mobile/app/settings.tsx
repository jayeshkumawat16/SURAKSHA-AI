import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import {
  isManualOffline,
  setManualOffline,
  checkBackendReachability,
  formatTimeAgo
} from "../src/services/connectivity";
import {
  getApiBaseUrl,
  setApiBaseUrl,
  getSetting,
  setSetting,
  SETTING_KEYS,
  clearAllPersonalData
} from "../src/storage/settingsRepository";

export default function SettingsScreen() {
  const router = useRouter();

  const [manualOfflineActive, setManualOfflineActive] = useState<boolean>(false);
  const [backendUrl, setBackendUrl] = useState<string>("");
  const [editingUrl, setEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>("");
  const [lastSyncStr, setLastSyncStr] = useState<string>("Checking...");
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");
  const [language, setLanguage] = useState<string>("English");

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    const offline = await isManualOffline();
    setManualOfflineActive(offline);

    const url = await getApiBaseUrl();
    setBackendUrl(url);
    setTempUrl(url);

    const lang = await getSetting(SETTING_KEYS.LANGUAGE, "English");
    setLanguage(lang);

    const lastSync = await getSetting(SETTING_KEYS.LAST_SYNC, "");
    setLastSyncStr(formatTimeAgo(lastSync));

    const reach = await checkBackendReachability();
    setBackendStatus(reach.reachable ? "Reachable" : "Offline / Unreachable");
  };

  const handleToggleManualOffline = async (val: boolean) => {
    setManualOfflineActive(val);
    await setManualOffline(val);
  };

  const handleSaveBackendUrl = async () => {
    if (!tempUrl.trim()) return;
    await setApiBaseUrl(tempUrl.trim());
    setBackendUrl(tempUrl.trim());
    setEditingUrl(false);
    await loadSettingsData();
  };

  const handleClearPersonalData = () => {
    Alert.alert(
      "Erase All Local Data",
      "This will permanently delete all locally stored trusted contacts, checklist completion records, and saved SOS drafts on this phone.\n\nAre you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase All Data",
          style: "destructive",
          onPress: async () => {
            await clearAllPersonalData();
            Alert.alert("Data Cleared", "All local personal records were wiped successfully.");
            await loadSettingsData();
          },
        },
      ]
    );
  };

  return (
    <SafeScreen>
      <Header
        title="SETTINGS & PRIVACY"
        subtitle="Network, Storage & Data Controls"
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Offline Mode Master Toggle */}
        <Card highlight>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Manual Offline Mode</Text>
              <Text style={styles.toggleSubtitle}>
                Forces app to operate strictly with on-device SQLite records and deterministic safety rules. Disables all outbound network calls.
              </Text>
            </View>
            <Switch
              value={manualOfflineActive}
              onValueChange={handleToggleManualOffline}
              trackColor={{ false: "#374151", true: COLORS.primaryCyan }}
              thumbColor={manualOfflineActive ? COLORS.textDark : "#9CA3AF"}
            />
          </View>
        </Card>

        {/* Backend Configuration & Reachability */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="server" size={20} color={COLORS.primaryCyan} />
            <Text style={styles.sectionHeading}>BACKEND ENDPOINT</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Backend Reachability:</Text>
            <Badge
              label={backendStatus}
              variant={backendStatus === "Reachable" ? "success" : "offline"}
            />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last Successful Sync:</Text>
            <Text style={styles.metaValue}>{lastSyncStr}</Text>
          </View>

          <Text style={[styles.metaLabel, { marginTop: SPACING.sm }]}>API Base URL:</Text>
          {editingUrl ? (
            <View style={{ marginTop: 4 }}>
              <TextInput
                style={styles.urlInput}
                value={tempUrl}
                onChangeText={setTempUrl}
                placeholder="http://127.0.0.1:8000"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
              <View style={styles.urlBtnRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="small"
                  onPress={() => {
                    setTempUrl(backendUrl);
                    setEditingUrl(false);
                  }}
                  style={{ flex: 1, marginRight: SPACING.sm }}
                />
                <Button
                  title="Save URL"
                  variant="primary"
                  size="small"
                  onPress={handleSaveBackendUrl}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.urlDisplayRow}>
              <Text style={styles.urlDisplayText}>{backendUrl}</Text>
              <TouchableOpacity
                onPress={() => setEditingUrl(true)}
                style={styles.editPill}
              >
                <Text style={styles.editPillText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.geminiShortcut}
            onPress={() => router.push("/gemini-settings")}
          >
            <Ionicons name="hardware-chip-outline" size={18} color={COLORS.primaryCyan} />
            <Text style={styles.geminiShortcutText}>
              Configure Gemini AI Mode & Run Connection Test →
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Language Framework */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="language" size={20} color={COLORS.primaryCyan} />
            <Text style={styles.sectionHeading}>LANGUAGE PREFERENCE</Text>
          </View>
          <Text style={styles.langHint}>
            Selected UI & Emergency Instruction Language:
          </Text>
          <View style={styles.langGrid}>
            {["English", "हिंदी (Hindi)", "বাংলা (Bengali)", "தமிழ் (Tamil)"].map((lang) => {
              const isSelected = language.startsWith(lang.split(" ")[0]);
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langChip, isSelected && styles.langChipSelected]}
                  onPress={async () => {
                    setLanguage(lang);
                    await setSetting(SETTING_KEYS.LANGUAGE, lang);
                  }}
                >
                  <Text
                    style={[styles.langChipText, isSelected && styles.langChipTextSelected]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Data Privacy & Storage Disclosures */}
        <Card style={styles.privacyCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primaryCyan} />
            <Text style={styles.sectionHeading}>LOCAL DATA DISCLOSURES</Text>
          </View>
          <Text style={styles.privacyBullet}>
            • <Text style={styles.boldText}>Stored Strictly On This Device:</Text> Trusted contacts, emergency checklist progress, unsent SOS drafts, and local safety rules.
          </Text>
          <Text style={styles.privacyBullet}>
            • <Text style={styles.boldText}>Sent to Backend (Only on Submit):</Text> Emergency reports typed into the AI Assistant when remote AI is enabled.
          </Text>
          <Text style={styles.privacyBullet}>
            • <Text style={styles.boldText}>Location Privacy:</Text> GPS is accessed ONLY when you tap "Attach GPS" or "Get GPS". We do not track your location continuously in the background.
          </Text>

          <Button
            title="Erase All Stored Personal Data"
            variant="outline"
            iconName="trash-outline"
            onPress={handleClearPersonalData}
            style={styles.eraseBtn}
            textStyle={{ color: COLORS.emergencyRed }}
          />
        </Card>

        {/* App Version & Credits */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionTitle}>SURAKSHA AI MOBILE v1.0.0</Text>
          <Text style={styles.versionSub}>
            Built with React Native, Expo, TypeScript & FastAPI
          </Text>
          <Text style={styles.versionSub}>
            National Disaster Awareness Prototype
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleTextCol: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  urlDisplayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 8,
    marginTop: 4,
  },
  urlDisplayText: {
    fontSize: 12,
    color: COLORS.primaryCyan,
    flex: 1,
  },
  editPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.cardElevated,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editPillText: {
    fontSize: 11,
    color: COLORS.primaryCyan,
    fontWeight: "700",
  },
  urlInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  urlBtnRow: {
    flexDirection: "row",
    marginTop: SPACING.xs,
  },
  geminiShortcut: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  geminiShortcutText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryCyan,
    marginLeft: 6,
  },
  langHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  langChip: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  langChipSelected: {
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    borderColor: COLORS.primaryCyan,
  },
  langChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  langChipTextSelected: {
    color: COLORS.primaryCyan,
    fontWeight: "700",
  },
  privacyCard: {
    backgroundColor: "rgba(16, 24, 39, 0.7)",
  },
  privacyBullet: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  boldText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  eraseBtn: {
    marginTop: SPACING.md,
    borderColor: COLORS.emergencyRed,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  versionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  versionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
