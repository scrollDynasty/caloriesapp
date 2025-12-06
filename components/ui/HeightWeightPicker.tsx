import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface HeightWeightPickerProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  unit: string;
  min: number;
  max: number;
}

const ITEM_HEIGHT = 56;
const ITEM_SPACING = 12; // Увеличенный отступ между элементами
const ITEM_TOTAL_HEIGHT = ITEM_HEIGHT + ITEM_SPACING; // Общая высота элемента с отступом
const PICKER_HEIGHT = 280;
const CENTER_OFFSET = (PICKER_HEIGHT - ITEM_HEIGHT) / 2; // 112px

// Функция для расчета точного offset элемента с учетом центрирования
const getItemOffset = (index: number): number => {
  // Первый элемент (index 0) должен быть на позиции 0
  // Каждый следующий элемент смещается на ITEM_TOTAL_HEIGHT
  // Это обеспечивает правильное центрирование с учетом paddingTop = CENTER_OFFSET
  return index * ITEM_TOTAL_HEIGHT;
};

// Мемоизированный компонент элемента для оптимизации
const PickerItem = React.memo(
  ({ item, isSelected, unit }: { item: number; isSelected: boolean; unit: string }) => (
    <View style={styles.itemContainer}>
      <Text
        style={[styles.itemText, isSelected && styles.itemTextSelected]}
        numberOfLines={1}
      >
        {item}
      </Text>
      {isSelected && (
        <Text style={styles.unitText} numberOfLines={1}>
          {unit}
        </Text>
      )}
    </View>
  ),
  (prevProps, nextProps) => {
    // Оптимизированное сравнение - перерисовываем только если изменилось selected или item
    return (
      prevProps.item === nextProps.item &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.unit === nextProps.unit
    );
  }
);

