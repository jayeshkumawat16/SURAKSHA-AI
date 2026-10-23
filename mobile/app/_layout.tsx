import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../src/constants/theme";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primaryCyan,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={typeof color === "string" ? color : COLORS.textMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning" size={size} color={typeof color === "string" ? color : COLORS.textMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="lifeline-map"
        options={{
          title: "Map & Relief",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={typeof color === "string" ? color : COLORS.textMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={typeof color === "string" ? color : COLORS.textMuted} />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={COLORS.emergencyRed} />
          ),
          tabBarActiveTintColor: COLORS.emergencyRed,
        }}
      />

      {/* Auxiliary screens hidden from bottom tabs but directly navigable */}
      <Tabs.Screen
        name="guides"
        options={{
          href: null,
          title: "Guides",
        }}
      />
      <Tabs.Screen
        name="preparedness"
        options={{
          href: null,
          title: "Preparedness",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "Settings",
        }}
      />
      <Tabs.Screen
        name="gemini-settings"
        options={{
          href: null,
          title: "Gemini AI Settings",
        }}
      />
    </Tabs>
  );
}
