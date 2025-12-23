import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { authService } from "../../services/auth";
import { dataCache } from "../../stores/dataCache";
import { setAvatarUri, useAvatarUri } from "../../stores/userPreferences";
import { getLocalDayRange, getLocalTimezoneOffset } from "../../utils/timezone";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface UserInfo {
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
}

// Section Header
function SectionHeader({ title, rightText, onRightPress }: { title: string; rightText?: string; onRightPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightText && (
        <TouchableOpacity onPress={onRightPress}>
          <Text style={styles.sectionRight}>{rightText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Menu Item
function MenuItem({ 
  icon, 
  title, 
  subtitle,
  onPress, 
  rightText,
  isLast = false,
  danger = false,
}: { 
  icon: any; 
  title: string; 
  subtitle?: string;
  onPress?: () => void; 
  rightText?: string;
  isLast?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, isLast && styles.menuItemLast]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconBox, danger && styles.menuIconBoxDanger]}>
          <Ionicons name={icon} size={18} color={danger ? "#FF4444" : colors.primary} />
        </View>
        <View>
          <Text style={[styles.menuText, danger && styles.menuTextDanger]}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightText ? (
        <Text style={styles.menuRightText}>{rightText}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
      )}
    </TouchableOpacity>
  );
}


export default function SettingsScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [holidayTheme, setHolidayTheme] = useState(false);
  const avatarUri = useAvatarUri();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  
  // Daily data state
  const [dailyData, setDailyData] = useState({
    consumedCalories: 0,
    consumedProtein: 0,
    consumedCarbs: 0,
    consumedFats: 0,
    streakCount: 0,
  });
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const data = await apiService.getProfile();
      const fullName = data?.first_name && data?.last_name
        ? `${data.first_name} ${data.last_name}`
        : data?.first_name || "Пользователь";
      setUser({
        name: fullName,
        email: data?.email || "",
        first_name: data?.first_name,
        last_name: data?.last_name,
        username: data?.username,
        avatar_url: data?.avatar_url,
      });
      // Sync avatar if server has one
      if (data?.avatar_url) {
        setAvatarUri(data.avatar_url);
      }
    } catch (err) {
      console.warn("Не удалось загрузить пользователя", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Reload user when screen comes into focus (e.g., after editing profile)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadUser();
      }
    }, [loading, loadUser])
  );

  // Load daily data and onboarding - используем кэш для избежания дублирующих запросов
  useEffect(() => {
    const loadDailyData = async () => {
      const { dateStr } = getLocalDayRange();
      
      // Сначала проверяем кэш
      const cachedDaily = dataCache.getDailyMeals(dateStr);
      const cachedOnboarding = dataCache.getOnboarding();
      
      if (cachedDaily && cachedOnboarding) {
        setDailyData({
          consumedCalories: cachedDaily.total_calories || 0,
          consumedProtein: cachedDaily.total_protein || 0,
          consumedCarbs: cachedDaily.total_carbs || 0,
          consumedFats: cachedDaily.total_fat || 0,
          streakCount: cachedDaily.streak_count || 0,
        });
        setOnboardingData(cachedOnboarding);
        setDailyLoading(false);
        return;
      }
      
      // Если нет кэша - загружаем
      try {
        setDailyLoading(true);
        const [dailyMeals, onboarding] = await Promise.all([
          apiService.getDailyMeals(dateStr, getLocalTimezoneOffset()),
          apiService.getOnboardingData().catch(() => null),
        ]);
        
        setDailyData({
          consumedCalories: dailyMeals.total_calories || 0,
          consumedProtein: dailyMeals.total_protein || 0,
          consumedCarbs: dailyMeals.total_carbs || 0,
          consumedFats: dailyMeals.total_fat || 0,
          streakCount: dailyMeals.streak_count || 0,
        });
        setOnboardingData(onboarding);
      } catch (error) {
        console.error("Error loading daily data:", error);
      } finally {
        setDailyLoading(false);
      }
    };
    loadDailyData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Выйти из аккаунта",
      "Вы уверены, что хотите выйти?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Выйти",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.signOut();
              router.replace("/auth/login" as any);
            } catch (error: any) {
              console.error("Logout error", error);
              Alert.alert("Ошибка", "Не удалось выйти из аккаунта");  
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Удалить аккаунт",
      "Это действие необратимо. Все ваши данные будут удалены. Вы уверены?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            Alert.alert("Удаление аккаунта", "Для удаления аккаунта напишите в поддержку.");
          },
        },
      ]
    );
  };

  const handlePickAvatar = async () => {
    if (!galleryPermission?.granted) {
      if (galleryPermission?.canAskAgain) {
        const result = await requestGalleryPermission();
        if (!result.granted) {
          Alert.alert("Разрешение галереи", "Разрешите доступ к фотографиям, чтобы выбрать аватар.");
          return;
        }
      } else {
        Alert.alert("Разрешение галереи", "Разрешите доступ к фотографиям в настройках устройства.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await setAvatarUri(result.assets[0].uri);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Ошибка", "Не удалось открыть ссылку");
    });
  };


  const displayUsername = user?.username || user?.email?.split("@")[0] || "user";
  const displayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user?.name || "Пользователь";

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.secondary }]}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Профиль</Text>

        {/* Profile Card */}
        <TouchableOpacity 
          style={styles.profileCard} 
          activeOpacity={0.8}
          onPress={() => router.push("/edit-profile" as any)}
        >
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText}>{(displayName).slice(0, 1).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumIcon}>👑</Text>
              <Text style={styles.premiumText}>Премиум</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.username}>@{displayUsername}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
        </TouchableOpacity>

        {/* App Theme */}
        <SectionHeader title="App Theme" />
        <View style={styles.section}>
          <View style={styles.themeItem}>
            <Text style={styles.themeIcon}>🎄</Text>
            <View style={styles.themeInfo}>
              <Text style={styles.themeTitle}>Feel the Holiday Magic</Text>
              <Text style={styles.themeSubtitle}>Let your app sparkle with snow and Christmas cheer.</Text>
            </View>
            <Switch 
              value={holidayTheme} 
              onValueChange={setHolidayTheme}
              trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Invite Friends */}
        <SectionHeader title="Пригласить друзей" />
        <View style={styles.section}>
          <TouchableOpacity style={styles.referralCard} activeOpacity={0.7}>
            <View style={styles.referralIcon}>
              <Ionicons name="person-add-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.referralInfo}>
              <Text style={styles.referralTitle}>Пригласи друга и получи $10</Text>
              <Text style={styles.referralSubtitle}>
                Заработай $10 за каждого друга, который зарегистрируется с твоим промокодом.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <SectionHeader title="Аккаунт" />
        <View style={styles.section}>
          <MenuItem icon="person-outline" title="Личные данные" onPress={() => router.push("/personal-data" as any)} />
          <MenuItem icon="settings-outline" title="Настройки" onPress={() => router.push("/app-settings" as any)} />
          <MenuItem icon="language-outline" title="Язык" />
          <MenuItem icon="people-outline" title="Обновиться до семейного плана" isLast />
        </View>

        {/* Goals & Tracking */}
        <SectionHeader title="Цели и отслеживание" />
        <View style={styles.section}>
          <MenuItem icon="navigate-outline" title="Изменить цели питания" />
          <MenuItem icon="flag-outline" title="Цели и текущий вес" />
          <MenuItem icon="time-outline" title="История веса" />
          <MenuItem icon="ellipse-outline" title="Ring Colors Explained" isLast />
        </View>

        {/* Widgets */}
        <View style={styles.widgetsSection}>
          <View style={styles.widgetsHeader}>
            <Text style={styles.widgetsTitle}>Виджеты</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.widgetsHowToAdd}>Как добавить?</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.widgetsScrollContent}
          >
            {/* Streak Widget */}
            <View style={styles.widgetStreakCard}>
              <View style={styles.widgetStreakStar}>
                <Text style={styles.widgetStarIcon}>✨</Text>
              </View>
              <Text style={styles.widgetStreakFire}>🔥</Text>
              <Text style={styles.widgetStreakValue}>{dailyData.streakCount}</Text>
            </View>
            
            {/* Calories + Macros Combined */}
            <View style={styles.widgetCombinedCard}>
              <View style={styles.widgetCaloriesSection}>
                {(() => {
                  const targetCalories = onboardingData?.target_calories || 0;
                  const remaining = Math.max(0, targetCalories - dailyData.consumedCalories);
                  const progress = targetCalories > 0 ? Math.min(1, dailyData.consumedCalories / targetCalories) : 0;
                  const CIRCUMFERENCE = 2 * Math.PI * 38;
                  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
                  
                  return (
                    <View style={styles.widgetCaloriesCircleContainer}>
                      <Svg width={85} height={85} style={styles.widgetCaloriesSvg}>
                        <Circle
                          cx={42.5}
                          cy={42.5}
                          r={38}
                          stroke="#E8E4DC"
                          strokeWidth={6}
                          fill="none"
                        />
                        {progress > 0 && (
                          <Circle
                            cx={42.5}
                            cy={42.5}
                            r={38}
                            stroke={colors.primary}
                            strokeWidth={6}
                            fill="none"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform="rotate(-90 42.5 42.5)"
                          />
                        )}
                      </Svg>
                      <View style={styles.widgetCaloriesTextContainer}>
                        <Text style={styles.widgetCaloriesValue}>{remaining}</Text>
                        <Text style={styles.widgetCaloriesLabel}>Осталось ка...</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
              <View style={styles.widgetMacrosSection}>
                {(() => {
                  const targetProtein = onboardingData?.protein_grams || 0;
                  const targetCarbs = onboardingData?.carbs_grams || 0;
                  const targetFats = onboardingData?.fats_grams || 0;
                  const remainingProtein = Math.max(0, targetProtein - dailyData.consumedProtein);
                  const remainingCarbs = Math.max(0, targetCarbs - dailyData.consumedCarbs);
                  const remainingFats = Math.max(0, targetFats - dailyData.consumedFats);
                  
                  return (
                    <>
                      <View style={styles.widgetMacroRow}>
                        <Ionicons name="flash" size={14} color="#FF6B6B" />
                        <Text style={styles.widgetMacroValue}>{Math.round(remainingProtein)}g</Text>
                        <Text style={styles.widgetMacroLabel}>Белки left</Text>
                      </View>
                      <View style={styles.widgetMacroRow}>
                        <Text style={styles.widgetMacroIcon}>🌾</Text>
                        <Text style={styles.widgetMacroValue}>{Math.round(remainingCarbs)}g</Text>
                        <Text style={styles.widgetMacroLabel}>Углеводы left</Text>
                      </View>
                      <View style={styles.widgetMacroRow}>
                        <Ionicons name="water" size={14} color="#4D96FF" />
                        <Text style={styles.widgetMacroValue}>{Math.round(remainingFats)}g</Text>
                        <Text style={styles.widgetMacroLabel}>Жиры left</Text>
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.widgetActionsColumn}>
              <TouchableOpacity style={styles.widgetActionBtn} activeOpacity={0.7} onPress={() => {}}>
                <Ionicons name="scan-outline" size={18} color={colors.primary} />
                <Text style={styles.widgetActionBtnText}>Сканиров...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.widgetActionBtn} activeOpacity={0.7} onPress={() => {}}>
                <Ionicons name="barcode-outline" size={18} color={colors.primary} />
                <Text style={styles.widgetActionBtnText}>Штрих-код</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Support & Legal */}
        <SectionHeader title="Поддержка и юридическая информация" />
        <View style={styles.section}>
          <MenuItem icon="bulb-outline" title="Запросить функцию" />
          <MenuItem icon="mail-outline" title="Написать в поддержку" />
          <MenuItem icon="share-outline" title="Export PDF Summary Report" />
          <MenuItem icon="sync-outline" title="Синхронизировать данные" subtitle="Последняя синхронизация: 1:09 AM" />
          <MenuItem icon="document-text-outline" title="Условия использования" />
          <MenuItem icon="shield-checkmark-outline" title="Политика конфиденциальности" isLast />
        </View>

        {/* Social */}
        <SectionHeader title="Следи за нами" />
        <View style={styles.section}>
          <MenuItem icon="logo-instagram" title="Instagram" onPress={() => openLink("https://instagram.com")} />
          <MenuItem icon="logo-tiktok" title="TikTok" onPress={() => openLink("https://tiktok.com")} />
          <MenuItem icon="logo-twitter" title="X" onPress={() => openLink("https://x.com")} isLast />
        </View>

        {/* Account Actions */}
        <SectionHeader title="Действия с аккаунтом" />
        <View style={styles.section}>
          <MenuItem icon="log-out-outline" title="Выйти" onPress={handleLogout} />
          <MenuItem icon="trash-outline" title="Удалить аккаунт" onPress={handleDeleteAccount} danger isLast />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  // Profile Card
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  premiumIcon: {
    fontSize: 12,
  },
  premiumText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#B8860B",
  },
  name: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  username: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginTop: 1,
  },
  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionRight: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
  },
  // Section
  section: {
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  // Theme Item
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  themeIcon: {
    fontSize: 28,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  themeSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginTop: 2,
  },
  // Referral Card
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  referralIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  referralInfo: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  referralSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  // Menu Item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F2F2F2",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconBoxDanger: {
    backgroundColor: "#FFEEEE",
  },
  menuText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
  },
  menuTextDanger: {
    color: "#FF4444",
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginTop: 2,
  },
  menuRightText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  // Widgets
  widgetsSection: {
    marginTop: 24,
  },
  widgetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  widgetsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  widgetsHowToAdd: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
  },
  widgetsScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  // Streak Card (огонёк)
  widgetStreakCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    width: 90,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  // Combined Card (калории + макросы)
  widgetCombinedCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    height: 120,
  },
  widgetCaloriesSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  widgetMacrosSection: {
    gap: 8,
  },
  widgetMacroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // Action Buttons Column
  widgetActionsColumn: {
    gap: 8,
    justifyContent: "center",
  },
  widgetActionBtn: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 75,
    height: 56,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  widgetActionBtnText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
    textAlign: "center",
  },
  // Streak Widget
  widgetStreakStar: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  widgetStarIcon: {
    fontSize: 16,
  },
  widgetStreakFire: {
    fontSize: 52,
  },
  widgetStreakValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FF8C42",
    marginTop: -10,
  },
  // Calories Widget
  widgetCaloriesCircleContainer: {
    width: 85,
    height: 85,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  widgetCaloriesSvg: {
    position: "absolute",
  },
  widgetCaloriesTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  widgetCaloriesValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  widgetCaloriesLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    textAlign: "center",
  },
  // Macros
  widgetMacroIcon: {
    fontSize: 14,
  },
  widgetMacroValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  widgetMacroLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
  },
  bottomSpacer: {
    height: 20,
  },
});

