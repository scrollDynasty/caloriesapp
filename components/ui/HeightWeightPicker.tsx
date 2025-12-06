import { Picker } from "@react-native-picker/picker";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

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
  const items = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
          itemStyle={Platform.OS === "ios" ? styles.pickerItem : undefined}
        >
          {items.map((item) => (
            <Picker.Item
              key={item}
              label={String(item)}
              value={item}
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
    color: colors.secondary,
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
  },
  picker: {
    width: "100%",
    height: "100%",
    ...(Platform.OS === "ios" && {
      backgroundColor: "transparent",
    }),
  },
  pickerItem: {
    fontSize: 20,
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});

