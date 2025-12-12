import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GAP_BETWEEN_PANEL_AND_FAB = -8;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const fabBottom = insets.bottom + 16;

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
    outputRange: [0, -40],
  });
  const button1TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const button2TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -104],
  });
  const button2TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const button3TranslateY = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -168],
  });
  const button3TranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
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
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#1A1A1A",
          tabBarInactiveTintColor: "#8A8A8A",
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "Inter_500Medium",
            marginTop: 2,
            marginBottom: 0,
          },
          tabBarStyle: {
            position: "absolute",
            bottom: insets.bottom + 16,
            left: 100,
            right: 20,
            height: 72,
            backgroundColor: "#F8F8F8",
            borderTopWidth: 0,
            borderRadius: 36,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? 8 : 12,
          },
          tabBarItemStyle: {
            height: "auto",
            paddingVertical: 4,
            borderRadius: 12,
          },
          tabBarActiveBackgroundColor: "#E8E8E8",
          tabBarIconStyle: {
            marginTop: 0,
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Главная",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={focused ? "home" : "home-outline"} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Прогресс",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={focused ? "stats-chart" : "stats-chart-outline"} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: "Группы",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={focused ? "people" : "people-outline"} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Профиль",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={focused ? "person" : "person-outline"} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
      </Tabs>

      {fabExpanded && (
        <TouchableOpacity
          style={styles.blurBackdrop}
          activeOpacity={1}
          onPress={toggleFab}
        >
          <Animated.View
            style={[
              styles.blurContainer,
              {
                opacity: blurOpacity,
              },
            ]}
          >
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            bottom: fabBottom + 64 - 2,
            opacity: buttonOpacity,
            transform: [
              { translateY: button1TranslateY },
              { translateX: button1TranslateX },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonTextContainer}
          onPress={handleScanFood}
          activeOpacity={0.7}
        >
          <Text style={styles.fabSubButtonText}>Сканировать еду</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fabSubButtonIconContainer}
          onPress={handleScanFood}
          activeOpacity={0.7}
        >
          <Ionicons name="scan-circle-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            bottom: fabBottom + 64 - 8,
            opacity: buttonOpacity,
            transform: [
              { translateY: button2TranslateY },
              { translateX: button2TranslateX },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonTextContainer}
          onPress={handleAddManually}
          activeOpacity={0.7}
        >
          <Text style={styles.fabSubButtonText}>Добавить вручную</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fabSubButtonIconContainer}
          onPress={handleAddManually}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabSubButtonContainer,
          {
            bottom: fabBottom + 64 - 8,
            opacity: buttonOpacity,
            transform: [
              { translateY: button3TranslateY },
              { translateX: button3TranslateX },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabSubButtonTextContainer}
          onPress={handleAddWater}
          activeOpacity={0.7}
        >
          <Text style={styles.fabSubButtonText}>Вода</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fabSubButtonIconContainer}
          onPress={handleAddWater}
          activeOpacity={0.7}
        >
          <Ionicons name="water-outline" size={24} color="#1E90FF" />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity 
        style={[
          styles.fab, 
          { bottom: fabBottom }
        ]}
        onPress={toggleFab}
        activeOpacity={0.8}
      >
        <Animated.View
          style={{
            transform: [{ rotate: fabRotation }],
          }}
        >
          <Ionicons 
            name={fabExpanded ? "close" : "add"} 
            size={32} 
            color="#FFFFFF" 
          />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 24,
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
    left: 20,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#1A1A1A",
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
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 9,
  },
  fabSubButtonTextContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  fabSubButtonIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  fabSubButtonText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
});
