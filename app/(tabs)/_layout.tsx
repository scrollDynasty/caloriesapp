import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#1A1A1A",
          tabBarInactiveTintColor: "#C4C4C4",
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            bottom: insets.bottom + 16,
            left: 20,
            right: 90,
            height: 56,
            backgroundColor: colors.white,
            borderRadius: 28,
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            paddingHorizontal: 8,
          },
          tabBarItemStyle: {
            height: 56,
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
                size={22} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Статистика",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "stats-chart" : "stats-chart-outline"} 
                size={22} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: "Рецепты",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "grid" : "grid-outline"} 
                size={22} 
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
                size={22} 
                color={color} 
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
