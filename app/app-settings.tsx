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
import { ThemeMode, useTheme } from "../context/ThemeContext";

interface ToggleSettings {
  badgeCelebrations: boolean;
  liveActivity: boolean;
  burnedCalories: boolean;
  calorieRollover: boolean;
  autoMacroAdjust: boolean;
}

const TOGGLE_SETTINGS_KEY = "@caloriesapp:toggle_settings";

// Theme Preview Card - iOS style
function ThemePreviewCard({
  mode,
  selected,
  onPress,
  isDarkTheme,
}: {
  mode: ThemeMode;
  selected: boolean;
  onPress: () => void;
  isDarkTheme: boolean;
}) {
  const isDark = mode === "dark";
  
  // Colors based on mode preview
  const previewBg = isDark ? "#1C1C1E" : "#F5F5F5";
  const cardBg = isDark ? "#2C2C2E" : "#FFFFFF";
  const dotColors = ["#FF6B6B", "#4ECDC4", "#45B7D1"];
  const textColor = isDarkTheme ? "#FFFFFF" : "#000000";
  const secondaryColor = isDarkTheme ? "#8E8E93" : "#8E8E93";
  const borderColor = "#007AFF"; // iOS blue for selected state
  
  const getLabel = () => {
    return mode === "light" ? "Светлая" : "Тёмная";
  };

  const getIconElement = () => {
    return mode === "light" 
      ? <Ionicons name="sunny" size={16} color={selected ? "#007AFF" : secondaryColor} />
      : <Ionicons name="moon" size={16} color={selected ? "#007AFF" : secondaryColor} />;
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={[
        styles.themeCard, 
        selected && [styles.themeCardSelected, { borderColor }],
        { backgroundColor: isDarkTheme ? "#2C2C2E" : "#FFFFFF" }
      ]}
    >
      <View style={[styles.themePreview, { backgroundColor: previewBg }]}>
        {/* Moon badge for dark mode */}
        {isDark && (
          <View style={styles.themeBadge}>
            <Ionicons name="moon" size={14} color="#FFFFFF" />
          </View>
        )}
        
        {/* Preview cards with colored dots */}
        <View style={styles.themePreviewContent}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.themePreviewRow, { backgroundColor: cardBg }]}>
              <View style={[styles.themePreviewDot, { backgroundColor: dotColors[index] }]} />
              <View style={[styles.themePreviewLine, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]} />
            </View>
          ))}
        </View>
      </View>
      
      <View style={[styles.themeLabelRow, { backgroundColor: isDarkTheme ? "#1C1C1E" : "#FFFFFF" }]}>
        {getIconElement()}
        <Text style={[
          styles.themeLabel, 
          selected && styles.themeLabelSelected,
          { color: selected ? "#007AFF" : secondaryColor }
        ]}>
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
  isDark,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  isDark: boolean;
}) {
  const textColor = isDark ? "#FFFFFF" : "#2D2A26";
  const secondaryColor = isDark ? "#8E8E93" : "#8C867D";
  const borderColor = isDark ? "#38383A" : "#E5E5E5";
  const trackColor = isDark ? "#2D2A26" : "#2D2A26";

  return (
    <>
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={[styles.toggleTitle, { color: textColor }]}>{title}</Text>
          <Text style={[styles.toggleSubtitle, { color: secondaryColor }]}>{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: isDark ? "#38383A" : "#E5E5EA", true: trackColor }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={isDark ? "#38383A" : "#E5E5EA"}
        />
      </View>
      {!isLast && <View style={[styles.toggleDivider, { backgroundColor: borderColor }]} />}
    </>
  );
}

export default function AppSettingsScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  
  const [toggleSettings, setToggleSettings] = useState<ToggleSettings>({
    badgeCelebrations: true,
    liveActivity: false,
    burnedCalories: false,
    calorieRollover: false,
    autoMacroAdjust: true,
  });

  useEffect(() => {
    loadToggleSettings();
  }, []);

  const loadToggleSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(TOGGLE_SETTINGS_KEY);
      if (stored) {
        setToggleSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading toggle settings:", error);
    }
  };

  const saveToggleSetting = async <K extends keyof ToggleSettings>(
    key: K,
    value: ToggleSettings[K]
  ) => {
    const newSettings = { ...toggleSettings, [key]: value };
    setToggleSettings(newSettings);
    try {
      await AsyncStorage.setItem(TOGGLE_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error saving toggle settings:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Настройки</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Внешний вид</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
              Выбери светлую или тёмную тему
            </Text>
          </View>
          
          <View style={styles.themeSelector}>
            <ThemePreviewCard
              mode="light"
              selected={themeMode === "light"}
              onPress={() => setThemeMode("light")}
              isDarkTheme={isDark}
            />
            <ThemePreviewCard
              mode="dark"
              selected={themeMode === "dark"}
              onPress={() => setThemeMode("dark")}
              isDarkTheme={isDark}
            />
          </View>
        </View>

        {/* Toggles Section */}
        <View style={[styles.togglesSection, { backgroundColor: colors.card }]}>
          <SettingToggle
            title="Празднования значков"
            subtitle="Показывать полноэкранную анимацию при получении нового значка"
            value={toggleSettings.badgeCelebrations}
            onValueChange={(value) => saveToggleSetting("badgeCelebrations", value)}
            isDark={isDark}
          />

          <SettingToggle
            title="Живая активность"
            subtitle="Показывать твои ежедневные калории и макроэлементы на экране блокировки и динамическом острове"
            value={toggleSettings.liveActivity}
            onValueChange={(value) => saveToggleSetting("liveActivity", value)}
            isDark={isDark}
          />

          <SettingToggle
            title="Добавить сожжённые калории"
            subtitle="Добавить сожжённые калории к суточной норме"
            value={toggleSettings.burnedCalories}
            onValueChange={(value) => saveToggleSetting("burnedCalories", value)}
            isDark={isDark}
          />

          <SettingToggle
            title="Перенос калорий"
            subtitle="Добавить до 200 оставшихся калорий с вчерашнего дня к сегодняшней суточной норме"
            value={toggleSettings.calorieRollover}
            onValueChange={(value) => saveToggleSetting("calorieRollover", value)}
            isDark={isDark}
          />

          <SettingToggle
            title="Автоматическая корректировка макроэлементов"
            subtitle="При редактировании калорий или макронутриентов автоматически пропорционально корректировать остальные значения"
            value={toggleSettings.autoMacroAdjust}
            onValueChange={(value) => saveToggleSetting("autoMacroAdjust", value)}
            isLast
            isDark={isDark}
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
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
    borderRadius: 14,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
  },
  themeCardSelected: {
    borderWidth: 2,
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
    borderRadius: 2,
  },
  themeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
  },
  themeLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  themeLabelSelected: {
    fontFamily: "Inter_600SemiBold",
  },
  // Toggles Section
  togglesSection: {
    marginHorizontal: 16,
    marginTop: 20,
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
    marginBottom: 3,
  },
  toggleSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
