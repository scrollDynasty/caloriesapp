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
const PICKER_HEIGHT = 280;
const CENTER_OFFSET = (PICKER_HEIGHT - ITEM_HEIGHT) / 2; // 112px

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
  )
);

export function HeightWeightPicker({
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

  // Быстрая инициализация без задержек
  const handleLayout = useCallback(() => {
    if (scrollViewRef.current && !isInitializedRef.current) {
      const selectedIndex = items.indexOf(value);
      if (selectedIndex >= 0) {
        const targetOffset = selectedIndex * ITEM_HEIGHT;
        requestAnimationFrame(() => {
          if (scrollViewRef.current && !isInitializedRef.current) {
            scrollViewRef.current.scrollTo({
              y: targetOffset,
              animated: false,
            });
            isInitializedRef.current = true;
            shouldUpdateScrollRef.current = false;
          }
        });
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
        const targetOffset = selectedIndex * ITEM_HEIGHT;
        scrollViewRef.current.scrollTo({
          y: targetOffset,
          animated: true,
        });
      }
    }
  }, [value, items]);

  const handleScroll = useCallback((event: any) => {
    if (!isInitializedRef.current) return;
    
    isScrollingRef.current = true;
    shouldUpdateScrollRef.current = false;
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Оптимизированный расчет индекса
    const index = Math.round(scrollY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const newValue = items[clampedIndex];

    // Вибрация при изменении значения
    if (newValue !== previousValueRef.current) {
      const now = Date.now();
      if (now - lastHapticTimeRef.current > 120) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastHapticTimeRef.current = now;
      }
      previousValueRef.current = newValue;
      onValueChange(newValue);
    }
  }, [items, onValueChange]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    isScrollingRef.current = false;
    shouldUpdateScrollRef.current = true;
    const scrollY = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const newValue = items[clampedIndex];

    if (scrollViewRef.current) {
      const targetOffset = clampedIndex * ITEM_HEIGHT;
      scrollViewRef.current.scrollTo({
        y: targetOffset,
        animated: true,
      });
      if (newValue !== value) {
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
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onLayout={handleLayout}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={() => {
            isScrollingRef.current = true;
            shouldUpdateScrollRef.current = false;
          }}
          scrollEventThrottle={8}
          removeClippedSubviews={true}
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

        {/* Граница */}
        <View style={styles.border} />
      </View>
    </View>
  );
}

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
    marginBottom: 24,
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
    backgroundColor: "rgba(255, 255, 255, 0.5)",
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
  border: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: "#E6E1D8",
    borderRadius: 8,
    zIndex: 0,
    pointerEvents: "none",
  },
});

