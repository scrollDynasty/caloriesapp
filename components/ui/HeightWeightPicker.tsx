import { Picker } from "@react-native-picker/picker";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface HeightWeightPickerProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  unit: string;
  min: number;
  max: number;
}

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

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.textSecondary }]}>{label}</Text>
      <View style={[styles.pickerWrapper, { backgroundColor: themeColors.background }]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={[styles.picker, { color: themeColors.text }]}
          itemStyle={Platform.OS === "ios" ? [styles.pickerItem, { color: themeColors.text }] : { color: themeColors.text }}
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
});

