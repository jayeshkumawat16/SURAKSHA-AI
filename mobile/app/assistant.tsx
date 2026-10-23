import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { requestEmergencyAnalysis } from "../src/services/assistant";
import { promptAndCallEmergencyServices } from "../src/services/sos";
import { getAIMode, setAIMode } from "../src/storage/settingsRepository";
import { AIMode, AssistantResponse } from "../src/types";

export default function AssistantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ report?: string; hazard?: string }>();

  const [inputReport, setInputReport] = useState<string>(params.report || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiMode, setAiModeState] = useState<AIMode>("auto");
  const [previousHazard, setPreviousHazard] = useState<string | undefined>(params.hazard);

  useEffect(() => {
    // Load the saved engine choice first so an auto-submitted report honours "Offline Only".
    getAIMode().then((savedMode) => {
      setAiModeState(savedMode);
      if (params.report) {
        handleAnalyze(params.report, false, savedMode);
      }
    });
  }, [params.report]);

  const handleAnalyze = async (
    reportText?: string,
    isUpdate: boolean = false,
    modeOverride?: AIMode
  ) => {
    const textToSubmit = reportText || inputReport;
    if (!textToSubmit.trim()) {
      Alert.alert("Input Needed", "Please type what is happening in your area.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await requestEmergencyAnalysis({
      report: textToSubmit,
      previous_hazard: previousHazard,
      is_situation_update: isUpdate,
      force_mode: modeOverride ?? aiMode,
    });

    setLoading(false);

    if (result.success && result.data) {
      setResponse(result.data);
      setPreviousHazard(result.data.hazard);
    } else {
      setErrorMsg(result.error || "Could not complete analysis.");
    }
  };

  const handleSituationUpdate = (updateScenario: string) => {
    if (loading) return;
    // Backend rejects reports over 1000 chars (HTTP 422); keep the most recent 1000.
    const updatedText = `${inputReport ? inputReport + ". " : ""}UPDATE: ${updateScenario}`.slice(-1000);
    setInputReport(updatedText);
    handleAnalyze(updatedText, true);
  };

  const handleSwitchToOffline = async () => {
    await setAIMode("offline");
    setAiModeState("offline");
    setErrorMsg(null);
    // Pass the mode explicitly: aiMode state has not updated yet inside this closure.
    handleAnalyze(inputReport, false, "offline");
  };

  return (
    <SafeScreen>
      <Header
        title="AI SAFETY ASSISTANT"
        subtitle="Situation-Aware Emergency Guidance"
        showBack
        rightAction={{
          icon: "settings-outline",
          onPress: () => router.push("/gemini-settings"),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mode Selector Pill Row */}
        <View style={styles.modeRow}>
          <Text style={styles.modeLabel}>AI ENGINE:</Text>
          <TouchableOpacity
            style={[styles.modePill, aiMode === "auto" && styles.modePillActive]}
            onPress={() => {
              setAiModeState("auto");
              setAIMode("auto");
            }}
          >
            <Text style={[styles.modePillText, aiMode === "auto" && styles.modePillTextActive]}>
              Auto (Gemini + Offline)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, aiMode === "offline" && styles.modePillActive]}
            onPress={() => {
              setAiModeState("offline");
              setAIMode("offline");
            }}
          >
            <Text style={[styles.modePillText, aiMode === "offline" && styles.modePillTextActive]}>
              Offline Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Card */}
        <Card highlight>
          <Text style={styles.inputTitle}>Emergency Situation Report</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe what is happening (e.g., rising flood water, tremor, smoke in hall, trapped on 2nd floor)..."
            placeholderTextColor={COLORS.textMuted}
            value={inputReport}
            onChangeText={setInputReport}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <View style={styles.inputButtonRow}>
            <Button
              title={loading ? "Analyzing..." : "Evaluate Safety Plan"}
              variant="primary"
              iconName="shield-checkmark"
              loading={loading}
              onPress={() => handleAnalyze()}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Error State with retained report */}
        {errorMsg && (
          <Card emergencyBorder>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={24} color={COLORS.emergencyRed} />
              <Text style={styles.errorTitle}>Analysis Request Failed</Text>
            </View>
            <Text style={styles.errorBody}>{errorMsg}</Text>
            <Text style={styles.errorHint}>
              Your report was preserved. You can switch to the local offline safety engine immediately:
            </Text>
            <Button
              title="Use Local Offline Safety Engine"
              variant="outline"
              iconName="cloud-offline"
              onPress={handleSwitchToOffline}
              style={{ marginTop: SPACING.sm }}
            />
          </Card>
        )}

        {/* Quick Situation Update Buttons */}
        {response && (
          <View style={styles.updateSection}>
            <Text style={styles.updateSectionTitle}>UPDATE MY SITUATION</Text>
            <Text style={styles.updateSectionHint}>
              Conditions changed? Tap below to adjust guidance:
            </Text>
            <View style={styles.updateChipsRow}>
              <TouchableOpacity
                style={styles.updateChip}
                onPress={() => handleSituationUpdate("Water is rising rapidly")}
              >
                <Ionicons name="water" size={14} color={COLORS.primaryCyan} />
                <Text style={styles.updateChipText}>Rising Water</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateChip}
                onPress={() => handleSituationUpdate("Stairs / primary exit blocked")}
              >
                <Ionicons name="close-circle" size={14} color={COLORS.primaryCyan} />
                <Text style={styles.updateChipText}>Exit Blocked</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateChip}
                onPress={() => handleSituationUpdate("Heavy smoke filling room")}
              >
                <Ionicons name="flame" size={14} color={COLORS.primaryCyan} />
                <Text style={styles.updateChipText}>Smoke Detected</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateChip}
                onPress={() => handleSituationUpdate("Someone is severely injured")}
              >
                <Ionicons name="medkit" size={14} color={COLORS.emergencyRed} />
                <Text style={[styles.updateChipText, { color: COLORS.emergencyRed }]}>
                  Severe Injury
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateChip}
                onPress={() => handleSituationUpdate("Power lost, in total darkness")}
              >
                <Ionicons name="flash-off" size={14} color={COLORS.primaryCyan} />
                <Text style={styles.updateChipText}>Power Outage</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Evaluated Safety Plan Output */}
        {response && (
          <View style={styles.planContainer}>
            {/* Header info */}
            <Card style={styles.resultCard}>
              <View style={styles.resultHeaderRow}>
                <View>
                  <Text style={styles.hazardTitle}>{response.hazard}</Text>
                  <Text style={styles.urgencyText}>
                    Urgency: {response.urgency.toUpperCase()}
                  </Text>
                </View>
                <Badge
                  label={
                    response.source_mode === "gemini"
                      ? "GEMINI AI"
                      : "LOCAL SAFETY ENGINE"
                  }
                  variant={response.source_mode === "gemini" ? "cyan" : "offline"}
                />
              </View>

              <Text style={styles.summaryText}>{response.summary}</Text>
            </Card>

            {/* Emergency 112 Banner if in danger */}
            {response.contact_emergency_services && (
              <Card emergencyBorder style={styles.callCard}>
                <View style={styles.callRow}>
                  <Ionicons name="call" size={26} color={COLORS.emergencyRed} />
                  <View style={styles.callTextCol}>
                    <Text style={styles.callTitle}>Call Emergency Services (112)</Text>
                    <Text style={styles.callDesc}>
                      Life-safety risk detected. Call emergency authorities immediately.
                    </Text>
                  </View>
                </View>
                <Button
                  title="Call 112 (Confirm First)"
                  variant="emergency"
                  iconName="call"
                  onPress={() => promptAndCallEmergencyServices("112")}
                  style={{ marginTop: SPACING.sm }}
                />
              </Card>
            )}

            {/* Immediate Actions */}
            <Card>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="flash" size={20} color={COLORS.primaryCyan} />
                <Text style={styles.sectionHeading}>IMMEDIATE SURVIVAL ACTIONS</Text>
              </View>
              {response.immediate_actions.map((action, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.stepNum}>{idx + 1}.</Text>
                  <Text style={styles.bulletText}>{action}</Text>
                </View>
              ))}
            </Card>

            {/* Things to Avoid */}
            {response.avoid_actions && response.avoid_actions.length > 0 && (
              <Card emergencyBorder>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="hand-left" size={20} color={COLORS.emergencyRed} />
                  <Text style={[styles.sectionHeading, { color: COLORS.emergencyRed }]}>
                    THINGS TO AVOID
                  </Text>
                </View>
                {response.avoid_actions.map((avoid, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons name="close" size={16} color={COLORS.emergencyRed} style={{ marginTop: 2 }} />
                    <Text style={[styles.bulletText, { color: "#FFAAAA" }]}>{avoid}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Next Steps */}
            {response.next_actions && response.next_actions.length > 0 && (
              <Card>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="arrow-forward-circle" size={20} color={COLORS.primaryCyan} />
                  <Text style={styles.sectionHeading}>SUBSEQUENT ACTIONS</Text>
                </View>
                {response.next_actions.map((step, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons name="checkmark" size={16} color={COLORS.primaryCyan} style={{ marginTop: 2 }} />
                    <Text style={styles.bulletText}>{step}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Uncertainty and Follow Up */}
            <Card style={styles.uncertaintyCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="help-circle" size={20} color={COLORS.textSecondary} />
                <Text style={[styles.sectionHeading, { color: COLORS.textSecondary }]}>
                  UNCERTAINTY & QUESTIONS
                </Text>
              </View>
              <Text style={styles.uncertaintyText}>{response.uncertainty}</Text>
              {response.follow_up_questions && response.follow_up_questions.length > 0 && (
                <View style={{ marginTop: SPACING.sm }}>
                  {response.follow_up_questions.map((q, idx) => (
                    <Text key={idx} style={styles.questionText}>
                      • {q}
                    </Text>
                  ))}
                </View>
              )}
            </Card>

            {/* Legal / Medical Safety Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>{response.safety_disclaimer}</Text>
            </View>
          </View>
        )}
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
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginRight: SPACING.sm,
    letterSpacing: 0.5,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  modePillActive: {
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    borderColor: COLORS.primaryCyan,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  modePillTextActive: {
    color: COLORS.primaryCyan,
  },
  inputTitle: {
    fontSize: TYPOGRAPHY.sizeSubheader,
    fontWeight: "700",
    color: COLORS.primaryCyan,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizeBody,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: SPACING.md,
  },
  inputButtonRow: {
    flexDirection: "row",
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.emergencyRed,
    marginLeft: SPACING.xs,
  },
  errorBody: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  errorHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  updateSection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  updateSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  updateSectionHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  updateChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  updateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
    marginBottom: 6,
  },
  updateChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryCyan,
    marginLeft: 4,
  },
  planContainer: {
    marginTop: SPACING.sm,
  },
  resultCard: {
    backgroundColor: "rgba(16, 24, 39, 0.95)",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryCyan,
  },
  resultHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  hazardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.statusWarning,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  callCard: {
    padding: SPACING.md,
  },
  callRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  callTextCol: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  callTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  callDesc: {
    fontSize: 11,
    color: "#FFAAAA",
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.xs,
  },
  stepNum: {
    width: 20,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primaryCyan,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  uncertaintyCard: {
    backgroundColor: "rgba(16, 24, 39, 0.6)",
  },
  uncertaintyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  questionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  disclaimerBox: {
    padding: SPACING.md,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  disclaimerText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
});
