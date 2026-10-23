import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { ALL_EMERGENCY_GUIDES } from "../src/data/emergencyGuides";
import { promptAndCallEmergencyServices } from "../src/services/sos";
import { EmergencyGuide } from "../src/types";

export default function GuidesScreen() {
  const [selectedGuide, setSelectedGuide] = useState<EmergencyGuide | null>(null);

  return (
    <SafeScreen>
      <Header
        title="OFFLINE SAFETY GUIDES"
        subtitle="Reviewed National Disaster Protocols"
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.infoBanner}>
          <View style={styles.bannerHeader}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primaryCyan} />
            <Text style={styles.bannerTitle}>100% OFFLINE AVAILABILITY</Text>
          </View>
          <Text style={styles.bannerText}>
            These protocols are stored on your phone and require zero network or AI backend connection.
            Reviewed against National Disaster Management Guidelines.
          </Text>
        </Card>

        {/* Selected Guide Detail View */}
        {selectedGuide && (
          <Card highlight style={styles.guideDetailCard}>
            <View style={styles.guideDetailHeader}>
              <View style={styles.titleGroup}>
                <Text style={styles.detailTitle}>{selectedGuide.title}</Text>
                <Badge label="OFFLINE PROTOCOL" variant="cyan" />
              </View>
              <TouchableOpacity onPress={() => setSelectedGuide(null)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.summaryText}>{selectedGuide.shortSummary}</Text>

            {/* Immediate Actions */}
            <View style={styles.guideSection}>
              <Text style={styles.sectionHeading}>IMMEDIATE ACTIONS (DO THIS):</Text>
              {selectedGuide.immediateDo.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primaryCyan} style={styles.iconBullet} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Immediate Avoid */}
            <View style={styles.guideSection}>
              <Text style={[styles.sectionHeading, { color: COLORS.emergencyRed }]}>
                DANGERS TO AVOID (DO NOT DO):
              </Text>
              {selectedGuide.immediateAvoid.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="close-circle" size={16} color={COLORS.emergencyRed} style={styles.iconBullet} />
                  <Text style={[styles.bulletText, { color: "#FFAAAA" }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Post incident */}
            <View style={styles.guideSection}>
              <Text style={styles.sectionHeading}>NEXT STEPS:</Text>
              {selectedGuide.postIncidentSteps.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="arrow-forward-circle" size={16} color={COLORS.textSecondary} style={styles.iconBullet} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Emergency Advice */}
            <View style={styles.emergencyAdviceBox}>
              <Text style={styles.emergencyAdviceTitle}>WHEN TO CALL 112:</Text>
              <Text style={styles.emergencyAdviceText}>
                {selectedGuide.emergencyServicesAdvice}
              </Text>
              <TouchableOpacity
                style={styles.call112Btn}
                onPress={() => promptAndCallEmergencyServices("112")}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.call112Text}>Call 112 (Confirm First)</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Guides Grid List */}
        <Text style={styles.listHeading}>AVAILABLE EMERGENCY TOPICS</Text>

        {ALL_EMERGENCY_GUIDES.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            activeOpacity={0.8}
            onPress={() => setSelectedGuide(guide)}
          >
            <Card style={styles.guideCard}>
              <View style={styles.cardRow}>
                <View style={styles.guideIconWrapper}>
                  <Ionicons
                    name={
                      guide.hazard === "earthquake"
                        ? "pulse"
                        : guide.hazard === "flood"
                        ? "water"
                        : guide.hazard === "fire"
                        ? "flame"
                        : guide.hazard === "cyclone"
                        ? "thunderstorm"
                        : guide.hazard === "medical"
                        ? "medkit"
                        : "shield"
                    }
                    size={24}
                    color={COLORS.primaryCyan}
                  />
                </View>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideTitle}>{guide.title}</Text>
                  <Text style={styles.guideSummary} numberOfLines={2}>
                    {guide.shortSummary}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
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
  infoBanner: {
    backgroundColor: "rgba(16, 24, 39, 0.9)",
    borderColor: COLORS.primaryCyan,
    marginBottom: SPACING.md,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  bannerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  listHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  guideCard: {
    marginBottom: SPACING.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  guideInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  guideSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  guideDetailCard: {
    marginBottom: SPACING.lg,
  },
  guideDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  titleGroup: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.primaryCyan,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  guideSection: {
    marginBottom: SPACING.md,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  iconBullet: {
    marginTop: 2,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  emergencyAdviceBox: {
    backgroundColor: "rgba(230, 57, 70, 0.15)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.emergencyRed,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  emergencyAdviceTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.emergencyRed,
    marginBottom: 4,
  },
  emergencyAdviceText: {
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 17,
  },
  call112Btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.emergencyRed,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: SPACING.sm,
  },
  call112Text: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 6,
  },
});
