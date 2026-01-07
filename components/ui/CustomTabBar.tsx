import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
const TAB_WIDTH = (SCREEN_WIDTH - 40) / 4; // Учитываем отступы left: 20, right: 20
const HORIZONTAL_PADDING = 20;
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
      <BlurView
        intensity={80}
        tint="dark"
        style={styles.blurContainer}
      >
        <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.indicator,
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
          const iconColor = isFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)";
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

          const tabLabels: Record<string, string> = {
            index: "Главная",
            progress: "Прогресс",
            "food-database": "База",
            settings: "Профиль",
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  {iconElement}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: iconColor,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tabLabels[route.name] || label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: HORIZONTAL_PADDING,
    right: HORIZONTAL_PADDING,
    zIndex: 1000,
    elevation: 0, // Убираем тень на Android для прозрачности
  },
  blurContainer: {
    borderRadius: BORDER_RADIUS,
    overflow: "hidden", // Важно: чтобы контент не вылезал за закругленные края
    height: TAB_BAR_HEIGHT,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 30, 30, 0.7)", // Полупрозрачный темно-серый фон
  },
  indicator: {
    position: "absolute",
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: "#2b4bf2",
    top: (TAB_BAR_HEIGHT - INDICATOR_SIZE) / 2, // Вертикальное центрирование
    left: (TAB_WIDTH - INDICATOR_SIZE) / 2,
    zIndex: 0, // Позади иконок и текста
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
    paddingVertical: 8,
    position: "relative",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    position: "relative",
  },
  iconContainer: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2, // Поверх индикатора
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    zIndex: 2, // Поверх индикатора
  },
});

