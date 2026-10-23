import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { fetchResources } from "../src/services/resources";
import { promptAndCallEmergencyServices } from "../src/services/sos";
import { generateGoogleMapsUrl } from "../src/services/location";
import { LifelineResource, ResourceCategory } from "../src/types";

const CATEGORIES: { label: string; value: ResourceCategory | "all"; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "All", value: "all", icon: "grid-outline" },
  { label: "Hospitals", value: "hospital", icon: "medkit-outline" },
  { label: "Shelters", value: "shelter", icon: "home-outline" },
  { label: "Food & Water", value: "food_water", icon: "water-outline" },
  { label: "Relief Posts", value: "relief_center", icon: "business-outline" },
  { label: "Supplies", value: "supplies", icon: "cube-outline" },
  { label: "Emergency", value: "emergency_service", icon: "flame-outline" },
];

export default function LifelineMapScreen() {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | "all">("all");
  const [resources, setResources] = useState<LifelineResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<LifelineResource | null>(null);

  const loadResources = useCallback(async (cat: ResourceCategory | "all") => {
    setLoading(true);
    const result = await fetchResources(cat);
    setResources(result.resources);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadResources(selectedCategory);
  }, [selectedCategory, loadResources]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources(selectedCategory);
    setRefreshing(false);
  };

  const handleOpenNativeMap = (lat: number, lon: number, name: string) => {
    const url = generateGoogleMapsUrl(lat, lon);
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Map App Unavailable", `Cannot open map link on this device: ${url}`);
      }
    });
  };

  return (
    <SafeScreen>
      <Header
        title="LIFELINE MAP & RELIEF"
        subtitle="Hospitals, Shelters & Relief Centres"
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
        {/* Native Map Integration Notice */}
        <Card style={styles.mapNoticeCard}>
          <View style={styles.noticeHeader}>
            <Ionicons name="map" size={22} color={COLORS.primaryCyan} />
            <Text style={styles.noticeTitle}>NATIVE LIFELINE DIRECTORY & GPS</Text>
          </View>
          <Text style={styles.noticeText}>
            Direct navigation uses your device's native Maps application via coordinates.
            All demo facilities below display <Text style={styles.boldDemo}>DEMO — NOT VERIFIED</Text>.
            Never assume the nearest shelter is safest—always check for waterlogged roads or debris before travelling.
          </Text>
        </Card>

        {/* Category Horizontal Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? COLORS.textDark : COLORS.primaryCyan}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Resource Detail Modal Card */}
        {selectedItem && (
          <Card highlight style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailName}>{selectedItem.name}</Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <Badge label="DEMO — NOT VERIFIED" variant="demo" />
              <Badge
                label={`STATUS: ${selectedItem.operating_status.toUpperCase()}`}
                variant={selectedItem.operating_status === "open" ? "success" : "moderate"}
              />
            </View>

            <Text style={styles.detailAddress}>{selectedItem.address}</Text>

            {selectedItem.notes && (
              <Text style={styles.detailNotes}>ℹ️ {selectedItem.notes}</Text>
            )}

            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaText}>Source: {selectedItem.source}</Text>
              <Text style={styles.detailMetaText}>
                Verified: {new Date(selectedItem.last_verified).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.actionBtnRow}>
              <Button
                title="Open in Maps"
                variant="primary"
                iconName="navigate"
                size="small"
                onPress={() =>
                  handleOpenNativeMap(
                    selectedItem.latitude,
                    selectedItem.longitude,
                    selectedItem.name
                  )
                }
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              {selectedItem.phone && (
                <Button
                  title="Call"
                  variant="outline"
                  iconName="call"
                  size="small"
                  onPress={() => promptAndCallEmergencyServices(selectedItem.phone!)}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </Card>
        )}

        {/* Resource List Cards */}
        <Text style={styles.listHeading}>
          {resources.length} RELIEF LOCATIONS FOUND
        </Text>

        {resources.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => setSelectedItem(item)}
          >
            <Card style={styles.resourceCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.resourceName}>{item.name}</Text>
                  <Text style={styles.resourceAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
                <Badge label="DEMO — NOT VERIFIED" variant="demo" />
              </View>

              <View style={styles.cardBottomRow}>
                <View style={styles.coordsCol}>
                  <Ionicons name="location-sharp" size={14} color={COLORS.primaryCyan} />
                  <Text style={styles.coordsText}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.openMapPill}
                  onPress={() =>
                    handleOpenNativeMap(item.latitude, item.longitude, item.name)
                  }
                >
                  <Text style={styles.openMapText}>Navigate</Text>
                  <Ionicons name="open-outline" size={14} color={COLORS.primaryCyan} />
                </TouchableOpacity>
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
  mapNoticeCard: {
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
  categoryScroll: {
    marginBottom: SPACING.md,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 6,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primaryCyan,
    borderColor: COLORS.primaryCyan,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  categoryChipTextSelected: {
    color: COLORS.textDark,
  },
  detailCard: {
    marginBottom: SPACING.md,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: SPACING.xs,
  },
  detailAddress: {
    fontSize: 13,
    color: COLORS.primaryCyan,
    marginTop: 2,
  },
  detailNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
  detailMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailMetaText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  actionBtnRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
  },
  listHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  resourceCard: {
    marginBottom: SPACING.sm,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  resourceAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  coordsCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  coordsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  openMapPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
  },
  openMapText: {
    fontSize: 11,
    color: COLORS.primaryCyan,
    fontWeight: "700",
    marginRight: 4,
  },
});
