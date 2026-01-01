import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";
import Svg, { Circle, Defs, Polygon, RadialGradient, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";
import { hapticSuccess } from "../../utils/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BadgeCelebrationProps {
  visible: boolean;
  badgeType: string;
  onClose: () => void;
}

const BADGE_CONFIG: Record<string, { emoji: string; title: string; description: string; color: string; gradient: [string, string] }> = {
  streak_3: { emoji: "🔥", title: "Новичок!", description: "3-дневная серия!", color: "#FF9500", gradient: ["#FF9500", "#FF6B00"] },
  streak_10: { emoji: "🔥", title: "Серьёзно настроен(а)!", description: "10-дневная серия!", color: "#FF7F00", gradient: ["#FF7F00", "#FF5500"] },
  streak_50: { emoji: "🔥", title: "В плену решения!", description: "50-дневная серия!", color: "#FF6B00", gradient: ["#FF6B00", "#FF4500"] },
  streak_100: { emoji: "🔥", title: "Тройная угроза!", description: "100-дневная серия!", color: "#FF5500", gradient: ["#FF5500", "#FF3500"] },
  streak_365: { emoji: "🔥", title: "Без выходных!", description: "Целый год подряд!", color: "#FF4500", gradient: ["#FF4500", "#FF2500"] },
  streak_1000: { emoji: "🔥", title: "Бессмертный(ая)!", description: "1000 дней - легенда!", color: "#FF3500", gradient: ["#FF3500", "#FF1500"] },
  meals_5: { emoji: "🥄", title: "Ковыряюсь вилкой!", description: "5 приёмов пищи записано!", color: "#FFA502", gradient: ["#FFA502", "#FF6348"] },
  meals_50: { emoji: "🥗", title: "Миссия: Питание!", description: "50 приёмов пищи!", color: "#4CAF50", gradient: ["#4CAF50", "#2E7D32"] },
  meals_500: { emoji: "🍽️", title: "Крёстный Лог!", description: "500 приёмов пищи!", color: "#607D8B", gradient: ["#607D8B", "#455A64"] },
  goal_reached: { emoji: "✅", title: "Цель достигнута!", description: "Ты достиг дневной нормы!", color: "#34C759", gradient: ["#34C759", "#2E7D32"] },
  goal_week: { emoji: "🎯", title: "Неделя в цели!", description: "7 дней нормы калорий!", color: "#4CAF50", gradient: ["#4CAF50", "#388E3C"] },
  water_champion: { emoji: "💧", title: "Водный чемпион!", description: "Норма воды выполнена!", color: "#2196F3", gradient: ["#2196F3", "#1976D2"] },
  water_week: { emoji: "🌊", title: "Водная неделя!", description: "7 дней нормы воды!", color: "#00BCD4", gradient: ["#00BCD4", "#0097A7"] },
  macro_master: { emoji: "📊", title: "Мастер макросов!", description: "Идеальный баланс БЖУ!", color: "#AF52DE", gradient: ["#AF52DE", "#9C27B0"] },
  healthy_meal: { emoji: "💚", title: "Здоровый выбор!", description: "Блюдо с оценкой 8+!", color: "#34C759", gradient: ["#34C759", "#27AE60"] },
  weight_logged: { emoji: "⚖️", title: "На весах!", description: "Первое взвешивание!", color: "#607D8B", gradient: ["#607D8B", "#455A64"] },
  weight_week: { emoji: "📈", title: "Контроль веса!", description: "Неделя взвешиваний!", color: "#795548", gradient: ["#795548", "#5D4037"] },
  explorer: { emoji: "🗺️", title: "Исследователь!", description: "5 разных блюд попробовано!", color: "#FF5722", gradient: ["#FF5722", "#E64A19"] },
  collector: { emoji: "🏅", title: "Коллекционер!", description: "У тебя уже 5 значков!", color: "#FFC107", gradient: ["#FFC107", "#FFA000"] },
  achiever: { emoji: "🎖️", title: "Достигатор!", description: "10 значков - молодец!", color: "#FF9800", gradient: ["#FF9800", "#F57C00"] },
};

