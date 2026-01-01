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
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSettings, useAppSettings } from "../context/AppSettingsContext";
import { ThemeMode, useTheme } from "../context/ThemeContext";
import { hapticLight, hapticMedium } from "../utils/haptics";

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
  const cardBg = isDark ? "#2C2C2E" : "#FFFFF0";
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
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.switchTrackOff, true: iosGreen }}
          thumbColor="#FFFFF0"
          ios_backgroundColor={colors.switchTrackOff}
          disabled={disabled}
        />
      </View>
      {!isLast && <View style={[styles.toggleDivider, { backgroundColor: colors.separator }]} />}
    </>
  );
}

function HealthConnectionCard({
  colors,
  isDark,
  isConnected,
  isAvailable,
  onConnect,
  onDisconnect,
  stepsToday,
  caloriestoday,
}: {
  colors: any;
  isDark: boolean;
  isConnected: boolean;
  isAvailable: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  stepsToday?: number;
  caloriestoday?: number;
}) {
  const healthName = Platform.OS === "ios" ? "Apple Health" : "Health Connect";
  const healthIcon = Platform.OS === "ios" ? "heart" : "fitness";
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(100)}
      style={[styles.healthCard, { backgroundColor: colors.card }]}
    >
      <View style={styles.healthHeader}>
        <View style={[styles.healthIconContainer, { backgroundColor: isConnected ? "#FF2D5520" : colors.fillTertiary }]}>
          <Ionicons name={healthIcon} size={24} color={isConnected ? "#FF2D55" : colors.textSecondary} />
        </View>
        <View style={styles.healthInfo}>
          <Text style={[styles.healthTitle, { color: colors.text }]}>{healthName}</Text>
          <Text style={[styles.healthStatus, { color: isConnected ? "#34C759" : colors.textSecondary }]}>
            {isConnected ? "Подключено" : isAvailable ? "Не подключено" : "Недоступно"}
          </Text>
        </View>
        
        {isAvailable && (
          <TouchableOpacity
            style={[
              styles.healthButton,
              { backgroundColor: isConnected ? colors.fillTertiary : "#007AFF" },
            ]}
            onPress={() => {
              hapticMedium();
              isConnected ? onDisconnect() : onConnect();
            }}
          >
            <Text style={[styles.healthButtonText, { color: isConnected ? colors.text : "#FFFFF0" }]}>
              {isConnected ? "Отключить" : "Подключить"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isConnected && (stepsToday !== undefined || caloriestoday !== undefined) && (
        <View style={[styles.healthStats, { borderTopColor: colors.separator }]}>
          {stepsToday !== undefined && (
            <View style={styles.healthStat}>
              <Ionicons name="walk" size={18} color="#007AFF" />
              <Text style={[styles.healthStatValue, { color: colors.text }]}>
                {stepsToday.toLocaleString()}
              </Text>
              <Text style={[styles.healthStatLabel, { color: colors.textSecondary }]}>шагов</Text>
            </View>
          )}
          {caloriestoday !== undefined && (
            <View style={styles.healthStat}>
              <Ionicons name="flame" size={18} color="#FF9500" />
              <Text style={[styles.healthStatValue, { color: colors.text }]}>
                {caloriestoday}
              </Text>
              <Text style={[styles.healthStatLabel, { color: colors.textSecondary }]}>ккал</Text>
            </View>
          )}
        </View>
      )}
      
      {!isAvailable && (
        <View style={[styles.healthUnavailable, { backgroundColor: colors.fillTertiary }]}>
          <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
          <Text style={[styles.healthUnavailableText, { color: colors.textSecondary }]}>
            {Platform.OS === "ios" 
              ? "HealthKit недоступен на этом устройстве"
              : "Установите Health Connect из Google Play"
            }
          </Text>
        </View>
      )}
    </Animated.View>
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
    
    // Специальная обработка для сожжённых калорий
    if (key === "burnedCalories" && value === true) {
      await refreshBurnedCalories();
    }
  };

  const handleHealthConnect = async () => {
    const granted = await requestHealthPermission();
    if (granted) {
      Alert.alert(
        "Успешно подключено",
        `${Platform.OS === "ios" ? "Apple Health" : "Health Connect"} успешно подключён. Данные о шагах и активности будут синхронизироваться автоматически.`,
        [{ text: "Отлично!" }]
      );
    }
  };

  const handleHealthDisconnect = () => {
    Alert.alert(
      "Отключить интеграцию?",
      `Данные о шагах и сожжённых калориях больше не будут синхронизироваться.`,
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Отключить",
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
        "Функция недоступна",
        Platform.OS === "ios"
          ? "Live Activity требует iOS 16.1 или новее."
          : "Live Activity доступна только на iOS.",
        [{ text: "Понятно" }]
      );
      return;
    }
    handleToggle("liveActivity", value);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Заголовок */}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Настройки</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Внешний вид */}
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

        {/* Health интеграция */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ЗДОРОВЬЕ</Text>
          <HealthConnectionCard
            colors={colors}
            isDark={isDark}
            isConnected={featureStatus.healthAuthorized}
            isAvailable={featureStatus.healthAvailable}
            onConnect={handleHealthConnect}
            onDisconnect={handleHealthDisconnect}
            stepsToday={burnedCalories?.steps}
            caloriestoday={burnedCalories?.activeCalories}
          />
        </View>

        {/* Функции */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ФУНКЦИИ</Text>
          <View style={[styles.togglesSection, { backgroundColor: colors.card }]}>
            <SettingToggle
              title="Празднования значков"
              subtitle="Показывать полноэкранную анимацию при получении нового значка"
              value={settings.badgeCelebrations}
              onValueChange={(value) => handleToggle("badgeCelebrations", value)}
              colors={colors}
              isDark={isDark}
            />

            <SettingToggle
              title="Живая активность"
              subtitle="Показывать калории и макроэлементы на экране блокировки"
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
              title="Добавить сожжённые калории"
              subtitle="Добавить сожжённые калории к суточной норме"
              value={settings.burnedCalories}
              onValueChange={(value) => handleToggle("burnedCalories", value)}
              disabled={!featureStatus.healthAuthorized}
              statusBadge={
                !featureStatus.healthAuthorized
                  ? { text: "Требуется Health", color: "#FF9500" }
                  : undefined
              }
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
              title="Перенос калорий"
              subtitle="Перенести до 200 калорий с вчерашнего дня"
              value={settings.calorieRollover}
              onValueChange={(value) => handleToggle("calorieRollover", value)}
              colors={colors}
              isDark={isDark}
            />

            <SettingToggle
              title="Авто-корректировка макроэлементов"
              subtitle="Автоматически корректировать макронутриенты при изменении калорий"
              value={settings.autoMacroAdjust}
              onValueChange={(value) => handleToggle("autoMacroAdjust", value)}
              isLast
              colors={colors}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Информация о настройках */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ИНФОРМАЦИЯ</Text>
          <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
            <InfoRow
              icon="sparkles"
              title="Празднования значков"
              description="При достижении целей (стрик, вес, калории) показывается красивая анимация с конфетти"
              colors={colors}
            />
            <InfoRow
              icon="flame"
              title="Сожжённые калории"
              description="Калории, сожжённые во время тренировок и активности, добавляются к вашей дневной норме"
              colors={colors}
            />
            <InfoRow
              icon="arrow-forward"
              title="Перенос калорий"
              description="Если вчера вы не использовали все калории, до 200 из них можно перенести на сегодня"
              colors={colors}
            />
            <InfoRow
              icon="options"
              title="Авто-корректировка"
              description="При изменении целевых калорий белки, жиры и углеводы пересчитываются автоматически"
              colors={colors}
              isLast
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
  // Health Card
  healthCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  healthIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  healthStatus: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  healthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  healthButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  healthStats: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-around",
  },
  healthStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  healthStatValue: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  healthStatLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  healthUnavailable: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  healthUnavailableText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  // Toggles
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
  toggleRowDisabled: {
    opacity: 0.6,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
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
  burnedCaloriesInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  burnedCaloriesText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // Info Section
  infoSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  bottomSpacer: {
    height: 40,
  },
});
