import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSplash } from "../../context/SplashContext";
import { defaultColors, useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { hapticLight, hapticMedium } from "../../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ProgressIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'row', gap: 2 }}>
    <View style={{ width: 4, height: size * 0.4, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.65, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.9, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

const FAB_SIZE = 70;
const TAB_BAR_HEIGHT = 56;
const MARGIN = 16;
const GAP_BETWEEN = 2;

const CustomTabButton = ({ children, onPress, accessibilityState, themeColors }: any) => {
  const focused = accessibilityState?.selected;
  const animValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: focused ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [focused, animValue]);

  const bgColor = themeColors?.card || "#FFFFF0";
  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', bgColor],
  });

  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
      activeOpacity={0.7}
      style={styles.tabButtonWrapper}
    >
      <Animated.View
        style={[
          styles.tabButton,
          { backgroundColor },
        ]}
      >
        <View style={styles.tabButtonContent}>
          {children}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { colors, isDark } = useTheme();
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const tabBarBottom = Math.max(insets.bottom, 12);
  const { showSplash } = useSplash();

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

  const tabBarWidth = SCREEN_WIDTH - MARGIN * 2 - FAB_SIZE - GAP_BETWEEN;

  const toggleFab = () => {
    hapticMedium();
    const toValue = fabExpanded ? 0 : 1;
    setFabExpanded(!fabExpanded);
    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleScanFood = () => {
    hapticMedium();
    setFabExpanded(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push("/scan-meal");
  };

  const handleAddManually = () => {
    hapticMedium();
    setFabExpanded(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push("/add-manual");
  };

  const handleAddWater = () => {
    hapticMedium();
    setFabExpanded(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push("/add-water");
  };

  const button1TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });

  const button2TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });

  const button3TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -210],
  });

  const blurOpacity = fabAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const buttonOpacity = fabAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const fabRotation = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarShowLabel: false,
          tabBarButton: (props) => <CustomTabButton {...props} themeColors={colors} />,
          tabBarStyle: {
            position: "absolute",
            bottom: tabBarBottom,
            left: MARGIN,
            width: tabBarWidth,
            height: TAB_BAR_HEIGHT,
            backgroundColor: isDark ? colors.card : colors.background,
            borderTopWidth: 0,
            borderRadius: 28,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 4 },
            paddingHorizontal: 6,
            paddingTop: 0,
            paddingBottom: 0,
            display: showSplash ? "none" : "flex",
          },
          sceneStyle: {
            backgroundColor: colors.background,
          },
        }}
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
          name="recipes"
          options={{
            title: "Рецепты",
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

      {}
      {fabExpanded && (
        <TouchableOpacity
          style={styles.blurBackdrop}
          activeOpacity={1}
          onPress={toggleFab}
        >
          <Animated.View
            style={[
              styles.blurContainer,
              { opacity: blurOpacity },
            ]}
          >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>
      )}

      {}
      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            right: MARGIN,
            bottom: tabBarBottom + FAB_SIZE + 8,
            opacity: buttonOpacity,
            transform: [{ translateY: button1TranslateY }],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonRow}
          onPress={handleScanFood}
          activeOpacity={0.7}
        >
          <View style={[styles.fabSubButtonTextContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.fabSubButtonText, { color: colors.primary }]}>Сканировать еду</Text>
          </View>
          <View style={[styles.fabSubButtonIconContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="scan-outline" size={22} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            right: MARGIN,
            bottom: tabBarBottom + FAB_SIZE + 8,
            opacity: buttonOpacity,
            transform: [{ translateY: button2TranslateY }],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonRow}
          onPress={handleAddManually}
          activeOpacity={0.7}
        >
          <View style={[styles.fabSubButtonTextContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.fabSubButtonText, { color: colors.primary }]}>Добавить вручную</Text>
          </View>
          <View style={[styles.fabSubButtonIconContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            right: MARGIN,
            bottom: tabBarBottom + FAB_SIZE + 8,
            opacity: buttonOpacity,
            transform: [{ translateY: button3TranslateY }],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonRow}
          onPress={handleAddWater}
          activeOpacity={0.7}
        >
          <View style={[styles.fabSubButtonTextContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.fabSubButtonText, { color: colors.primary }]}>Вода</Text>
          </View>
          <View style={[styles.fabSubButtonIconContainer, { backgroundColor: isDark ? '#1E3A5F' : '#E8F4FD' }]}>
            <Ionicons name="water" size={22} color="#1E90FF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {}
      <TouchableOpacity 
        style={[
          styles.fab, 
          { 
            right: MARGIN,
            bottom: tabBarBottom + (TAB_BAR_HEIGHT - FAB_SIZE) / 2,
          }
        ]}
        onPress={toggleFab}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
          <Ionicons 
            name="add" 
            size={32} 
            color="#FFFFF0" 
          />
        </Animated.View>
      </TouchableOpacity>
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
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  fab: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: defaultColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
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
