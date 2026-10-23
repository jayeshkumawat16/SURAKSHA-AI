import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { getAIMode, setAIMode } from "../src/storage/settingsRepository";
import { checkBackendReachability } from "../src/services/connectivity";
import { postJson } from "../src/services/api";
import { AIMode } from "../src/types";

export default function GeminiSettingsScreen() {
  const [selectedMode, setSelectedMode] = useState<AIMode>("auto");
  const [backendReachable, setBackendReachable] = useState<boolean | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [modelLabel, setModelLabel] = useState<string>("Loading...");
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
    testedAt?: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const mode = await getAIMode();
    setSelectedMode(mode);

    const reach = await checkBackendReachability();
    setBackendReachable(reach.reachable);
    setIsConfigured(reach.geminiConfigured);
    setModelLabel(reach.geminiModel);
  };

  const handleModeChange = async (mode: AIMode) => {
    setSelectedMode(mode);
    await setAIMode(mode);
  };

  const handleTestBackendConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await postJson<{
        success: boolean;
        message: string;
        model: string;
        latency_ms?: number;
      }>("/api/gemini/test", {}, 8000);

      setTestResult({
        success: response.success,
        message: response.message,
        latency: response.latency_ms,
        testedAt: new Date().toLocaleTimeString(),
      });
      // Refresh status
      await loadSettings();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to contact backend /api/gemini/test endpoint.",
        testedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <SafeScreen>
      <Header
        title="AI CONFIGURATION"
        subtitle="Gemini AI & Offline Engine Controls"
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <Card highlight style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>GEMINI BACKEND STATUS</Text>
              <Text style={styles.statusModelText}>{modelLabel}</Text>
            </View>
            <Badge
              label={
                backendReachable === false
                  ? "OFFLINE"
                  : isConfigured
                  ? "CONFIGURED"
                  : "NOT CONFIGURED"
              }
              variant={
                backendReachable === false
                  ? "offline"
                  : isConfigured
                  ? "success"
                  : "severe"
              }
            />
          </View>

          <Text style={styles.statusDesc}>
            {backendReachable === false
              ? "Backend server is unreachable. Mobile app is running exclusively on local reviewed safety rules."
              : isConfigured
              ? "Gemini API key is securely loaded server-side. Remote AI analysis is ready."
              : "Backend server is online, but GEMINI_API_KEY is not configured in backend/.env. Automatic local fallback is active."}
          </Text>

          <Button
            title={testingConnection ? "Pinging Backend..." : "Test Gemini Connection"}
            variant="outline"
            iconName="hardware-chip-outline"
            loading={testingConnection}
            onPress={handleTestBackendConnection}
            style={{ marginTop: SPACING.md }}
          />

          {testResult && (
            <View
              style={[
                styles.testResultBox,
                testResult.success ? styles.testSuccess : styles.testFail,
              ]}
            >
              <View style={styles.testResultHeader}>
                <Ionicons
                  name={testResult.success ? "checkmark-circle" : "alert-circle"}
                  size={18}
                  color={testResult.success ? COLORS.primaryCyan : COLORS.emergencyRed}
                />
                <Text
                  style={[
                    styles.testResultTitle,
                    { color: testResult.success ? COLORS.primaryCyan : COLORS.emergencyRed },
                  ]}
                >
                  {testResult.success ? "Connection Verified" : "Test Notice"}
                </Text>
                {testResult.testedAt && (
                  <Text style={styles.testTimestamp}>{testResult.testedAt}</Text>
                )}
              </View>
              <Text style={styles.testResultMsg}>{testResult.message}</Text>
              {testResult.latency !== undefined && (
                <Text style={styles.testLatency}>Latency: {testResult.latency} ms</Text>
              )}
            </View>
          )}
        </Card>

        {/* AI Mode Selector */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionTitle}>AI OPERATING MODE</Text>
          <Text style={styles.sectionSubtitle}>
            Select how situational emergency reports are processed:
          </Text>

          {/* Mode 1: Automatic */}
          <TouchableOpacity
            style={[styles.modeCard, selectedMode === "auto" && styles.modeCardSelected]}
            onPress={() => handleModeChange("auto")}
          >
            <View style={styles.modeCardHeader}>
              <Ionicons
                name={selectedMode === "auto" ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selectedMode === "auto" ? COLORS.primaryCyan : COLORS.textMuted}
              />
              <Text style={styles.modeName}>Automatic (Recommended)</Text>
            </View>
            <Text style={styles.modeDesc}>
              Attempts Gemini AI analysis when online and configured. Automatically falls back
              to verified deterministic local safety rules without interrupting you if the internet drops or AI is busy.
            </Text>
          </TouchableOpacity>

          {/* Mode 2: Gemini AI */}
          <TouchableOpacity
            style={[styles.modeCard, selectedMode === "gemini" && styles.modeCardSelected]}
            onPress={() => handleModeChange("gemini")}
          >
            <View style={styles.modeCardHeader}>
              <Ionicons
                name={selectedMode === "gemini" ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selectedMode === "gemini" ? COLORS.primaryCyan : COLORS.textMuted}
              />
              <Text style={styles.modeName}>Gemini AI Only</Text>
            </View>
            <Text style={styles.modeDesc}>
              Requires the backend Gemini AI service. If unreachable or unconfigured, displays
              an error notice and offers an explicit one-tap switch to offline rules.
            </Text>
          </TouchableOpacity>

          {/* Mode 3: Offline Safety Engine */}
          <TouchableOpacity
            style={[styles.modeCard, selectedMode === "offline" && styles.modeCardSelected]}
            onPress={() => handleModeChange("offline")}
          >
            <View style={styles.modeCardHeader}>
              <Ionicons
                name={selectedMode === "offline" ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selectedMode === "offline" ? COLORS.primaryCyan : COLORS.textMuted}
              />
              <Text style={styles.modeName}>Offline Safety Engine Only</Text>
            </View>
            <Text style={styles.modeDesc}>
              Completely disables remote AI requests. Evaluates all emergency reports locally
              on-device using reviewed disaster safety rules. Zero data transmission.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Backend Configuration Guide */}
        <Card style={styles.setupCard}>
          <View style={styles.setupHeader}>
            <Ionicons name="key" size={20} color={COLORS.primaryCyan} />
            <Text style={styles.setupTitle}>HOW TO CONFIGURE GEMINI</Text>
          </View>
          <Text style={styles.setupStep}>
            1. Secrets belong strictly on the server, NEVER in the mobile client or app bundle.
          </Text>
          <Text style={styles.setupStep}>
            2. On your host machine running the backend, open{" "}
            <Text style={styles.codeText}>backend/.env</Text>.
          </Text>
          <Text style={styles.setupStep}>
            3. Set <Text style={styles.codeText}>GEMINI_API_KEY=AIzaSy...</Text> and restart the
            FastAPI server with <Text style={styles.codeText}>./start-backend.sh</Text>.
          </Text>
          <Text style={styles.setupStep}>
            4. Tap <Text style={styles.codeText}>Test Gemini Connection</Text> above to verify.
          </Text>
        </Card>

        {/* Security & Privacy Card */}
        <Card style={styles.privacyCard}>
          <View style={styles.setupHeader}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primaryCyan} />
            <Text style={styles.setupTitle}>PRIVACY & ZERO-LEAK GUARANTEE</Text>
          </View>
          <Text style={styles.privacyText}>
            • No API keys are stored on this device.{"\n"}
            • Emergency reports are sent to your configured backend only when remote AI is enabled and you tap submit.{"\n"}
            • No automated background tracking, audio listening, or hidden analytics.
          </Text>
        </Card>
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
  statusCard: {
    marginBottom: SPACING.lg,
  },
  statusHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statusModelText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginTop: 2,
  },
  statusDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  testResultBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  testSuccess: {
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    borderColor: COLORS.primaryCyan,
  },
  testFail: {
    backgroundColor: "rgba(230, 57, 70, 0.08)",
    borderColor: COLORS.emergencyRed,
  },
  testResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  testResultTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 6,
    flex: 1,
  },
  testTimestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  testResultMsg: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  testLatency: {
    fontSize: 11,
    color: COLORS.primaryCyan,
    marginTop: 4,
    fontWeight: "600",
  },
  sectionMargin: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    marginTop: 2,
  },
  modeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modeCardSelected: {
    borderColor: COLORS.primaryCyan,
    backgroundColor: "rgba(0, 229, 255, 0.05)",
  },
  modeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  modeName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  modeDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    paddingLeft: 30,
  },
  setupCard: {
    backgroundColor: "rgba(16, 24, 39, 0.8)",
    marginBottom: SPACING.md,
  },
  setupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  setupTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  setupStep: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  codeText: {
    color: COLORS.primaryCyan,
    fontWeight: "700",
  },
  privacyCard: {
    backgroundColor: "rgba(16, 24, 39, 0.8)",
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
