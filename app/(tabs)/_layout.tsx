import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomTabBar from "../../components/ui/CustomTabBar";
import { useSplash } from "../../context/SplashContext";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { hapticMedium } from "../../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ProgressIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'row', gap: 2 }}>
    <View style={{ width: 4, height: size * 0.4, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.65, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.9, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

const FAB_SIZE = 70;
const TAB_BAR_HEIGHT = 70; 
const MARGIN = 16;
const GAP_BETWEEN = 2;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const { showSplash } = useSplash();
  
  // Синхронизируем позиционирование с CustomTabBar
  const bottomInset = Math.max(insets.bottom, 0);
  const bottomOffset = 20 + bottomInset; // Такое же как в CustomTabBar

  const loadAvatar = useCallback(async () => {
    try {
      const profile = await apiService.getProfile();
      setAvatarUri(profile.avatar_url || null);
    } catch {
    }
  }, []);

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

  useFocusEffect(
    useCallback(() => {
      loadAvatar();
    }, [loadAvatar])
  );

  const toggleFab = () => {
    hapticMedium();
    const toValue = modalVisible ? 0 : 1;
    setModalVisible(!modalVisible);
    Animated.spring(modalAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleScanFood = () => {
    hapticMedium();
    setModalVisible(false);
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push({ pathname: "/scan-meal", params: { mode: "photo" } } as any);
  };

  const handleAddManually = () => {
    hapticMedium();
    setModalVisible(false);
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push("/add-manual");
  };

  const handleAddWater = () => {
    hapticMedium();
    setModalVisible(false);
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push("/add-water");
  };

  const handleAddBarcode = () => {
    hapticMedium();
    setModalVisible(false);
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push({ pathname: "/scan-meal", params: { mode: "barcode" } } as any);
  };

  const button1TranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const button2TranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const button3TranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const button4TranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const modalOpacity = modalAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const fabRotation = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: showSplash ? "none" : "flex",
            height: 0,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          sceneStyle: {
            backgroundColor: colors.background,
          },
        }}
        tabBar={(props: any) => (
          <CustomTabBar {...props} avatarUri={avatarUri} showSplash={showSplash} />
        )}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Главная",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Прогресс",
            tabBarIcon: ({ color }) => (
              <ProgressIcon color={color} size={22} />
            ),
          }}
        />
        <Tabs.Screen
          name="food-database"
          options={{
            title: "База продуктов",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "restaurant" : "restaurant-outline"} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Профиль",
            tabBarIcon: ({ color, focused }) =>
              avatarUri ? (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: focused ? 1 : 0.7,
                  }}
                >
                  <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
                </View>
              ) : (
                <Ionicons
                  name={focused ? "person-circle" : "person-circle-outline"}
                  size={26}
                  color={color}
                />
              ),
          }}
        />
      </Tabs>

      {modalVisible && (
        <View style={styles.modalBackdrop}>
          <BlurView intensity={95} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <Animated.View
            style={[
              styles.blurOverlay,
              { opacity: modalOpacity },
            ]}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={toggleFab}
          />
        </View>
      )}

      {modalVisible && (
        <Animated.View style={[styles.modalContent, { opacity: modalOpacity }]}>
          <View style={styles.buttonGrid}>
            <Animated.View style={[styles.gridButton, { transform: [{ translateY: button1TranslateY }] }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={handleScanFood}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={28} color={colors.primary} />
                <Text style={[styles.actionButtonLabel, { color: colors.text }]}>Сканировать</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.gridButton, { transform: [{ translateY: button2TranslateY }] }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={handleAddManually}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={28} color={colors.primary} />
                <Text style={[styles.actionButtonLabel, { color: colors.text }]}>Вручную</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.gridButton, { transform: [{ translateY: button3TranslateY }] }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={handleAddBarcode}
                activeOpacity={0.8}
              >
                <Ionicons name="barcode-outline" size={28} color={colors.primary} />
                <Text style={[styles.actionButtonLabel, { color: colors.text }]}>Штрихкод</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.gridButton, { transform: [{ translateY: button4TranslateY }] }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isDark ? '#1E3A5F' : '#E8F4FD' }]}
                onPress={handleAddWater}
                activeOpacity={0.8}
              >
                <Ionicons name="water" size={28} color="#1E90FF" />
                <Text style={[styles.actionButtonLabel, { color: '#1E90FF' }]}>Вода</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      )}

      <View
        style={[
          styles.fabContainer,
          {
            right: MARGIN,
            bottom: bottomOffset + (TAB_BAR_HEIGHT - FAB_SIZE) / 2,
          }
        ]}
      >
        <BlurView
          intensity={100}
          tint={isDark ? "dark" : "light"}
          style={styles.fabBlur}
        >
          <LinearGradient
            colors={isDark
              ? [
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.08)",
                  "rgba(255, 255, 255, 0.03)",
                  "rgba(0, 0, 0, 0.05)",
                ]
              : [
                  "rgba(255, 255, 255, 0.3)",
                  "rgba(255, 255, 240, 0.2)",
                  "rgba(255, 255, 240, 0.15)",
                  "rgba(255, 255, 240, 0.1)",
                ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View 
            style={[
              styles.fabOverlay,
              {
                backgroundColor: isDark 
                  ? "rgba(20, 20, 20, 0.5)" 
                  : "rgba(255, 255, 240, 0.85)",
              }
            ]} 
          />
          <LinearGradient
            colors={isDark
              ? ["transparent", "rgba(0, 0, 0, 0.1)"]
              : ["transparent", "rgba(0, 0, 0, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <TouchableOpacity
            onPress={toggleFab}
            activeOpacity={0.8}
            style={styles.fabButton}
          >
            <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
              <Ionicons 
                name="add" 
                size={32} 
                color={isDark ? "#FFFFFF" : "#1A1A1A"} 
              />
            </Animated.View>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  tabButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  modalContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  buttonGrid: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
  },
  gridButton: {
    width: '45%',
    pointerEvents: 'auto',
  },
  actionButton: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  fabContainer: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 100,
  },
  fabBlur: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    overflow: "hidden",
  },
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  fabButton: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  fabSubButtonContainer: {
    position: "absolute",
    zIndex: 9,
    alignItems: "flex-end",
  },
  fabSubButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fabSubButtonTextContainer: {
    backgroundColor: "#FFFFF0",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fabSubButtonIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFF0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fabSubButtonText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
});