const BadgeIcon = ({ 
  emoji, 
  gradient,
  size = 180 
}: { 
  emoji: string; 
  gradient: [string, string];
  size?: number;
}) => {
  return (
    <View style={[styles.badgeIcon, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="badge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradient[0]} />
            <Stop offset="100%" stopColor={gradient[1]} />
          </SvgGradient>
          <RadialGradient id="badge-glow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={gradient[0]} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={gradient[1]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        
        <Circle cx="50" cy="50" r="50" fill="url(#badge-glow)" />
        <Circle cx="50" cy="50" r="48" fill="url(#badge-grad)" />
        <Circle cx="50" cy="50" r="42" fill="rgba(255,255,255,0.2)" />
      </Svg>
      
      <View style={styles.badgeIconEmoji}>
        <Text style={[styles.badgeEmojiText, { fontSize: size * 0.45 }]}>
          {emoji}
        </Text>
      </View>
    </View>
  );
};

export function BadgeCelebration({ visible, badgeType, onClose }: BadgeCelebrationProps) {
  const { colors } = useTheme();
  const hasTriggeredHaptic = useRef(false);

  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const raysRotation = useSharedValue(0);

  const particles = useRef(
    Array.from({ length: 30 }, () => ({
      x: useSharedValue(0),
      y: useSharedValue(0),
      opacity: useSharedValue(1),
      scale: useSharedValue(1),
    }))
  ).current;

  const defaultConfig = {
    emoji: "🏆",
    title: "Достижение!",
    description: "Новый значок!",
    color: "#FFD700",
    gradient: ["#FFD700", "#FFA500"] as [string, string],
  };
  
  const config = BADGE_CONFIG[badgeType] || defaultConfig;

  useEffect(() => {
    if (visible && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      hapticSuccess();

      scale.value = withSequence(
        withDelay(200, withSpring(1.4, { damping: 8, stiffness: 150 })),
        withSpring(1, { damping: 12, stiffness: 200 })
      );

      rotation.value = withSequence(
        withDelay(200, withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }))
      );

      glowScale.value = withDelay(
        100,
        withRepeat(
          withSequence(
            withTiming(1.3, { duration: 1000 }),
            withTiming(0.8, { duration: 1000 })
          ),
          -1,
          true
        )
      );

      glowOpacity.value = withDelay(
        100,
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: 1000 }),
            withTiming(0.3, { duration: 1000 })
          ),
          -1,
          true
        )
      );

      raysRotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );

      particles.forEach((p, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 200 + Math.random() * 150;
        const delay = 300 + Math.random() * 400;
        const duration = 1200 + Math.random() * 600;

        p.x.value = withDelay(
          delay,
          withTiming(Math.cos(angle) * distance, {
            duration,
            easing: Easing.out(Easing.cubic),
          })
        );
        p.y.value = withDelay(
          delay,
          withTiming(Math.sin(angle) * distance - 50, {
            duration,
            easing: Easing.out(Easing.cubic),
          })
        );
        p.opacity.value = withDelay(
          delay + duration - 400,
          withTiming(0, { duration: 400 })
        );
        p.scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1.2, { duration: 300 }),
            withTiming(0, { duration: duration - 300 })
          )
        );
      });
    }

    if (!visible) {
      hasTriggeredHaptic.current = false;
      scale.value = 0;
      rotation.value = 0;
      glowScale.value = 0.8;
      glowOpacity.value = 0;
      raysRotation.value = 0;
    }
  }, [visible]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raysRotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.overlay}>
      {particles.map((p, i) => {
        const particleStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: p.x.value },
            { translateY: p.y.value },
            { scale: p.scale.value },
          ],
          opacity: p.opacity.value,
        }));

        const isSpecial = i % 5 === 0;

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              particleStyle,
              {
                backgroundColor: isSpecial ? "#FFD700" : config.gradient[i % 2],
                width: isSpecial ? 12 : 8,
                height: isSpecial ? 12 : 8,
                borderRadius: isSpecial ? 6 : 4,
              },
            ]}
          />
        );
      })}

      <View style={styles.content}>
        <Animated.View style={[styles.rays, raysStyle]}>
          <Svg width={400} height={400} viewBox="0 0 400 400">
            <Defs>
              <SvgGradient id="ray-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={config.gradient[0]} stopOpacity="0" />
                <Stop offset="50%" stopColor={config.gradient[1]} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={config.gradient[0]} stopOpacity="0" />
              </SvgGradient>
            </Defs>
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 360;
              return (
                <Polygon
                  key={i}
                  points="200,200 195,50 205,50"
                  fill="url(#ray-grad)"
                  transform={`rotate(${angle} 200 200)`}
                />
              );
            })}
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={[config.gradient[0], config.gradient[1], "transparent"]}
            style={styles.glowGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        <Animated.View style={badgeStyle}>
          <BadgeIcon emoji={config.emoji} gradient={config.gradient} size={180} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.newText}>🎉 НОВЫЙ ЗНАЧОК! 🎉</Text>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>

        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: config.gradient[0] }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Потрясающе! 🔥</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  rays: {
    position: "absolute",
    width: 400,
    height: 400,
  },
  glow: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  glowGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 200,
  },
  badgeIcon: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeIconEmoji: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmojiText: {
    textAlign: "center",
  },
  textContainer: {
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 32,
  },
  newText: {
    fontSize: 16,
    fontFamily: "Inter_800ExtraBold",
    color: "#FFD700",
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_800ExtraBold",
    color: "#FFF",
    marginTop: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
    textAlign: "center",
  },
  closeButton: {
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  closeButtonText: {
    fontSize: 19,
    fontFamily: "Inter_800ExtraBold",
    color: "#FFF",
  },
  dismissArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  particle: {
    position: "absolute",
  },
});

export default BadgeCelebration;
