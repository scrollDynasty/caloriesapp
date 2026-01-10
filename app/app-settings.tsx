import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSettings, useAppSettings } from "../context/AppSettingsContext";
import { useLanguage } from "../context/LanguageContext";
import { ThemeMode, useTheme } from "../context/ThemeContext";
import { hapticLight } from "../utils/haptics";

function ThemePreviewCard({
  mode,
  selected,
  onPress,
  isDarkTheme,
  colors,
  t,
}: {
  mode: ThemeMode;
  selected: boolean;
  onPress: () => void;
  isDarkTheme: boolean;
  colors: any;
  t: (key: string) => string;
}) {
  const isDark = mode === "dark";
  
  const previewBg = isDark ? "#1C1C1E" : "#F2F2F7";
  const cardBg = isDark ? "#2C2C2E" : "#FFFFF0";
  const dotColors = ["#FF6B6B", "#34C759", "#007AFF"];
  
  const getLabel = () => {
    return mode === "light" ? t('appSettings.themeLight') : t('appSettings.themeDark');
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
        {isDark && (
          <View style={styles.themeBadge}>
            <Ionicons name="moon" size={12} color="#FFFFF0" />
          </View>
        )}
        
        {!isDark && (
          <View style={[styles.themeBadge, { backgroundColor: "#FF9500" }]}>
            <Ionicons name="sunny" size={12} color="#FFFFF0" />
          </View>
        )}
        
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
          {selected && <Ionicons name="checkmark" size={12} color="#FFFFF0" />}
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
  disabled = false,
  colors,
  isDark,
  extra,
  statusBadge,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
  colors: any;
  isDark: boolean;
  extra?: React.ReactNode;
  statusBadge?: { text: string; color: string };
}) {
  const iosGreen = "#34C759"; 
  
  return (
    <>
      <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
        <View style={styles.toggleInfo}>
          <View style={styles.toggleTitleRow}>
            <Text style={[styles.toggleTitle, { color: disabled ? colors.textTertiary : colors.text }]}>
              {title}
            </Text>
            {statusBadge && (
              <View style={[styles.statusBadge, { backgroundColor: `${statusBadge.color}20` }]}>
                <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                  {statusBadge.text}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.toggleSubtitle, { color: disabled ? colors.textTertiary : colors.textSecondary }]}>
            {subtitle}
          </Text>
          {extra}
        </View>
        <View style={styles.switchContainer}>
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.switchTrackOff, true: iosGreen }}
            thumbColor="#FFFFF0"
            ios_backgroundColor={colors.switchTrackOff}
            disabled={disabled}
          />
        </View>
      </View>
      {!isLast && <View style={[styles.toggleDivider, { backgroundColor: colors.separator }]} />}
    </>
  );
}

function InfoRow({
  icon,
  title,
  description,
  colors,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
  isLast?: boolean;
}) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={[styles.infoIconContainer, { backgroundColor: colors.fillTertiary }]}>
          <Ionicons name={icon} size={18} color={colors.textSecondary} />
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      {!isLast && <View style={[styles.infoDivider, { backgroundColor: colors.separator }]} />}
    </>
  );
}

