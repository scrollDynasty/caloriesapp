import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/theme";

type ThemeMode = "system" | "light" | "dark";

interface SettingsState {
  theme: ThemeMode;
  badgeCelebrations: boolean;
  liveActivity: boolean;
  burnedCalories: boolean;
  calorieRollover: boolean;
  autoMacroAdjust: boolean;
}

const SETTINGS_KEY = "@caloriesapp:app_settings";
const THEME_KEY = "@caloriesapp:theme_mode";

// Theme Preview Card - matching the screenshot exactly
function ThemePreviewCard({
  mode,
  selected,
  onPress,
}: {
  mode: ThemeMode;
  selected: boolean;
  onPress: () => void;
}) {
  const isDark = mode === "dark";
  const isSystem = mode === "system";
  const isLight = mode === "light";
  
  // Colors based on mode preview
  const previewBg = isDark ? "#1C1C1E" : "#F5F5F5";
  const cardBg = isDark ? "#2C2C2E" : "#FFFFFF";
  const dotColors = ["#FF6B6B", "#4ECDC4", "#45B7D1"];
  
  const getLabel = () => {
    switch (mode) {
      case "system": return "Система";
      case "light": return "Легкий";
      case "dark": return "Темный";
    }
  };

  // Icons matching the screenshot
  const getIconElement = () => {
    switch (mode) {
      case "system":
        return <Ionicons name="contrast" size={14} color={selected ? colors.primary : colors.secondary} />;
      case "light":
        return <Text style={styles.themeIconEmoji}>☀️</Text>;
      case "dark":
        return <Ionicons name="moon" size={14} color={selected ? colors.primary : colors.secondary} />;
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={[styles.themeCard, selected && styles.themeCardSelected]}
    >
      <View style={[styles.themePreview, { backgroundColor: previewBg }]}>
        {/* Moon badge for dark mode */}
        {isDark && (
          <View style={styles.themeBadge}>
            <Ionicons name="moon" size={14} color="#FFFFFF" />
          </View>
        )}
        
        {/* Light mode has sun badge when selected */}
        {isLight && selected && (
          <View style={[styles.themeBadge, { backgroundColor: "transparent" }]}>
            <Ionicons name="ellipse" size={16} color={colors.primary} />
          </View>
        )}
        
        {/* Preview cards with colored dots */}
        <View style={styles.themePreviewContent}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.themePreviewRow, { backgroundColor: cardBg }]}>
              <View style={[styles.themePreviewDot, { backgroundColor: dotColors[index] }]} />
              <View style={styles.themePreviewLine} />
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.themeLabelRow}>
        {getIconElement()}
        <Text style={[styles.themeLabel, selected && styles.themeLabelSelected]}>
          {getLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Setting Toggle Row
function SettingToggle({
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <>
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleSubtitle}>{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#E5E5EA", true: colors.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E5EA"
        />
      </View>
      {!isLast && <View style={styles.toggleDivider} />}
    </>
  );
}

export default function AppSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsState>({
    theme: "light",
    badgeCelebrations: true,
    liveActivity: false,
    burnedCalories: false,
    calorieRollover: false,
    autoMacroAdjust: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [storedSettings, storedTheme] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(THEME_KEY),
      ]);
      
      let parsed = settings;
      if (storedSettings) {
        parsed = JSON.parse(storedSettings);
      }
      if (storedTheme) {
        parsed.theme = storedTheme as ThemeMode;
      }
      setSettings(parsed);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (newSettings: SettingsState) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings)),
        AsyncStorage.setItem(THEME_KEY, newSettings.theme),
      ]);
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Внешний вид</Text>
            <Text style={styles.sectionSubtitle}>Выбери светлый, тёмный или системный режим</Text>
          </View>
          
          <View style={styles.themeSelector}>
            <ThemePreviewCard
              mode="system"
              selected={settings.theme === "system"}
              onPress={() => updateSetting("theme", "system")}
            />
            <ThemePreviewCard
              mode="light"
              selected={settings.theme === "light"}
              onPress={() => updateSetting("theme", "light")}
            />
            <ThemePreviewCard
              mode="dark"
              selected={settings.theme === "dark"}
              onPress={() => updateSetting("theme", "dark")}
            />
          </View>
        </View>

        {/* Toggles Section */}
        <View style={styles.togglesSection}>
          <SettingToggle
            title="Празднования значков"
            subtitle="Показывать полноэкранную анимацию при получении нового значка"
            value={settings.badgeCelebrations}
            onValueChange={(value) => updateSetting("badgeCelebrations", value)}
          />

          <SettingToggle
            title="Живая активность"
            subtitle="Показывать твои ежедневные калории и макроэлементы на экране блокировки и динамическом острове"
            value={settings.liveActivity}
            onValueChange={(value) => updateSetting("liveActivity", value)}
          />

          <SettingToggle
            title="Добавить сожжённые калории"
            subtitle="Добавить сожжённые калории к суточной норме"
            value={settings.burnedCalories}
            onValueChange={(value) => updateSetting("burnedCalories", value)}
          />

          <SettingToggle
            title="Перенос калорий"
            subtitle="Добавить до 200 оставшихся калорий с вчерашнего дня к сегодняшней суточной норме"
            value={settings.calorieRollover}
            onValueChange={(value) => updateSetting("calorieRollover", value)}
          />

          <SettingToggle
            title="Автоматическая корректировка макроэлементов"
            subtitle="При редактировании калорий или макронутриентов автоматически пропорционально корректировать остальные значения"
            value={settings.autoMacroAdjust}
            onValueChange={(value) => updateSetting("autoMacroAdjust", value)}
            isLast
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  // Section
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
  },
  // Theme Selector
  themeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  themeCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#F5F5F5",
  },
  themeCardSelected: {
    borderColor: colors.primary,
  },
  themePreview: {
    height: 80,
    padding: 8,
    position: "relative",
  },
  themeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 1,
  },
  themePreviewContent: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 4,
  },
  themePreviewRow: {
    height: 14,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 4,
  },
  themePreviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  themePreviewLine: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 2,
  },
  themeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  themeIconEmoji: {
    fontSize: 12,
  },
  themeLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  themeLabelSelected: {
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  // Toggles Section
  togglesSection: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
    marginBottom: 3,
  },
  toggleSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    lineHeight: 18,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5E5",
    marginLeft: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
