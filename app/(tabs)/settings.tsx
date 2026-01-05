import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
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
import { LottieLoader } from "../../components/ui/LottieLoader";
import { useSnow } from "../../context/SnowContext";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { authService } from "../../services/auth";
import { dataCache } from "../../stores/dataCache";
import { hapticLight } from "../../utils/haptics";
import { LANGUAGE_NAMES, SupportedLanguage, getUserLanguage } from "../../utils/language";
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

function SectionHeader({ title, rightText, onRightPress }: { title: string; rightText?: string; onRightPress?: () => void }) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: themeColors.textTertiary }]}>{title}</Text>
      {rightText && (
        <TouchableOpacity onPress={() => {
          hapticLight();
          onRightPress?.();
        }}>
          <Text style={[styles.sectionRight, { color: themeColors.text }]}>{rightText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MenuItem({ 
  icon, 
  title, 
  subtitle,
  onPress, 
  rightText,
  isLast = false,
  danger = false,
  badge,
}: { 
  icon: any; 
  title: string; 
  subtitle?: string;
  onPress?: () => void; 
  rightText?: string;
  isLast?: boolean;
  danger?: boolean;
  badge?: string;
}) {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.menuItem, { borderColor: isDark ? themeColors.separator : "#F2F2F2" }, isLast && styles.menuItemLast]} 
      onPress={() => {
        hapticLight();
        onPress?.();
      }} 
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconBox, { backgroundColor: isDark ? themeColors.gray5 : "#F5F5F5" }, danger && { backgroundColor: isDark ? themeColors.gray5 : "#FFEEEE" }]}>
          <Ionicons name={icon} size={16} color={danger ? "#FF4444" : themeColors.text} />
        </View>
        <View style={styles.menuTextContainer}>
          <View style={styles.menuTitleRow}>
            <Text style={[styles.menuText, { color: danger ? "#FF4444" : themeColors.text }]}>{title}</Text>
            {badge && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightText ? (
        <Text style={[styles.menuRightText, { color: themeColors.textSecondary }]}>{rightText}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={themeColors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}


export default function SettingsScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const { isSnowEnabled, setSnowEnabled } = useSnow();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("en");
  
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
      if (data?.avatar_url) {
        setAvatarUri(data.avatar_url);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadUser();
      }
      getUserLanguage().then(setCurrentLang);
    }, [loading, loadUser])
  );

  useEffect(() => {
    const loadDailyData = async () => {
      const { dateStr } = getLocalDayRange();
      
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
      } catch {

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
            } catch {
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

  const handlePickAvatar = () => {
    router.push("/edit-profile");
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
        <LottieLoader size="large" />
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
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Профиль</Text>

        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: themeColors.card }]} 
          activeOpacity={0.8}
          onPress={() => router.push("/edit-profile" as any)}
        >
          <View style={[styles.avatar, { backgroundColor: isDark ? themeColors.gray5 : "#EFEFEF" }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <Text style={[styles.avatarText, { color: themeColors.text }]}>{(displayName).slice(0, 1).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumIcon}>👑</Text>
              <Text style={[styles.premiumText, { color: "#B8860B" }]}>Премиум</Text>
            </View>
            <Text style={[styles.name, { color: themeColors.text }]}>{displayName}</Text>
            <Text style={[styles.username, { color: themeColors.textSecondary }]}>@{displayUsername}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.textTertiary} />
        </TouchableOpacity>

        <SectionHeader title="Тема приложения" />
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.themeItem}>
            <View style={[styles.themeIconBox, { backgroundColor: isDark ? themeColors.gray5 : "#F5F5F5" }]}>
              <Text style={styles.themeIcon}>🎄</Text>
            </View>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeTitle, { color: themeColors.text }]}>Почувствуй праздничное настроение</Text>
            </View>
            <Switch 
              value={isSnowEnabled} 
              onValueChange={setSnowEnabled}
              trackColor={{ false: isDark ? themeColors.gray4 : "#E0E0E0", true: "#4CAF50" }}
              thumbColor="#FFFFF0"
            />
          </View>
        </View>

        <SectionHeader title="Пригласить друзей" />
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity style={styles.referralCard} activeOpacity={0.7}>
            <View style={[styles.referralIcon, { backgroundColor: isDark ? themeColors.gray5 : "#F5F5F5" }]}>
              <Ionicons name="person-add-outline" size={18} color={themeColors.text} />
            </View>
            <View style={styles.referralInfo}>
              <Text style={[styles.referralTitle, { color: themeColors.text }]}>Пригласи друга и получи $10</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={themeColors.textTertiary} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="Аккаунт" />
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <MenuItem icon="person-outline" title="Личные данные" onPress={() => router.push("/personal-data" as any)} />
          <MenuItem icon="settings-outline" title="Настройки" onPress={() => router.push("/app-settings" as any)} />
          <MenuItem icon="diamond-outline" title="Подписка и тарифы" onPress={() => router.push("/subscription" as any)} />
          <MenuItem icon="language-outline" title="Язык" rightText={LANGUAGE_NAMES[currentLang]} onPress={() => router.push("/language-settings" as any)} />
          <MenuItem icon="people-outline" title="Обновиться до семейного плана" isLast />
        </View>

        <SectionHeader title="Цели и отслеживание" />
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <MenuItem icon="navigate-outline" title="Изменить цели питания" onPress={() => router.push("/nutrition-goals" as any)} />
          <MenuItem icon="flag-outline" title="Цели и текущий вес" onPress={() => router.push("/goals-weight" as any)} />
          <MenuItem icon="notifications-outline" title="Напоминания об отслеживании" onPress={() => router.push("/tracking-reminders" as any)} />
          <MenuItem icon="time-outline" title="История веса" onPress={() => router.push("/weight-history" as any)} isLast />
        </View>

        <SectionHeader title="Поддержка и юридическая информация" />
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <MenuItem icon="mail-outline" title="Написать в поддержку" onPress={() => openLink("https://yeb-ich.com/press/")} />
          <MenuItem icon="document-text-outline" title="Условия использования" onPress={() => openLink("https://yeb-ich.com/terms/")} />
          <MenuItem icon="shield-checkmark-outline" title="Политика конфиденциальности" onPress={() => openLink("https://yeb-ich.com/privacy/")} isLast />
        </View>

        <SectionHeader title="Следи за нами" />
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <MenuItem icon="logo-instagram" title="Instagram" onPress={() => openLink("https://instagram.com")} />
          <MenuItem icon="logo-tiktok" title="TikTok" onPress={() => openLink("https://tiktok.com")} />
          <MenuItem icon="logo-twitter" title="X" onPress={() => openLink("https://twitter.com")} />
        </View>

        <SectionHeader title="Действия с аккаунтом" />
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  premiumIcon: {
    fontSize: 11,
  },
  premiumText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  username: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionRight: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  section: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  themeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  themeIcon: {
    fontSize: 20,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  referralIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  referralInfo: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  referralSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    lineHeight: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  menuIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconBoxDanger: {
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  badgeContainer: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuTextDanger: {
  },
  menuSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  menuRightText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  bottomSpacer: {
    height: 20,
  },
});