export default function AppSettingsScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { 
    settings, 
    featureStatus,
    updateSetting, 
    burnedCalories, 
    refreshBurnedCalories,
    requestHealthPermission,
    disconnectHealth,
  } = useAppSettings();

  const handleToggle = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    hapticLight();
    await updateSetting(key, value);
    
    if (key === "burnedCalories" && value === true) {
      await refreshBurnedCalories();
    }
  };

  const handleHealthConnect = async () => {
    const granted = await requestHealthPermission();
    if (granted) {
      Alert.alert(
        t('appSettings.connectedSuccess'),
        `${Platform.OS === "ios" ? "Apple Health" : "Health Connect"} ${t('appSettings.connectedSuccess').toLowerCase()}.`,
        [{ text: t('common.great') }]
      );
    }
  };

  const handleHealthDisconnect = () => {
    Alert.alert(
      t('appSettings.disconnectConfirm'),
      t('appSettings.disconnect'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: t('appSettings.disconnect'),
          style: "destructive",
          onPress: async () => {
            await disconnectHealth();
          }
        },
      ]
    );
  };

  const handleLiveActivityToggle = (value: boolean) => {
    if (value && !featureStatus.liveActivityAvailable) {
      Alert.alert(
        t('appSettings.featureUnavailable'),
        Platform.OS === "ios"
          ? "Live Activity требует iOS 16.1 или новее."
          : "Live Activity доступна только на iOS.",
        [{ text: t('common.understood') }]
      );
      return;
    }
    handleToggle("liveActivity", value);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]} 
          onPress={() => {
            hapticLight();
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('appSettings.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ВНЕШНИЙ ВИД</Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('appSettings.theme')}</Text>
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
                t={t}
              />
              <ThemePreviewCard
                mode="dark"
                selected={themeMode === "dark"}
                onPress={() => setThemeMode("dark")}
                isDarkTheme={isDark}
                colors={colors}
                t={t}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ФУНКЦИИ</Text>
          <View style={[styles.togglesSection, { backgroundColor: colors.card }]}>
            <SettingToggle
              title={t('appSettings.badgeCelebrations')}
              subtitle={t('appSettings.badgeCelebrationsDesc')}
              value={settings.badgeCelebrations}
              onValueChange={(value) => handleToggle("badgeCelebrations", value)}
              colors={colors}
              isDark={isDark}
            />

            <SettingToggle
              title={t('appSettings.liveActivity')}
              subtitle={t('appSettings.liveActivityDesc')}
              value={settings.liveActivity}
              onValueChange={handleLiveActivityToggle}
              disabled={!featureStatus.liveActivityAvailable}
              statusBadge={
                !featureStatus.liveActivityAvailable 
                  ? { text: Platform.OS === "ios" ? "iOS 16.1+" : "iOS only", color: "#8E8E93" }
                  : undefined
              }
              colors={colors}
              isDark={isDark}
            />

            <SettingToggle
              title={t('appSettings.addBurnedCalories')}
              subtitle={t('appSettings.addBurnedCaloriesDesc')}
              value={settings.burnedCalories}
              onValueChange={(value) => handleToggle("burnedCalories", value)}
              disabled={!featureStatus.healthAuthorized}
              colors={colors}
              isDark={isDark}
              extra={settings.burnedCalories && burnedCalories ? (
                <View style={styles.burnedCaloriesInfo}>
                  <Ionicons name="flame" size={14} color={colors.warning} />
                  <Text style={[styles.burnedCaloriesText, { color: colors.warning }]}>
                    +{burnedCalories.activeCalories} ккал сегодня
                  </Text>
                </View>
              ) : undefined}
            />

            <SettingToggle
              title={t('appSettings.calorieRollover')}
              subtitle={t('appSettings.calorieRolloverDesc')}
              value={settings.calorieRollover}
              onValueChange={(value) => handleToggle("calorieRollover", value)}
              colors={colors}
              isDark={isDark}
            />

            <SettingToggle
              title={t('appSettings.autoAdjustMacros')}
              subtitle={t('appSettings.autoAdjustMacrosDesc')}
              value={settings.autoMacroAdjust}
              onValueChange={(value) => handleToggle("autoMacroAdjust", value)}
              isLast
              colors={colors}
              isDark={isDark}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginHorizontal: 28,
  },
  section: {
    marginHorizontal: 12,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionContent: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
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
    height: 76,
    padding: 8,
    position: "relative",
  },
  themeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#8E8E93",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  themePreviewContent: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 4,
  },
  themePreviewRow: {
    height: 12,
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
    gap: 6,
    paddingVertical: 10,
  },
  themeRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  themeLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  healthCard: {
    marginHorizontal: 12,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  healthIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  healthStatus: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  healthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  healthButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  healthStats: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-around",
  },
  healthStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  healthStatValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  healthStatLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  healthUnavailable: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  healthUnavailableText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  togglesSection: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  toggleRowDisabled: {
    opacity: 0.6,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 1,
  },
  toggleTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
  },
  toggleSubtitle: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 13,
  },
  switchContainer: {
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 10,
  },
  burnedCaloriesInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },
  burnedCaloriesText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  infoSection: {
    marginHorizontal: 12,
    borderRadius: 14,
    padding: 3,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 11,
    gap: 10,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  infoDescription: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  bottomSpacer: {
    height: 40,
  },
});
