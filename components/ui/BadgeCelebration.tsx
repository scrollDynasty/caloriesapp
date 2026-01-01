import React, { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { hapticSuccess } from "../../utils/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BadgeCelebrationProps {
  visible: boolean;
  badgeType: string;
  onClose: () => void;
}

const BADGE_CONFIG: Record<string, { emoji: string; title: string; description: string; color: string }> = {
  first_meal: { emoji: "🍽️", title: "Первое блюдо!", description: "Ты записал своё первое блюдо!", color: "#FF6B6B" },
  meals_10: { emoji: "🥗", title: "Гурман!", description: "Ты добавил уже 10 блюд!", color: "#4CAF50" },
  meals_50: { emoji: "👨‍🍳", title: "Шеф-повар!", description: "50 блюд - впечатляет!", color: "#FF9800" },
  meals_100: { emoji: "🌟", title: "Мастер кухни!", description: "100 блюд - ты профи!", color: "#9C27B0" },
  streak_3: { emoji: "🔥", title: "Первые шаги!", description: "3 дня подряд!", color: "#FF9500" },
  streak_7: { emoji: "🔥", title: "Неделя силы!", description: "Целая неделя отслеживания!", color: "#FF6B00" },
  streak_14: { emoji: "⚡", title: "Две недели!", description: "14 дней - отличная работа!", color: "#FFD700" },
  streak_30: { emoji: "🏆", title: "Месяц чемпиона!", description: "Целый месяц подряд!", color: "#FFD700" },
  streak_100: { emoji: "💎", title: "Легенда!", description: "100 дней - невероятно!", color: "#00CED1" },
  goal_reached: { emoji: "✅", title: "Цель достигнута!", description: "Ты достиг дневной нормы!", color: "#34C759" },
  goal_week: { emoji: "🎯", title: "Неделя в цели!", description: "7 дней нормы калорий!", color: "#4CAF50" },
  water_champion: { emoji: "💧", title: "Водный чемпион!", description: "Норма воды выполнена!", color: "#2196F3" },
  water_week: { emoji: "🌊", title: "Водная неделя!", description: "7 дней нормы воды!", color: "#00BCD4" },
  macro_master: { emoji: "📊", title: "Мастер макросов!", description: "Идеальный баланс БЖУ!", color: "#AF52DE" },
  healthy_meal: { emoji: "💚", title: "Здоровый выбор!", description: "Блюдо с оценкой 8+!", color: "#34C759" },
  weight_logged: { emoji: "⚖️", title: "На весах!", description: "Первое взвешивание!", color: "#607D8B" },
  weight_week: { emoji: "📈", title: "Контроль веса!", description: "Неделя взвешиваний!", color: "#795548" },
  explorer: { emoji: "🗺️", title: "Исследователь!", description: "5 разных блюд попробовано!", color: "#FF5722" },
  collector: { emoji: "🏅", title: "Коллекционер!", description: "У тебя уже 5 значков!", color: "#FFC107" },
  achiever: { emoji: "🎖️", title: "Достигатор!", description: "10 значков - молодец!", color: "#FF9800" },
};

const DEFAULT_BADGE_CONFIG = { 
  emoji: "🏆", 
  title: "Новое достижение!", 
  description: "Ты заработал новый значок!", 
  color: "#FFD700" 
};

