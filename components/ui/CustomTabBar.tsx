import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { hapticLight } from "../../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TAB_BAR_HEIGHT = 70;
const INDICATOR_SIZE = 50;
const FAB_SIZE = 70;
const HORIZONTAL_PADDING = 20;
const GAP_BETWEEN = 12;
const TAB_BAR_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - FAB_SIZE - GAP_BETWEEN;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;
const BORDER_RADIUS = 35;

interface CustomTabBarProps extends BottomTabBarProps {
  avatarUri?: string | null;
  showSplash?: boolean;
}

const ProgressIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'row', gap: 2 }}>
    <View style={{ width: 4, height: size * 0.4, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.65, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.9, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

export default function CustomTabBar({ state, descriptors, navigation, avatarUri, showSplash = false }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const activeIndex = state.index;
  
  const indicatorPosition = useSharedValue(activeIndex);

  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      indicatorPosition.value,
      [0, 1, 2, 3],
      [0, TAB_WIDTH, TAB_WIDTH * 2, TAB_WIDTH * 3]
    );

    return {
      transform: [{ translateX }],
    };
  });

  useEffect(() => {
    if (!showSplash) {
      indicatorPosition.value = withSpring(activeIndex, {
        damping: 25,
        stiffness: 200,
        mass: 0.5,
      });
    }
  }, [activeIndex, indicatorPosition, showSplash]);

  if (showSplash) {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, 0);
  const bottomOffset = 20 + bottomInset;

  const blurTint = isDark ? "dark" : "light";
  // На iOS убираем блюр, оставляем только прозрачность
  const blurIntensity = Platform.OS === "ios" ? 0 : (isDark ? 70 : 60);
  
  // Для iOS используем только прозрачный фон без блюра
  // Для Android оставляем блюр с overlay
  const overlayColor = isDark 
    ? Platform.OS === "ios" 
      ? "rgba(10, 10, 10, 0.6)"  // Более непрозрачный фон для iOS без блюра
      : "rgba(10, 10, 10, 0.18)"   // Android с блюром
    : Platform.OS === "ios"
      ? "rgba(255, 255, 240, 0.7)" // Более непрозрачный фон для iOS без блюра
      : "rgba(255, 255, 240, 0.45)"; // Android с блюром
  
  const indicatorColor = "rgba(255, 255, 255, 0.4)";
  
  // Унифицируем градиенты для одинакового визуального эффекта
  const gradientColors = isDark
    ? [
        "rgba(255, 255, 255, 0.12)",
        "rgba(255, 255, 255, 0.06)",
        "rgba(255, 255, 255, 0.02)",
        "rgba(0, 0, 0, 0.05)",
      ] as const
    : [
        "rgba(255, 255, 255, 0.2)",
        "rgba(255, 255, 240, 0.15)",
        "rgba(255, 255, 240, 0.1)",
        "rgba(255, 255, 240, 0.05)",
      ] as const;
  const depthGradient = isDark
    ? (["transparent", "rgba(0, 0, 0, 0.06)"] as const)
    : (["transparent", "rgba(0, 0, 0, 0.03)"] as const);

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      {Platform.OS === "ios" ? (
        <View style={[styles.blurContainer, { backgroundColor: overlayColor }]}>
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: indicatorColor },
              indicatorStyle,
            ]}
          />

          <View style={styles.tabsContainer}>
          {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' 
            ? options.tabBarLabel 
            : typeof options.title === 'string' 
            ? options.title 
            : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            hapticLight();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          let iconElement: React.ReactNode;
          const iconColor = isDark
            ? (isFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)")
            : (isFocused ? "#1A1A1A" : "rgba(0, 0, 0, 0.5)");
          const iconSize = 24;

          if (route.name === "index") {
            iconElement = (
              <Ionicons
                name={isFocused ? "home" : "home-outline"}
                size={iconSize}
                color={iconColor}
              />
            );
          } else if (route.name === "progress") {
            iconElement = <ProgressIcon color={iconColor} size={22} />;
          } else if (route.name === "food-database") {
            iconElement = (
              <Ionicons
                name={isFocused ? "restaurant" : "restaurant-outline"}
                size={iconSize}
                color={iconColor}
              />
            );
          } else if (route.name === "settings") {
            if (avatarUri) {
              iconElement = (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: isFocused ? 1 : 0.7,
                  }}
                >
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </View>
              );
            } else {
              iconElement = (
                <Ionicons
                  name={isFocused ? "person-circle" : "person-circle-outline"}
                  size={26}
                  color={iconColor}
                />
              );
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  {iconElement}
                </View>
              </View>
            </TouchableOpacity>
          );
          })}
        </View>
        </View>
      ) : (
        <BlurView
          intensity={blurIntensity}
          tint={blurTint}
          style={styles.blurContainer}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
          
          <LinearGradient
            colors={depthGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: indicatorColor },
              indicatorStyle,
            ]}
          />

          <View style={styles.tabsContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = typeof options.tabBarLabel === 'string' 
              ? options.tabBarLabel 
              : typeof options.title === 'string' 
              ? options.title 
              : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              hapticLight();
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            let iconElement: React.ReactNode;
            const iconColor = isDark
              ? (isFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)")
              : (isFocused ? "#1A1A1A" : "rgba(0, 0, 0, 0.5)");
            const iconSize = 24;

            if (route.name === "index") {
              iconElement = (
                <Ionicons
                  name={isFocused ? "home" : "home-outline"}
                  size={iconSize}
                  color={iconColor}
                />
              );
            } else if (route.name === "progress") {
              iconElement = <ProgressIcon color={iconColor} size={22} />;
            } else if (route.name === "food-database") {
              iconElement = (
                <Ionicons
                  name={isFocused ? "restaurant" : "restaurant-outline"}
                  size={iconSize}
                  color={iconColor}
                />
              );
            } else if (route.name === "settings") {
              if (avatarUri) {
                iconElement = (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      overflow: "hidden",
                      opacity: isFocused ? 1 : 0.7,
                    }}
                  >
                    <Image
                      source={{ uri: avatarUri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                );
              } else {
                iconElement = (
                  <Ionicons
                    name={isFocused ? "person-circle" : "person-circle-outline"}
                    size={26}
                    color={iconColor}
                  />
                );
              }
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <View style={styles.iconContainer}>
                    {iconElement}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: HORIZONTAL_PADDING,
    width: TAB_BAR_WIDTH,
    zIndex: 1000,
    // Мягкие тени для эффекта глубины
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  blurContainer: {
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    height: TAB_BAR_HEIGHT,
    position: "relative",
    // Тонкая обводка для блика (inner glow)
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    // Мягкая тень для отделения от фона
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: "absolute",
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    top: (TAB_BAR_HEIGHT - INDICATOR_SIZE) / 2,
    left: (TAB_WIDTH - INDICATOR_SIZE) / 2,
    zIndex: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 0,
    position: "relative",
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconContainer: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
