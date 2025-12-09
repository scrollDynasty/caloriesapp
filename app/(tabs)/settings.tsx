import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { apiService } from "../../services/api";
import { authService } from "../../services/auth";

interface UserInfo {
  name?: string;
  email?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

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
    try {
      await authService.signOut();
      router.replace("/auth/login" as any);
    } catch (error: any) {
      console.error("Logout error", error);
      Alert.alert("Ошибка", "Не удалось выйти из аккаунта");
    }
  };

  const MenuItem = ({ icon, title, onPress, rightText }: { icon: any; title: string; onPress?: () => void; rightText?: string }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconBox}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.menuText}>{title}</Text>
      </View>
      {rightText ? <Text style={styles.menuRightText}>{rightText}</Text> : <Ionicons name="chevron-forward" size={16} color="#B8B8B8" />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Настройки</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || "П").slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "Пользователь"}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        <View style={styles.planBadge}>
          <Text style={styles.planText}>Free plan</Text>
        </View>
      </View>

      <View style={styles.section}>
        <MenuItem icon="person-outline" title="Личные данные" onPress={() => {}} />
        <MenuItem icon="bullseye-outline" title="Мои цели" onPress={() => {}} />
        <MenuItem icon="crown-outline" title="Подписка" rightText="Перейти на Pro" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={styles.menuIconBox}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Уведомления</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  profileCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  name: {
    marginTop: 12,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: colors.secondary,
    fontFamily: "Inter_500Medium",
  },
  planBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F1F1F1",
  },
  planText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.secondary,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F2F2F2",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  menuRightText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
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
});
