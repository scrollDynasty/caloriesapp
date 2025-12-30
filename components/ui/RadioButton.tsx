import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    ? (isDark ? "#FFFFFF" : "#000000") 
    : colors.card;
  const textColor = selected 
    ? (isDark ? "#000000" : "#FFFFFF") 
    : colors.text;
  const borderColor = selected 
    ? "transparent" 
    : colors.border;
  const checkBg = selected 
    ? (isDark ? "#000000" : "#FFFFFF") 
    : "transparent";
  const checkBorderColor = selected 
    ? "transparent" 
    : colors.textSecondary;
  const checkIconColor = selected 
    ? (isDark ? "#FFFFFF" : "#000000") 
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
              <Ionicons name="checkmark" size={16} color={checkIconColor} />
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
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  radioText: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  radioCircleContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
