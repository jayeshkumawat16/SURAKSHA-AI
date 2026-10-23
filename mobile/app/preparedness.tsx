import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import {
  getChecklistItems,
  toggleChecklistItem,
  addCustomChecklistItem
} from "../src/storage/guidesRepository";
import { ChecklistItem } from "../src/types";

export default function PreparednessScreen() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const [showAddBox, setShowAddBox] = useState<boolean>(false);

  const loadItems = useCallback(async () => {
    const list = await getChecklistItems();
    setItems(list);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleToggle = async (item: ChecklistItem) => {
    const updated = !item.completed;
    await toggleChecklistItem(item.id, updated);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: updated } : i))
    );
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      Alert.alert("Input Needed", "Please enter a checklist item description.");
      return;
    }
    const created = await addCustomChecklistItem(newItemTitle.trim());
    setItems((prev) => [...prev, created]);
    setNewItemTitle("");
    setShowAddBox(false);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeScreen>
      <Header
        title="EMERGENCY PREPAREDNESS"
        subtitle="Go-Bag & Family Survival Checklist"
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Card */}
        <Card highlight style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressHeading}>SURVIVAL READINESS</Text>
              <Text style={styles.progressSub}>
                {completedCount} of {totalCount} essentials verified
              </Text>
            </View>
            <Text style={styles.percentageText}>{percentage}%</Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
          </View>

          <Text style={styles.safetyDisclaimer}>
            DISCLAIMER: Completing this checklist substantially enhances disaster preparedness,
            but does not guarantee absolute safety under catastrophic conditions.
          </Text>
        </Card>

        {/* Add Custom Item */}
        <View style={styles.addSection}>
          {showAddBox ? (
            <Card style={styles.addCard}>
              <Text style={styles.addTitle}>Add Custom Preparedness Item</Text>
              <TextInput
                style={styles.addInput}
                placeholder="e.g. Baby formula, pet food, emergency cash..."
                placeholderTextColor={COLORS.textMuted}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
              />
              <View style={styles.addBtnRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="small"
                  onPress={() => setShowAddBox(false)}
                  style={{ flex: 1, marginRight: SPACING.sm }}
                />
                <Button
                  title="Add to List"
                  variant="primary"
                  size="small"
                  onPress={handleAddItem}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          ) : (
            <Button
              title="+ Add Custom Supply Item"
              variant="outline"
              iconName="add-circle-outline"
              onPress={() => setShowAddBox(true)}
              style={{ marginBottom: SPACING.md }}
            />
          )}
        </View>

        {/* Checklist Items */}
        <Text style={styles.listHeading}>ESSENTIAL CHECKLIST ITEMS</Text>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handleToggle(item)}
          >
            <Card
              style={[
                styles.itemCard,
                item.completed && styles.itemCardCompleted,
              ]}
            >
              <View style={styles.itemRow}>
                <Ionicons
                  name={item.completed ? "checkbox" : "square-outline"}
                  size={24}
                  color={item.completed ? COLORS.primaryCyan : COLORS.textMuted}
                />
                <View style={styles.itemTextContainer}>
                  <Text
                    style={[
                      styles.itemTitle,
                      item.completed && styles.itemTitleCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.itemBadgeRow}>
                    <Badge
                      label={item.category.toUpperCase()}
                      variant={item.completed ? "success" : "default"}
                    />
                    {item.isCustom && (
                      <Badge label="CUSTOM" variant="cyan" />
                    )}
                  </View>
                </View>
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
  progressCard: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  progressHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    letterSpacing: 0.5,
  },
  progressSub: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  percentageText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primaryCyan,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: SPACING.sm,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primaryCyan,
    borderRadius: 5,
  },
  safetyDisclaimer: {
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
    marginTop: 4,
  },
  addSection: {
    marginBottom: SPACING.xs,
  },
  addCard: {
    backgroundColor: COLORS.cardElevated,
    marginBottom: SPACING.md,
  },
  addTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  addBtnRow: {
    flexDirection: "row",
  },
  listHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  itemCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  itemCardCompleted: {
    borderColor: "rgba(0, 229, 255, 0.3)",
    backgroundColor: "rgba(16, 24, 39, 0.7)",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  itemTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  itemBadgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
});
