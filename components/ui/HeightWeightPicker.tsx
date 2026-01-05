import { Picker } from "@react-native-picker/picker";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import WheelScrollPicker from "react-native-wheel-scrollview-picker";
import { useTheme } from "../../context/ThemeContext";

interface HeightWeightPickerProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  unit: string;
  min: number;
  max: number;
}

const WheelItem = React.memo(({ 
  data, 
  textColor 
}: { 
  data: any; 
  textColor: string;
}) => (
  <View style={styles.wheelItemContainer}>
    <Text style={[styles.wheelItem, { color: textColor }]}>
      {String(data)}
    </Text>
  </View>
));

export const HeightWeightPicker = React.memo(function HeightWeightPicker({
  label,
  value,
  onValueChange,
  unit,
  min,
  max,
}: HeightWeightPickerProps) {
  const { colors: themeColors, isDark } = useTheme();
  const items = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max]
  );
  
  const selectedIndex = useMemo(() => items.indexOf(value), [items, value]);
  const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderItem = useCallback((data: any, index: number) => {
    return (
      <WheelItem 
        key={`${data}-${index}`}
        data={data} 
        textColor={themeColors.text}
      />
    );
  }, [themeColors.text]);

  const handleValueChange = useCallback((data: any, selectedIndex: number) => {
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    changeTimeoutRef.current = setTimeout(() => {
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        onValueChange(items[selectedIndex]);
      }
    }, 16);
  }, [items, onValueChange]);

  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  if (Platform.OS === "android") {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>{label}</Text>
        <View style={[styles.pickerWrapper, { backgroundColor: themeColors.background }]}>
          <WheelScrollPicker
            dataSource={items}
            selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}
            renderItem={renderItem}
            onValueChange={handleValueChange}
            wrapperHeight={280}
            wrapperBackground={themeColors.background}
            itemHeight={50}
            highlightColor={isDark ? (themeColors.gray5 || "#1a1a1a") : "#FFFFF0"}
            highlightBorderWidth={2}
            style={{ width: 120 }}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
          />
          <View 
            style={[
              styles.selectedItemOverlay, 
              { 
                borderColor: themeColors.primary || "#007AFF",
              }
            ]} 
            pointerEvents="none" 
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.textSecondary }]}>{label}</Text>
      <View style={[styles.pickerWrapper, { backgroundColor: themeColors.background }]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={[styles.picker, { color: themeColors.text }]}
          itemStyle={[styles.pickerItem, { color: themeColors.text }]}
        >
          {items.map((item) => (
            <Picker.Item
              key={item}
              label={String(item)}
              value={item}
              color={themeColors.text}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16.94,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  pickerWrapper: {
    width: 120,
    height: 280,
    overflow: "hidden",
    borderRadius: 12,
  },
  picker: {
    width: "100%",
    height: "100%",
  },
  pickerItem: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  selectedItemOverlay: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 50,
    marginTop: -25,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 10,
  },
  wheelItemContainer: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItem: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 24,
    includeFontPadding: false,
  },
});

