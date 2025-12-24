import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Конфигурация линейки
const MIN_WEIGHT = 30;
const MAX_WEIGHT = 200;
const STEP = 0.5; // Шаг 0.5 кг
const TICK_WIDTH = 10; // Ширина между делениями
const VISIBLE_TICKS = Math.floor(SCREEN_WIDTH / TICK_WIDTH);

export default function ChangeWeightScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ currentWeight: string }>();
  
  const initialWeight = params.currentWeight ? parseFloat(params.currentWeight) : 70;
  const [weight, setWeight] = useState(initialWeight);
  const [saving, setSaving] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  // Общее количество делений
  const totalTicks = Math.floor((MAX_WEIGHT - MIN_WEIGHT) / STEP) + 1;
  const rulerWidth = totalTicks * TICK_WIDTH;

  // Преобразование веса в позицию скролла
  const weightToScrollX = useCallback((w: number) => {
    const tickIndex = (w - MIN_WEIGHT) / STEP;
    return tickIndex * TICK_WIDTH;
  }, []);

  // Преобразование позиции скролла в вес
  const scrollXToWeight = useCallback((scrollX: number) => {
    const tickIndex = Math.round(scrollX / TICK_WIDTH);
    const newWeight = MIN_WEIGHT + tickIndex * STEP;
    return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newWeight));
  }, []);

  // Инициализация скролла на текущий вес
  const handleContentSizeChange = useCallback(() => {
    if (scrollViewRef.current && !isScrolling.current) {
      const scrollX = weightToScrollX(weight);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: false });
    }
  }, [weight, weightToScrollX]);

  // Обработка скролла
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const newWeight = scrollXToWeight(scrollX);
      if (newWeight !== weight) {
        setWeight(newWeight);
      }
    },
    [scrollXToWeight, weight]
  );

  // Привязка к ближайшему делению при окончании скролла
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      const scrollX = event.nativeEvent.contentOffset.x;
      const newWeight = scrollXToWeight(scrollX);
      const targetScrollX = weightToScrollX(newWeight);
      
      if (Math.abs(scrollX - targetScrollX) > 1) {
        scrollViewRef.current?.scrollTo({ x: targetScrollX, animated: true });
      }
      setWeight(newWeight);
    },
    [scrollXToWeight, weightToScrollX]
  );

  const handleScrollBegin = useCallback(() => {
    isScrolling.current = true;
  }, []);

  // Сохранение веса
  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.addWeightLog(weight);
      Alert.alert("Сохранено", `Вес ${weight.toFixed(1)} кг сохранён`);
      router.back();
    } catch (error: any) {
      Alert.alert("Ошибка", error?.message || "Не удалось сохранить вес");
    } finally {
      setSaving(false);
    }
  };

  // Генерация делений линейки
  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < totalTicks; i++) {
      const currentWeight = MIN_WEIGHT + i * STEP;
      const isWholeNumber = currentWeight % 1 === 0;
      const isFiveMultiple = currentWeight % 5 === 0;
      
      ticks.push(
        <View key={i} style={styles.tickContainer}>
          <View
            style={[
              styles.tick,
              {
                height: isFiveMultiple ? 40 : isWholeNumber ? 25 : 15,
                backgroundColor: colors.text,
                opacity: isFiveMultiple ? 1 : isWholeNumber ? 0.6 : 0.3,
              },
            ]}
          />
          {isFiveMultiple && (
            <Text style={[styles.tickLabel, { color: colors.textSecondary }]}>
              {currentWeight}
            </Text>
          )}
        </View>
      );
    }
    return ticks;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Изменить вес</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Weight Display */}
        <View style={styles.weightDisplay}>
          <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>Текущий вес</Text>
          <Text style={[styles.weightValue, { color: colors.text }]}>
            {weight.toFixed(1)} <Text style={styles.weightUnit}>кг</Text>
          </Text>
        </View>

        {/* Ruler */}
        <View style={styles.rulerContainer}>
          {/* Center indicator */}
          <View style={[styles.centerIndicator, { backgroundColor: colors.text }]} />
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBegin}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            contentContainerStyle={[
              styles.rulerContent,
              { paddingHorizontal: SCREEN_WIDTH / 2 },
            ]}
            decelerationRate="fast"
            snapToInterval={TICK_WIDTH}
          >
            {renderTicks()}
          </ScrollView>
        </View>
      </View>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.text }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  weightDisplay: {
    alignItems: "center",
    marginBottom: 60,
  },
  weightLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 56,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  weightUnit: {
    fontSize: 32,
    fontWeight: "400",
  },
  rulerContainer: {
    height: 120,
    position: "relative",
  },
  centerIndicator: {
    position: "absolute",
    top: 0,
    left: "50%",
    width: 3,
    height: 50,
    borderRadius: 1.5,
    marginLeft: -1.5,
    zIndex: 10,
  },
  rulerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 10,
  },
  tickContainer: {
    width: TICK_WIDTH,
    alignItems: "center",
  },
  tick: {
    width: 2,
    borderRadius: 1,
  },
  tickLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