const Confetti = React.memo(function Confetti({ index, color }: { index: number; color: string }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startX = (Math.random() - 0.5) * SCREEN_WIDTH;
  const endX = startX + (Math.random() - 0.5) * 200;
  const duration = 2500 + Math.random() * 1000;
  const delay = index * 80;

  useEffect(() => {
    translateX.value = startX;
    translateX.value = withDelay(delay, withTiming(endX, { duration, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 100, { duration, easing: Easing.in(Easing.quad) }));
    rotate.value = withDelay(delay, withTiming(720, { duration, easing: Easing.linear }));
    opacity.value = withDelay(delay + duration - 500, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  const shape = ["square", "circle", "triangle"][index % 3];
  return (
    <Animated.View
      style={[
        styles.confetti, style,
        shape === "triangle"
          ? { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 12, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color }
          : { width: 12, height: 12, backgroundColor: color, borderRadius: shape === "circle" ? 6 : 2 },
      ]}
    />
  );
});

export function BadgeCelebration({ visible, badgeType, onClose }: BadgeCelebrationProps) {
  const { colors, isDark } = useTheme();
  const hasTriggeredHaptic = useRef(false);

  const scale = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);

  const config = BADGE_CONFIG[badgeType] || DEFAULT_BADGE_CONFIG;
  const confettiColors = [config.color, "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];

  useEffect(() => {
    if (visible && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      hapticSuccess();

      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      badgeScale.value = withSequence(
        withDelay(200, withSpring(1.2, { damping: 8, stiffness: 150 })),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      badgeRotate.value = withSequence(
        withDelay(200, withTiming(-10, { duration: 100 })),
        withTiming(10, { duration: 100 }),
        withTiming(-5, { duration: 80 }),
        withTiming(5, { duration: 80 }),
        withTiming(0, { duration: 60 })
      );
      glowOpacity.value = withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(0.4, { duration: 1000 })), 3, true);
      ringScale.value = withRepeat(withSequence(withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }), withTiming(1, { duration: 0 })), 2, false);
    }

    if (!visible) {
      hasTriggeredHaptic.current = false;
      scale.value = badgeScale.value = glowOpacity.value = ringScale.value = 0;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }, { rotate: `${badgeRotate.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.value }], opacity: 1 - ringScale.value / 1.5 }));

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.overlay}>
      {Array.from({ length: 15 }).map((_, i) => (
        <Confetti key={i} index={i} color={confettiColors[i % confettiColors.length]} />
      ))}

      <Animated.View style={[styles.content, overlayStyle]}>
        <Animated.View style={[styles.glow, glowStyle, { backgroundColor: config.color }]} />
        <Animated.View style={[styles.ring, ringStyle, { borderColor: config.color }]} />

        <Animated.View style={[styles.badgeContainer, badgeStyle, { backgroundColor: isDark ? colors.card : "#FFFFF0" }]}>
          <View style={[styles.badgeIconContainer, { backgroundColor: `${config.color}20` }]}>
            <Text style={styles.badgeEmoji}>{config.emoji}</Text>
          </View>
          <Text style={[styles.badgeTitle, { color: colors.text }]}>{config.title}</Text>
          <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>{config.description}</Text>
          <View style={styles.starsContainer}>
            <Text style={styles.star}>⭐</Text>
            <Text style={[styles.star, styles.starBig]}>🌟</Text>
            <Text style={styles.star}>⭐</Text>
          </View>
        </Animated.View>

        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.buttonPrimary }]} onPress={onClose} activeOpacity={0.8}>
          <Text style={[styles.closeButtonText, { color: colors.buttonPrimaryText }]}>Отлично! 🎉</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  content: { alignItems: "center", justifyContent: "center", width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  glow: { position: "absolute", width: 300, height: 300, borderRadius: 150, opacity: 0.3 },
  ring: { position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 3 },
  badgeContainer: { width: SCREEN_WIDTH - 60, padding: 32, borderRadius: 32, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 20 },
  badgeIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  badgeEmoji: { fontSize: 48 },
  badgeTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 12 },
  badgeDescription: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  starsContainer: { flexDirection: "row", alignItems: "center", marginTop: 24, gap: 8 },
  star: { fontSize: 20 },
  starBig: { fontSize: 28 },
  closeButton: { marginTop: 32, paddingHorizontal: 48, paddingVertical: 18, borderRadius: 16 },
  closeButtonText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  dismissArea: { position: "absolute", top: 0, left: 0, right: 0, height: 100 },
  confetti: { position: "absolute", top: 0, left: SCREEN_WIDTH / 2 },
});

export default BadgeCelebration;