// Мемоизированный основной компонент для предотвращения лишних ререндеров
export const HeightWeightPicker = React.memo(function HeightWeightPicker({
  label,
  value,
  onValueChange,
  unit,
  min,
  max,
}: HeightWeightPickerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const items = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max]
  );
  const previousValueRef = useRef<number>(value);
  const lastHapticTimeRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const shouldUpdateScrollRef = useRef<boolean>(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  // Быстрая инициализация без задержек
  const handleLayout = useCallback(() => {
    if (scrollViewRef.current && !isInitializedRef.current) {
      const selectedIndex = items.indexOf(value);
      if (selectedIndex >= 0) {
        const targetOffset = getItemOffset(selectedIndex);
        // Используем setTimeout вместо requestAnimationFrame для более быстрой инициализации
        setTimeout(() => {
          if (scrollViewRef.current && !isInitializedRef.current) {
            scrollViewRef.current.scrollTo({
              y: targetOffset,
              animated: false,
            });
            isInitializedRef.current = true;
            shouldUpdateScrollRef.current = false;
          }
        }, 0);
      }
    }
  }, [items, value]);

  // Обновление скролла при изменении значения извне (только если не скроллим)
  useEffect(() => {
    if (
      scrollViewRef.current &&
      !isScrollingRef.current &&
      isInitializedRef.current &&
      shouldUpdateScrollRef.current
    ) {
      const selectedIndex = items.indexOf(value);
      if (selectedIndex >= 0) {
        const targetOffset = getItemOffset(selectedIndex);
        // Используем requestAnimationFrame для плавного скролла
        requestAnimationFrame(() => {
          if (scrollViewRef.current && !isScrollingRef.current) {
            scrollViewRef.current.scrollTo({
              y: targetOffset,
              animated: true,
            });
          }
        });
      }
    }
  }, [value, items]);

  // Cleanup timeout при размонтировании и при изменении зависимостей
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      // Сбрасываем все refs при размонтировании
      isScrollingRef.current = false;
      isInitializedRef.current = false;
      pendingValueRef.current = null;
    };
  }, []);

  const handleScroll = useCallback((event: any) => {
    if (!isInitializedRef.current) return;
    
    isScrollingRef.current = true;
    shouldUpdateScrollRef.current = false;
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Упрощенный расчет индекса с учетом spacing
    const index = Math.round(scrollY / ITEM_TOTAL_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const newValue = items[clampedIndex];

    // Обновляем значение только если оно изменилось
    if (newValue !== previousValueRef.current) {
      previousValueRef.current = newValue;
      pendingValueRef.current = newValue;

      // Оптимизированная вибрация - только при значительном изменении и с большим интервалом
      const now = Date.now();
      if (now - lastHapticTimeRef.current > 200) {
        // Используем requestIdleCallback для неблокирующей вибрации
        requestAnimationFrame(() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {
            // Игнорируем ошибки вибрации
          }
        });
        lastHapticTimeRef.current = now;
      }

      // Debounce для onValueChange - очищаем предыдущий timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      
      // Устанавливаем новый timeout только если значение действительно изменилось
      scrollTimeoutRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null && pendingValueRef.current !== value) {
          onValueChange(pendingValueRef.current);
          pendingValueRef.current = null;
        }
        scrollTimeoutRef.current = null;
      }, 100);
    }
  }, [items, onValueChange, value]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    // Очищаем pending timeout перед финальным обновлением
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    isScrollingRef.current = false;
    shouldUpdateScrollRef.current = true;
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Точный расчет индекса - округляем к ближайшему элементу
    const index = Math.round(scrollY / ITEM_TOTAL_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const newValue = items[clampedIndex];

    if (scrollViewRef.current) {
      // Используем точную функцию для расчета offset
      const targetOffset = getItemOffset(clampedIndex);
      
      // Используем requestAnimationFrame для плавного скролла
      requestAnimationFrame(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: targetOffset,
            animated: true,
          });
        }
      });
      
      if (newValue !== value) {
        previousValueRef.current = newValue;
        // Вибрация только при окончании скролла для финального значения
        requestAnimationFrame(() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (e) {
            // Игнорируем ошибки вибрации
          }
        });
        onValueChange(newValue);
      }
    }
  }, [items, value, onValueChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWrapper}>
        {/* Градиент сверху */}
        <LinearGradient
          colors={["rgba(249, 247, 245, 1)", "rgba(249, 247, 245, 0)"]}
          style={styles.gradientTop}
        />

        {/* Градиент снизу */}
        <LinearGradient
          colors={["rgba(249, 247, 245, 0)", "rgba(249, 247, 245, 1)"]}
          style={styles.gradientBottom}
        />

        {/* Выделенная область */}
        <View style={styles.selectedArea} />

        {/* Список значений */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_TOTAL_HEIGHT}
          decelerationRate="fast"
          onLayout={handleLayout}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={() => {
            // Очищаем pending timeout при начале скролла
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
              scrollTimeoutRef.current = null;
            }
            isScrollingRef.current = true;
            shouldUpdateScrollRef.current = false;
          }}
          scrollEventThrottle={64}
          removeClippedSubviews={true}
          nestedScrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          scrollEnabled={true}
        >
          {items.map((item) => (
            <PickerItem
              key={item}
              item={item}
              isSelected={item === value}
              unit={unit}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Мемоизация компонента - перерисовываем только если изменились важные пропсы
  return (
    prevProps.value === nextProps.value &&
    prevProps.min === nextProps.min &&
    prevProps.max === nextProps.max &&
    prevProps.unit === nextProps.unit &&
    prevProps.label === nextProps.label &&
    prevProps.onValueChange === nextProps.onValueChange
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16.94,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 32,
  },
  pickerWrapper: {
    width: 120,
    height: PICKER_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET,
    zIndex: 1,
    pointerEvents: "none",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET,
    zIndex: 1,
    pointerEvents: "none",
  },
  selectedArea: {
    position: "absolute",
    top: CENTER_OFFSET,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E6E1D8",
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: CENTER_OFFSET,
    paddingBottom: CENTER_OFFSET,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: ITEM_SPACING,
  },
  itemText: {
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24.2,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    textAlign: "center",
  },
  itemTextSelected: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38.72,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  unitText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 19.36,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    marginLeft: 4,
    paddingTop: 8,
  },
});

