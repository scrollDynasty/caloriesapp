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

function ThemePreviewCard({
  mode,
  selected,
  onPress,
  isDarkTheme,
  colors,
}: {
  mode: ThemeMode;
  selected: boolean;
  onPress: () => void;
  isDarkTheme: boolean;
  colors: any;
}) {
  const isDark = mode === "dark";
  
  const previewBg = isDark ? "#1C1C1E" : "#F2F2F7";
  const cardBg = isDark ? "#2C2C2E" : "#FFFFFF";
  const dotColors = ["#FF6B6B", "#34C759", "#007AFF"];
  
  const getLabel = () => {
    return mode === "light" ? "Светлая" : "Тёмная";
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={[
        styles.themeCard,
        { 
          backgroundColor: isDarkTheme ? colors.cardSecondary : colors.card,
          borderColor: selected ? colors.info : "transparent",
        },
        selected && styles.themeCardSelected,
      ]}
    >
      <View style={[styles.themePreview, { backgroundColor: previewBg }]}>
        {/* Moon icon for dark mode preview */}
        {isDark && (
          <View style={styles.themeBadge}>
            <Ionicons name="moon" size={12} color="#FFFFFF" />
          </View>
        )}
        
        {/* Sun icon for light mode preview */}
        {!isDark && (
          <View style={[styles.themeBadge, { backgroundColor: "#FF9500" }]}>
            <Ionicons name="sunny" size={12} color="#FFFFFF" />
          </View>
        )}
        
        {/* Preview cards with colored indicators */}
        <View style={styles.themePreviewContent}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.themePreviewRow, { backgroundColor: cardBg }]}>
              <View style={[styles.themePreviewDot, { backgroundColor: dotColors[index] }]} />
              <View 
                style={[
                  styles.themePreviewLine, 
                  { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }
                ]} 
              />
            </View>
          ))}
        </View>
      </View>
      
      <View style={[styles.themeLabelRow, { backgroundColor: isDarkTheme ? colors.card : "#FAFAFA" }]}>
        <View style={[
          styles.themeRadio,
          { 
            borderColor: selected ? colors.info : colors.border,
            backgroundColor: selected ? colors.info : "transparent",
          }
        ]}>
          {selected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
        </View>
        <Text style={[
          styles.themeLabel, 
          { color: selected ? colors.info : colors.text }
        ]}>
          {getLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function SettingToggle({
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
  colors,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  colors: any;
}) {
  return (
    <>
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={[styles.toggleTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.switchTrackOff}
        />
      </View>
      {!isLast && <View style={[styles.toggleDivider, { backgroundColor: colors.separator }]} />}
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
      if (__DEV__) console.error("Error loading toggle settings:", error);
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
      if (__DEV__) console.error("Error saving toggle settings:", error);
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
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Настройки</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ВНЕШНИЙ ВИД</Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Тема оформления</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Выбери светлую или тёмную тему для приложения
              </Text>
            </View>
            
            <View style={styles.themeSelector}>
              <ThemePreviewCard
                mode="light"
                selected={themeMode === "light"}
                onPress={() => setThemeMode("light")}
                isDarkTheme={isDark}
                colors={colors}
              />
              <ThemePreviewCard
                mode="dark"
                selected={themeMode === "dark"}
                onPress={() => setThemeMode("dark")}
                isDarkTheme={isDark}
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ФУНКЦИИ</Text>
          <View style={[styles.togglesSection, { backgroundColor: colors.card }]}>
            <SettingToggle
              title="Празднования значков"
              subtitle="Показывать полноэкранную анимацию при получении нового значка"
              value={toggleSettings.badgeCelebrations}
              onValueChange={(value) => saveToggleSetting("badgeCelebrations", value)}
              colors={colors}
            />

            <SettingToggle
              title="Живая активность"
              subtitle="Показывать калории и макроэлементы на экране блокировки"
              value={toggleSettings.liveActivity}
              onValueChange={(value) => saveToggleSetting("liveActivity", value)}
              colors={colors}
            />

            <SettingToggle
              title="Добавить сожжённые калории"
              subtitle="Добавить сожжённые калории к суточной норме"
              value={toggleSettings.burnedCalories}
              onValueChange={(value) => saveToggleSetting("burnedCalories", value)}
              colors={colors}
            />

            <SettingToggle
              title="Перенос калорий"
              subtitle="Перенести до 200 калорий с вчерашнего дня"
              value={toggleSettings.calorieRollover}
              onValueChange={(value) => saveToggleSetting("calorieRollover", value)}
              colors={colors}
            />

            <SettingToggle
              title="Авто-корректировка макроэлементов"
              subtitle="Автоматически корректировать макронутриенты при изменении калорий"
              value={toggleSettings.autoMacroAdjust}
              onValueChange={(value) => saveToggleSetting("autoMacroAdjust", value)}
              isLast
              colors={colors}
            />
          </View>
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 32,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionContent: {
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
    lineHeight: 20,
  },
  themeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  themeCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  themeCardSelected: {
    borderWidth: 2,
  },
  themePreview: {
    height: 88,
    padding: 10,
    position: "relative",
  },
  themeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#8E8E93",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  themePreviewContent: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 5,
  },
  themePreviewRow: {
    height: 16,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 6,
  },
  themePreviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themePreviewLine: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
  },
  themeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  themeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  themeLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  togglesSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    marginBottom: 4,
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
