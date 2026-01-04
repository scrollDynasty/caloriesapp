import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { hapticLight } from "../../utils/haptics";

interface HomeHeaderProps {
  streak?: number;
}

export const HomeHeader = memo(function HomeHeader({ streak = 0 }: HomeHeaderProps) {
  const { colors: themeColors, isDark } = useTheme();
  const router = useRouter();
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const handleStreakPress = () => {
    hapticLight();
    
    // Анимация при нажатии
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    rotate.value = withSequence(
      withSpring(-10, { damping: 10 }),
      withSpring(10, { damping: 10 }),
      withSpring(0, { damping: 10 })
    );

    // Переход на экран значков
    router.push("/badges" as any);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <View style={styles.logoContainer}>
          <Image
            source={isDark ? require("../../assets/images/bright_logo.png") : require("../../assets/images/dark_logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Text style={[styles.appName, { color: themeColors.text }]}>Yeb Ich</Text>
      </View>
      
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleStreakPress}
      >
        <Animated.View style={[styles.streakBadge, { backgroundColor: themeColors.card }, animatedStyle]}>
        <Ionicons name="flame" size={18} color="#FF9F43" />
        <Text style={[styles.streakText, { color: themeColors.text }]}>{streak}</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  streakText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.1,
  },
});
