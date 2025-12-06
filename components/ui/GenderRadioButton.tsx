import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { colors } from "../../constants/theme";

interface GenderRadioButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

/**
 * Компонент радио-кнопки для выбора пола с иконкой
 */
export function GenderRadioButton({
  label,
  icon,
  selected,
  onPress,
}: GenderRadioButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(selected ? 1 : 0);
  const borderWidth = useSharedValue(selected ? 2 : 0);

  // Анимация контейнера
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      borderWidth: borderWidth.value,
    };
  });

  // Анимация галочки
  const checkmarkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          scale: opacity.value,
        },
      ],
    };
  });


  const handlePressIn = () => {
    // Плавное нажатие
    scale.value = withSpring(0.96, {
      damping: 15,
      stiffness: 300,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    // Плавное возвращение
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePress = () => {
    if (!selected) {
      // Haptic feedback при выборе
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Анимация появления галочки
      opacity.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });
      
      // Анимация границы
      borderWidth.value = withTiming(2, { duration: 200 });
    }

    onPress();
  };

  // Синхронизация анимации с состоянием
  useEffect(() => {
    if (selected) {
      opacity.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });
      borderWidth.value = withTiming(2, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      borderWidth.value = withTiming(0, { duration: 150 });
    }
  }, [selected, opacity, borderWidth]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.touchable}
    >
      <Animated.View
        style={[
          styles.radioContainer,
          selected && styles.radioContainerSelected,
          animatedStyle,
        ]}
      >
        {/* Иконка */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon as any}
            size={36}
            color={selected ? colors.primary : colors.secondary}
          />
        </View>

        {/* Текст */}
        <Text style={[styles.radioText, selected && styles.radioTextSelected]}>
          {label}
        </Text>

        {/* Галочка */}
        <Animated.View style={[styles.checkmarkContainer, checkmarkAnimatedStyle]}>
          <View style={styles.checkmark} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  radioContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderColor: colors.primary,
    minHeight: 152, // Минимальная высота для адаптивности
    gap: 16,
    // Тень из Figma: 0px 2px 8px 0px rgba(0, 0, 0, 0.04)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  radioContainerSelected: {
    backgroundColor: "#F4F2EF",
    // Тень из Figma: 0px 8px 20px -6px rgba(0, 0, 0, 0.1)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainer: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 36,
    backgroundColor: colors.background,
  },
  radioText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 21.78,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  radioTextSelected: {
    color: colors.primary,
  },
  checkmarkContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 7,
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});

