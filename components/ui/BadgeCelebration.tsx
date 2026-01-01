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
  // Streak
  streak_3: { emoji: "🔥", title: "Новичок", description: "3-дневная серия", color: "#FF453A", gradient: ["#FF453A", "#FF6B3B"] },
  streak_7: { emoji: "🔥", title: "Неделя силы", description: "7-дневная серия", color: "#FF9F0A", gradient: ["#FF9F0A", "#FFB340"] },
  streak_14: { emoji: "⚡", title: "Две недели", description: "14-дневная серия", color: "#FFD60A", gradient: ["#FFD60A", "#FFE340"] },
  streak_30: { emoji: "🏆", title: "Месяц чемпиона", description: "30-дневная серия", color: "#32D74B", gradient: ["#32D74B", "#4AE464"] },
  streak_50: { emoji: "🌟", title: "Полсотни", description: "50-дневная серия", color: "#30D158", gradient: ["#30D158", "#4AE371"] },
  streak_100: { emoji: "💎", title: "Легенда", description: "100-дневная серия", color: "#00CED1", gradient: ["#00CED1", "#40E0D0"] },
  streak_365: { emoji: "🗓️", title: "Год заботы", description: "365-дневная серия", color: "#5AC8FA", gradient: ["#5AC8FA", "#7AD5FB"] },
  streak_1000: { emoji: "♾️", title: "Бессмертный", description: "1000-дневная серия", color: "#AF52DE", gradient: ["#AF52DE", "#BF72EE"] },
  
  // Meals
  first_meal: { emoji: "🍽️", title: "Первое блюдо", description: "Начало пути", color: "#D1D1D6", gradient: ["#D1D1D6", "#E1E1E6"] },
  meals_5: { emoji: "🥄", title: "Ковыряюсь вилкой", description: "5 приёмов пищи", color: "#AEAEB2", gradient: ["#AEAEB2", "#BEBEC2"] },
  meals_10: { emoji: "🥗", title: "Гурман", description: "10 блюд", color: "#3A3A3C", gradient: ["#3A3A3C", "#4A4A4C"] },
  meals_25: { emoji: "🍲", title: "Поварёнок", description: "25 блюд", color: "#D1D1D6", gradient: ["#D1D1D6", "#E1E1E6"] },
  meals_50: { emoji: "👨‍🍳", title: "Шеф-повар", description: "50 блюд", color: "#AEAEB2", gradient: ["#AEAEB2", "#BEBEC2"] },
  meals_100: { emoji: "🌟", title: "Мастер кухни", description: "100 блюд", color: "#3A3A3C", gradient: ["#3A3A3C", "#4A4A4C"] },
  meals_250: { emoji: "✨", title: "Кулинарный эксперт", description: "250 блюд", color: "#D1D1D6", gradient: ["#D1D1D6", "#E1E1E6"] },
  meals_500: { emoji: "👑", title: "Король/Королева кухни", description: "500 блюд", color: "#AEAEB2", gradient: ["#AEAEB2", "#BEBEC2"] },
  meals_1000: { emoji: "🏰", title: "Кулинарная империя", description: "1000 блюд", color: "#3A3A3C", gradient: ["#3A3A3C", "#4A4A4C"] },
  meals_5000: { emoji: "🌌", title: "Гастрономический бог", description: "5000 блюд", color: "#D1D1D6", gradient: ["#D1D1D6", "#E1E1E6"] },
  
  // Water
  water_champion: { emoji: "💧", title: "Водный чемпион", description: "Норма воды", color: "#007AFF", gradient: ["#007AFF", "#2090FF"] },
  water_3_days: { emoji: "💦", title: "Три дня воды", description: "3 дня нормы воды", color: "#5AC8FA", gradient: ["#5AC8FA", "#7AD5FB"] },
  water_week: { emoji: "🌊", title: "Водная неделя", description: "7 дней нормы воды", color: "#00BCD4", gradient: ["#00BCD4", "#40E0D0"] },
  water_month: { emoji: "🧊", title: "Месяц гидратации", description: "30 дней нормы воды", color: "#0097A7", gradient: ["#0097A7", "#30B7C7"] },
  water_100_days: { emoji: "🚰", title: "Источник жизни", description: "100 дней нормы воды", color: "#00796B", gradient: ["#00796B", "#30998B"] },
  water_year: { emoji: "🏞️", title: "Океан здоровья", description: "Год нормы воды", color: "#4CAF50", gradient: ["#4CAF50", "#6CBF70"] },
  
  // Goals
  goal_reached: { emoji: "✅", title: "Цель достигнута", description: "Дневная норма", color: "#34C759", gradient: ["#34C759", "#54D779"] },
  goal_3_days: { emoji: "📈", title: "Три дня в цели", description: "3 дня нормы калорий", color: "#30D158", gradient: ["#30D158", "#50E178"] },
  goal_week: { emoji: "🎯", title: "Неделя в цели", description: "7 дней нормы калорий", color: "#4CAF50", gradient: ["#4CAF50", "#6CBF70"] },
  goal_month: { emoji: "🏆", title: "Месяц в цели", description: "30 дней нормы калорий", color: "#388E3C", gradient: ["#388E3C", "#58AE5C"] },
  goal_100_days: { emoji: "🏅", title: "Мастер цели", description: "100 дней нормы калорий", color: "#2E7D32", gradient: ["#2E7D32", "#4E9D52"] },
  goal_perfectionist: { emoji: "💯", title: "Перфекционист", description: "Идеальная норма калорий", color: "#1B5E20", gradient: ["#1B5E20", "#3B7E40"] },
  
  // Macro
  macro_master: { emoji: "📊", title: "Мастер макросов", description: "Идеальный баланс БЖУ", color: "#AF52DE", gradient: ["#AF52DE", "#BF72EE"] },
  macro_week: { emoji: "⚖️", title: "Неделя баланса", description: "7 дней баланса БЖУ", color: "#9C27B0", gradient: ["#9C27B0", "#BC47D0"] },
  protein_power: { emoji: "💪", title: "Сила белка", description: "Норма белка", color: "#FF6B6B", gradient: ["#FF6B6B", "#FF8B8B"] },
  fiber_friend: { emoji: "🌾", title: "Друг клетчатки", description: "Норма клетчатки", color: "#795548", gradient: ["#795548", "#997568"] },
  keto_king: { emoji: "🥑", title: "Кето-король", description: "7 дней кето", color: "#FFC107", gradient: ["#FFC107", "#FFD137"] },
  
  // Healthy Eating
  healthy_meal: { emoji: "💚", title: "Здоровый выбор", description: "Блюдо с оценкой 8+", color: "#34C759", gradient: ["#34C759", "#54D779"] },
  healthy_week: { emoji: "🌿", title: "Здоровая неделя", description: "7 дней здоровья", color: "#27AE60", gradient: ["#27AE60", "#47CE80"] },
  veggie_lover: { emoji: "🥕", title: "Любитель овощей", description: "5 порций овощей", color: "#FF9800", gradient: ["#FF9800", "#FFB830"] },
  fruit_fanatic: { emoji: "🍎", title: "Фруктовый фанат", description: "3 порции фруктов", color: "#FF2D55", gradient: ["#FF2D55", "#FF4D75"] },
  sugar_free: { emoji: "🚫", title: "Без сахара", description: "День без сахара", color: "#607D8B", gradient: ["#607D8B", "#809DAB"] },
  whole_grains: { emoji: "🍞", title: "Цельнозерновой", description: "7 дней цельнозерновых", color: "#795548", gradient: ["#795548", "#997568"] },
  
  // Weight
  weight_logged: { emoji: "⚖️", title: "На весах", description: "Первое взвешивание", color: "#607D8B", gradient: ["#607D8B", "#809DAB"] },
  weight_week: { emoji: "📈", title: "Контроль веса", description: "Неделя взвешиваний", color: "#795548", gradient: ["#795548", "#997568"] },
  weight_month: { emoji: "📉", title: "Месяц контроля", description: "30 дней взвешиваний", color: "#455A64", gradient: ["#455A64", "#657A84"] },
  weight_loss_5kg: { emoji: "⬇️", title: "Минус 5 кг", description: "Потеря 5 кг", color: "#34C759", gradient: ["#34C759", "#54D779"] },
  weight_loss_10kg: { emoji: "💪", title: "Минус 10 кг", description: "Потеря 10 кг", color: "#2E7D32", gradient: ["#2E7D32", "#4E9D52"] },
  
  // Time-based
  early_bird: { emoji: "🌅", title: "Ранняя пташка", description: "Завтрак до 9 утра", color: "#FFD60A", gradient: ["#FFD60A", "#FFE640"] },
  night_owl: { emoji: "🦉", title: "Сова", description: "Поздний ужин", color: "#5856D6", gradient: ["#5856D6", "#7876E6"] },
  regular_eater: { emoji: "⏰", title: "Регулярное питание", description: "3 приёма в одно время", color: "#007AFF", gradient: ["#007AFF", "#309AFF"] },
  breakfast_club: { emoji: "🍳", title: "Клуб завтраков", description: "7 завтраков", color: "#FFC107", gradient: ["#FFC107", "#FFD137"] },
  
  // Scanner
  scanner_1: { emoji: "📸", title: "Первый скан", description: "1 сканирование", color: "#D1D1D6", gradient: ["#D1D1D6", "#E1E1E6"] },
  scanner_10: { emoji: "🔍", title: "Сканер-любитель", description: "10 сканирований", color: "#AEAEB2", gradient: ["#AEAEB2", "#BEBEC2"] },
  scanner_50: { emoji: "📱", title: "Сканер-про", description: "50 сканирований", color: "#3A3A3C", gradient: ["#3A3A3C", "#5A5A5C"] },
  scanner_100: { emoji: "⚡", title: "Мастер сканирования", description: "100 сканирований", color: "#D1D1D6", gradient: ["#D1D1D6", "#E1E1E6"] },
  scanner_500: { emoji: "🤖", title: "Киборг-сканер", description: "500 сканирований", color: "#AEAEB2", gradient: ["#AEAEB2", "#BEBEC2"] },
  
  // Variety
  variety_10_meals: { emoji: "🌈", title: "Разнообразие", description: "10 разных блюд", color: "#FF5722", gradient: ["#FF5722", "#FF7742"] },
  variety_25_meals: { emoji: "🎨", title: "Палитра вкусов", description: "25 разных блюд", color: "#E64A19", gradient: ["#E64A19", "#F66A39"] },
  variety_50_meals: { emoji: "🌍", title: "Мировой гурман", description: "50 разных блюд", color: "#D32F2F", gradient: ["#D32F2F", "#E34F4F"] },
  cuisine_5: { emoji: "🍜", title: "5 Кухонь", description: "5 разных кухонь", color: "#FFC107", gradient: ["#FFC107", "#FFD137"] },
  cuisine_10: { emoji: "✈️", title: "10 Кухонь", description: "10 разных кухонь", color: "#FFA000", gradient: ["#FFA000", "#FFB030"] },
  
  // Recipe
  recipe_1: { emoji: "📖", title: "Первый рецепт", description: "1 рецепт", color: "#FF2D55", gradient: ["#FF2D55", "#FF4D75"] },
  recipe_5: { emoji: "🧑‍🍳", title: "5 Рецептов", description: "5 рецептов", color: "#E64A19", gradient: ["#E64A19", "#F66A39"] },
  recipe_10: { emoji: "📚", title: "10 Рецептов", description: "10 рецептов", color: "#D32F2F", gradient: ["#D32F2F", "#E34F4F"] },
  recipe_25: { emoji: "🧪", title: "25 Рецептов", description: "25 рецептов", color: "#C2185B", gradient: ["#C2185B", "#D2387B"] },
  
  // Collector
  collector_5: { emoji: "🏅", title: "Коллекционер", description: "5 значков", color: "#FFC107", gradient: ["#FFC107", "#FFD137"] },
  collector_10: { emoji: "🎖️", title: "Достигатор", description: "10 значков", color: "#FF9800", gradient: ["#FF9800", "#FFB830"] },
  collector_25: { emoji: "🏆", title: "Мастер коллекции", description: "25 значков", color: "#F57C00", gradient: ["#F57C00", "#FF9C30"] },
  collector_50: { emoji: "👑", title: "Легенда коллекции", description: "50 значков", color: "#E64A19", gradient: ["#E64A19", "#F66A39"] },
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
