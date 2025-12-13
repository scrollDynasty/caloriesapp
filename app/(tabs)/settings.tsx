import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ViewToken
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { apiService } from "../../services/api";
import { authService } from "../../services/auth";
import { setAvatarUri, useAvatarUri } from "../../stores/userPreferences";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface UserInfo {
  name?: string;
  email?: string;
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

// Widget Card for carousel
function WidgetCard({ type, value, label }: { type: string; value: string | number; label: string }) {
  if (type === "calories") {
    return (
      <View style={styles.widgetCard}>
        <View style={styles.widgetCaloriesCircle}>
          <Text style={styles.widgetCaloriesValue}>{value}</Text>
          <Text style={styles.widgetCaloriesLabel}>{label}</Text>
        </View>
        <View style={styles.widgetButton}>
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={styles.widgetButtonText}>Записывай свою еду</Text>
        </View>
      </View>
    );
  }
  
  if (type === "streak") {
    return (
      <View style={styles.widgetCard}>
        <View style={styles.widgetStreakContainer}>
          <Text style={styles.widgetStreakFire}>🔥</Text>
          <Text style={styles.widgetStreakValue}>{value}</Text>
        </View>
        <View style={styles.widgetStreakApple}>
          <Ionicons name="logo-apple" size={24} color="#C0C0C0" />
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.widgetCard}>
      <Text style={styles.widgetGenericValue}>{value}</Text>
      <Text style={styles.widgetGenericLabel}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [holidayTheme, setHolidayTheme] = useState(false);
  const avatarUri = useAvatarUri();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [widgetPage, setWidgetPage] = useState(0);

  const widgetFlatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await apiService.getCurrentUser();
        setUser({ name: data?.name || "Пользователь", email: data?.email || "" });
      } catch (err) {
        console.warn("Не удалось загрузить пользователя", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
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

  const onWidgetViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setWidgetPage(viewableItems[0].index);
    }
  }, []);

  const widgetViewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const widgets = [
    { type: "calories", value: "2414", label: "Осталось калорий" },
    { type: "streak", value: 0, label: "Streak" },
    { type: "remaining", value: "2414", label: "Осталось" },
  ];

  const username = user?.email?.split("@")[0] || "user";

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Профиль</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={handlePickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText}>{(user?.name || "П").slice(0, 1).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumIcon}>👑</Text>
              <Text style={styles.premiumText}>Премиум</Text>
            </View>
            <Text style={styles.name}>{user?.name || "Пользователь"}</Text>
            <Text style={styles.username}>@{username}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
        </View>

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
          <MenuItem icon="person-outline" title="Личные данные" />
          <MenuItem icon="settings-outline" title="Настройки" />
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
        <SectionHeader title="Виджеты" rightText="Как добавить?" onRightPress={() => {}} />
        <View style={styles.widgetsContainer}>
          <FlatList
            ref={widgetFlatListRef}
            data={widgets}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => `widget-${index}`}
            renderItem={({ item }) => (
              <View style={styles.widgetWrapper}>
                <WidgetCard type={item.type} value={item.value} label={item.label} />
              </View>
            )}
            onViewableItemsChanged={onWidgetViewableItemsChanged}
            viewabilityConfig={widgetViewabilityConfig}
            snapToInterval={SCREEN_WIDTH - 40}
            decelerationRate="fast"
            contentContainerStyle={styles.widgetsList}
          />
          <View style={styles.widgetsPagination}>
            {widgets.map((_, index) => (
              <View key={index} style={[styles.widgetDot, widgetPage === index && styles.widgetDotActive]} />
            ))}
          </View>
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
  widgetsContainer: {
    marginTop: 4,
  },
  widgetsList: {
    paddingHorizontal: 20,
  },
  widgetWrapper: {
    width: SCREEN_WIDTH - 60,
    marginRight: 12,
  },
  widgetCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    height: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  widgetCaloriesCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: "#F2EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  widgetCaloriesValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  widgetCaloriesLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    textAlign: "center",
  },
  widgetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  widgetButtonText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
  },
  widgetStreakContainer: {
    alignItems: "center",
  },
  widgetStreakFire: {
    fontSize: 48,
  },
  widgetStreakValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFA500",
    marginTop: -8,
  },
  widgetStreakApple: {
    opacity: 0.5,
  },
  widgetGenericValue: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  widgetGenericLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
  },
  widgetsPagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  widgetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DAD4CA",
  },
  widgetDotActive: {
    backgroundColor: colors.primary,
  },
  bottomSpacer: {
    height: 20,
  },
});
