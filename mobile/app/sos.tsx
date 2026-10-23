import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../src/components/SafeScreen";
import { Header } from "../src/components/Header";
import { Card } from "../src/components/Card";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import {
  composeSOSMessage,
  shareSOSMessage,
  promptAndCallEmergencyServices
} from "../src/services/sos";
import {
  captureCurrentLocation,
  formatLocationAge
} from "../src/services/location";
import {
  getAllContacts,
  saveContact,
  deleteContact
} from "../src/storage/contactsRepository";
import {
  saveLastSOSMessage
} from "../src/storage/guidesRepository";
import { EmergencyLocation, TrustedContact } from "../src/types";

export default function SOSScreen() {
  const [situationText, setSituationText] = useState<string>("I need emergency help.");
  const [manualLocation, setManualLocation] = useState<string>("");
  const [location, setLocation] = useState<EmergencyLocation | null>(null);
  const [locCapturing, setLocCapturing] = useState<boolean>(false);
  const [locStatusMsg, setLocStatusMsg] = useState<string>("GPS not attached (optional)");
  const [composedMessage, setComposedMessage] = useState<string>("");
  const [contacts, setContacts] = useState<TrustedContact[]>([]);

  // Contact Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactRel, setContactRel] = useState<string>("");

  const refreshContacts = useCallback(async () => {
    const list = await getAllContacts();
    setContacts(list);
  }, []);

  useEffect(() => {
    refreshContacts();
    // Always compose a fresh message (current time, no previously captured GPS). Restoring the last
    // saved draft would let an old time/location be shared as if it were current.
    updateMessagePreview(situationText, null, manualLocation);
  }, [refreshContacts]);

  const updateMessagePreview = (
    desc: string,
    loc: EmergencyLocation | null,
    manual: string
  ) => {
    const msg = composeSOSMessage(desc, loc, manual);
    setComposedMessage(msg.text);
    saveLastSOSMessage(msg.text);
  };

  const handleSituationChange = (text: string) => {
    setSituationText(text);
    updateMessagePreview(text, location, manualLocation);
  };

  const handleManualLocationChange = (text: string) => {
    setManualLocation(text);
    updateMessagePreview(situationText, location, text);
  };

  const handleCaptureGPS = async () => {
    setLocCapturing(true);
    const result = await captureCurrentLocation();
    setLocCapturing(false);

    if (result.status === "granted" && result.location) {
      setLocation(result.location);
      const acc = result.location.accuracy ? ` (±${result.location.accuracy}m)` : "";
      setLocStatusMsg(`Captured: ${result.location.latitude}, ${result.location.longitude}${acc}`);
      updateMessagePreview(situationText, result.location, manualLocation);
    } else if (result.status === "denied") {
      Alert.alert(
        "Location Permission Denied",
        "GPS permission was denied. Please type your landmark/street address in the field below."
      );
      setLocStatusMsg("Permission denied. Use landmark field.");
    } else {
      Alert.alert(
        "Location Timeout",
        result.error || "Unable to lock GPS. Please type your location manually."
      );
      setLocStatusMsg("GPS unavailable. Type landmark manually.");
    }
  };

  const handleShareSOS = async () => {
    const result = await shareSOSMessage(composedMessage);
    if (result.error) {
      Alert.alert("Share Failed", result.error);
    } else if (result.opened) {
      Alert.alert(
        "Share Sheet Opened",
        "SURAKSHA AI opened your phone's share sheet. Please complete sending via SMS or WhatsApp to ensure delivery.\n\nNote: Opening the share sheet does NOT automatically guarantee delivery without cellular/network dispatch."
      );
    }
  };

  const handleSaveContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert("Validation Error", "Name and phone number are required.");
      return;
    }

    const cleanPhone = contactPhone.trim();
    if (cleanPhone.length < 5) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number.");
      return;
    }

    const newContact: TrustedContact = {
      id: contactId || `contact-${Date.now()}`,
      name: contactName.trim(),
      phone: cleanPhone,
      relationship: contactRel.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    await saveContact(newContact);
    setModalVisible(false);
    setContactId(null);
    setContactName("");
    setContactPhone("");
    setContactRel("");
    await refreshContacts();
  };

  const handleDeleteContact = (id: string, name: string) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${name} from your offline trusted contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteContact(id);
            await refreshContacts();
          },
        },
      ]
    );
  };

  const openEditContact = (c: TrustedContact) => {
    setContactId(c.id);
    setContactName(c.name);
    setContactPhone(c.phone);
    setContactRel(c.relationship || "");
    setModalVisible(true);
  };

  return (
    <SafeScreen>
      <Header
        title="EMERGENCY SOS & DISPATCH"
        subtitle="Offline Message Preparation & Dialler"
        showBack
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Direct India 112 Dialler Action */}
        <Card emergencyBorder style={styles.diallerCard}>
          <View style={styles.diallerHeader}>
            <View style={styles.diallerIconCircle}>
              <Ionicons name="call" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.diallerTextCol}>
              <Text style={styles.diallerTitle}>CALL EMERGENCY SERVICES (112)</Text>
              <Text style={styles.diallerDesc}>
                Official Single Emergency Helpline for Police, Fire, and Ambulance in India.
              </Text>
            </View>
          </View>
          <Button
            title="Dial 112 (Requires Confirmation)"
            variant="emergency"
            iconName="call"
            size="large"
            onPress={() => promptAndCallEmergencyServices("112")}
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* SOS Message Composer */}
        <Card highlight>
          <Text style={styles.sectionHeaderTitle}>COMPOSE SOS MESSAGE</Text>
          <Text style={styles.sectionSub}>
            Works 100% offline. Prepares an emergency text ready for SMS or messaging apps:
          </Text>

          <Text style={styles.fieldLabel}>Emergency Situation Description:</Text>
          <TextInput
            style={styles.textInput}
            value={situationText}
            onChangeText={handleSituationChange}
            multiline
            numberOfLines={2}
            placeholder="Describe injury, trapped status, water depth, smoke..."
            placeholderTextColor={COLORS.textMuted}
          />

          {/* Location Attachment Options */}
          <View style={styles.locSection}>
            <View style={styles.locHeaderRow}>
              <Text style={styles.fieldLabel}>GPS Coordinates (Optional):</Text>
              <Button
                title={locCapturing ? "Locating..." : location ? "Refresh GPS" : "Attach GPS"}
                variant="outline"
                size="small"
                iconName="navigate"
                loading={locCapturing}
                onPress={handleCaptureGPS}
              />
            </View>
            <Text style={styles.locStatusText}>{locStatusMsg}</Text>
            {location && (
              <Text style={styles.locFreshness}>
                Captured: {formatLocationAge(location.timestamp)}
              </Text>
            )}

            <Text style={[styles.fieldLabel, { marginTop: SPACING.sm }]}>
              Manual Landmark / Street Address (if no GPS):
            </Text>
            <TextInput
              style={styles.singleInput}
              value={manualLocation}
              onChangeText={handleManualLocationChange}
              placeholder="e.g. 2nd floor, Flat 204, Green Heights near Railway Station"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Reviewable Output Preview */}
          <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
            Reviewable SOS Dispatch Text:
          </Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{composedMessage}</Text>
          </View>

          <Button
            title="Share SOS Message via SMS / Apps"
            variant="primary"
            iconName="share-social"
            size="large"
            onPress={handleShareSOS}
            style={{ marginTop: SPACING.md }}
          />
          <Text style={styles.disclaimerNote}>
            * SURAKSHA AI does not silently send messages or place background calls.
            The native system share sheet will open for you to choose recipients.
          </Text>
        </Card>

        {/* Trusted Contacts Management */}
        <Card style={styles.contactsCard}>
          <View style={styles.contactsHeaderRow}>
            <View>
              <Text style={styles.sectionHeaderTitle}>TRUSTED CONTACTS (LOCAL)</Text>
              <Text style={styles.contactsSub}>
                Stored locally on this phone. Never uploaded to servers.
              </Text>
            </View>
            <Button
              title="+ Add"
              size="small"
              variant="outline"
              iconName="person-add"
              onPress={() => {
                setContactId(null);
                setContactName("");
                setContactPhone("");
                setContactRel("");
                setModalVisible(true);
              }}
            />
          </View>

          {contacts.length === 0 ? (
            <View style={styles.emptyContacts}>
              <Ionicons name="people-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No trusted contacts saved yet.</Text>
              <Text style={styles.emptySub}>
                Add family or friends for quick SOS dispatch and phone calls.
              </Text>
            </View>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  {contact.relationship ? (
                    <Text style={styles.contactRel}>{contact.relationship}</Text>
                  ) : null}
                </View>

                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => promptAndCallEmergencyServices(contact.phone)}
                  >
                    <Ionicons name="call" size={20} color={COLORS.primaryCyan} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => openEditContact(contact)}
                  >
                    <Ionicons name="pencil" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDeleteContact(contact.id, contact.name)}
                  >
                    <Ionicons name="trash" size={18} color={COLORS.emergencyRed} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Add / Edit Contact Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {contactId ? "Edit Trusted Contact" : "Add Trusted Contact"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={styles.singleInput}
              value={contactName}
              onChangeText={setContactName}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={styles.singleInput}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="e.g. +91 98765 43210"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.fieldLabel}>Relationship (Optional)</Text>
            <TextInput
              style={styles.singleInput}
              value={contactRel}
              onChangeText={setContactRel}
              placeholder="e.g. Spouse, Parent, Neighbour"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalButtonRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title="Save Contact"
                variant="primary"
                onPress={handleSaveContact}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  diallerCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: "rgba(230, 57, 70, 0.12)",
  },
  diallerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  diallerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.emergencyRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  diallerTextCol: {
    flex: 1,
  },
  diallerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  diallerDesc: {
    fontSize: 11,
    color: "#FFCCCC",
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primaryCyan,
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 50,
  },
  singleInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  locSection: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: "rgba(16, 24, 39, 0.6)",
    borderRadius: 8,
  },
  locHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locStatusText: {
    fontSize: 11,
    color: COLORS.primaryCyan,
    marginTop: 2,
  },
  locFreshness: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  previewBox: {
    backgroundColor: "#070D1F",
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
  },
  previewText: {
    fontSize: 12,
    color: "#E2E8F0",
    lineHeight: 18,
    fontFamily: "monospace",
  },
  disclaimerNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    lineHeight: 14,
  },
  contactsCard: {
    marginTop: SPACING.sm,
  },
  contactsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  contactsSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyContacts: {
    padding: SPACING.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  contactPhone: {
    fontSize: 12,
    color: COLORS.primaryCyan,
    marginTop: 1,
  },
  contactRel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: SPACING.sm,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: 14,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  modalButtonRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
  },
});
