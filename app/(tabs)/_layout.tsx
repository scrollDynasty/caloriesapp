import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Custom Progress Icon Component
const ProgressIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'flex-end', flexDirection: 'row', gap: 2, paddingBottom: 2 }}>
    <View style={{ width: 4, height: size * 0.4, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.65, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: size * 0.85, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

const FAB_SIZE = 72;
const TAB_BAR_HEIGHT = 72;
const MARGIN = 16;
const GAP = 8;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const tabBarBottom = Math.max(insets.bottom, 16);

  // Ширина панели табов = экран - отступы - FAB - gap
  const tabBarWidth = SCREEN_WIDTH - MARGIN * 2 - FAB_SIZE - GAP;

  const toggleFab = () => {
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
    setFabExpanded(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push("/scan-meal");
  };

  const handleAddManually = () => {
    setFabExpanded(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    router.push("/add-manual");
  };

  const handleAddWater = () => {
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

  // FAB позиция справа от панели табов
  const fabRight = MARGIN;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#8A8A8A",
          tabBarInactiveTintColor: "#C4C4C4",
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "Inter_500Medium",
            marginTop: 4,
          },
          tabBarStyle: {
            position: "absolute",
            bottom: tabBarBottom,
            left: MARGIN,
            width: tabBarWidth,
            height: TAB_BAR_HEIGHT,
            backgroundColor: "#FAFAFA",
            borderTopWidth: 0,
            borderRadius: 36,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 4 },
            paddingHorizontal: 8,
            paddingTop: 12,
            paddingBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.04)",
          },
          tabBarItemStyle: {
            height: TAB_BAR_HEIGHT - 24,
            paddingVertical: 0,
          },
          tabBarIconStyle: {
            marginBottom: 0,
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
              <ProgressIcon color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: "Группы",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "people" : "people-outline"} 
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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
      </Tabs>

      {/* Blur Backdrop when FAB is expanded */}
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
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* FAB Sub-buttons */}
      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            right: fabRight,
            bottom: tabBarBottom + TAB_BAR_HEIGHT + 8,
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
          <View style={styles.fabSubButtonTextContainer}>
            <Text style={styles.fabSubButtonText}>Сканировать еду</Text>
          </View>
          <View style={styles.fabSubButtonIconContainer}>
            <Ionicons name="scan-outline" size={22} color="#1A1A1A" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            right: fabRight,
            bottom: tabBarBottom + TAB_BAR_HEIGHT + 8,
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
          <View style={styles.fabSubButtonTextContainer}>
            <Text style={styles.fabSubButtonText}>Добавить вручную</Text>
          </View>
          <View style={styles.fabSubButtonIconContainer}>
            <Ionicons name="create-outline" size={22} color="#1A1A1A" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            right: fabRight,
            bottom: tabBarBottom + TAB_BAR_HEIGHT + 8,
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
          <View style={styles.fabSubButtonTextContainer}>
            <Text style={styles.fabSubButtonText}>Вода</Text>
          </View>
          <View style={[styles.fabSubButtonIconContainer, { backgroundColor: '#E8F4FD' }]}>
            <Ionicons name="water" size={22} color="#1E90FF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB Button - справа от панели табов */}
      <TouchableOpacity 
        style={[
          styles.fab, 
          { 
            right: fabRight,
            bottom: tabBarBottom,
          }
        ]}
        onPress={toggleFab}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
          <Ionicons 
            name="add" 
            size={36} 
            color="#FFFFFF" 
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
