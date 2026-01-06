import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { hapticLight, hapticMedium } from "../../utils/haptics";

interface RadioButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function RadioButton({ label, selected, onPress }: RadioButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 15,
      stiffness: 300,
    });
    hapticLight();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePress = () => {
    if (!selected) {
      hapticMedium();
    }
    onPress();
  };

  const containerBg = selected 
    ? (isDark ? "#FFFFF0" : "#FFFFF0") 
    : colors.card;
  const textColor = selected 
    ? (isDark ? "#000000" : "#2D2A26") 
    : colors.text;
  const borderColor = selected 
    ? colors.primary 
    : colors.border;
  const borderWidth = selected ? 2 : 1;
  const checkBg = selected 
    ? colors.primary
    : "transparent";
  const checkBorderColor = selected 
    ? colors.primary
    : colors.textSecondary;
  const checkIconColor = selected 
    ? (isDark ? "#FFFFF0" : "#FFFFFF") 
    : "transparent";

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.radioContainer,
          {
            backgroundColor: containerBg,
            borderColor: borderColor,
            borderWidth: borderWidth,
            shadowColor: selected ? colors.primary : "#000",
            shadowOpacity: selected ? 0.15 : 0.06,
            shadowRadius: selected ? 12 : 8,
            elevation: selected ? 6 : 3,
          },
          animatedStyle,
        ]}
      >
        <Text style={[styles.radioText, { color: textColor }]}>{label}</Text>
        <View style={styles.radioCircleContainer}>
          <View 
            style={[
              styles.radioCircle, 
              { 
                backgroundColor: checkBg,
                borderColor: checkBorderColor,
              }
            ]}
          >
            {selected && (
              <Ionicons name="checkmark" size={Platform.OS === "android" ? 15 : 17} color={checkIconColor} />
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    padding: Platform.OS === "android" ? 14 : 18,
    borderRadius: Platform.OS === "android" ? 16 : 18,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  radioText: {
    fontSize: Platform.OS === "android" ? 15 : 16,
    fontWeight: "600",
    lineHeight: Platform.OS === "android" ? 20 : 22,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  radioCircleContainer: {
    width: Platform.OS === "android" ? 22 : 26,
    height: Platform.OS === "android" ? 22 : 26,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircle: {
    width: Platform.OS === "android" ? 22 : 26,
    height: Platform.OS === "android" ? 22 : 26,
    borderRadius: Platform.OS === "android" ? 11 : 13,
    borderWidth: Platform.OS === "android" ? 1.5 : 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
