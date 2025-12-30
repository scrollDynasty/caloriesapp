import { Picker } from "@react-native-picker/picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface DatePickerProps {
  value: Date;
  onValueChange: (date: Date) => void;
}

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const PickerColumn = ({
  label,
  items,
  value,
  onValueChange,
  columnWidth,
  themeColors,
  isDark,
}: {
  label: string;
  items: (string | number)[];
  value: string | number;
  onValueChange: (value: string | number) => void;
  columnWidth?: number;
  themeColors: any;
  isDark: boolean;
}) => {
  const containerStyle = columnWidth
    ? [styles.columnContainer, { width: columnWidth }]
    : styles.columnContainer;

  if (!items || items.length === 0) {
    return (
      <View style={containerStyle}>
        <Text style={styles.columnLabel}>{label}</Text>
        <View style={styles.pickerWrapper}>
          <Text>Нет данных</Text>
        </View>
      </View>
    );
  }

  const wrapperStyle = columnWidth
    ? [styles.pickerWrapper, { width: columnWidth }]
    : styles.pickerWrapper;

  const pickerStyle = columnWidth
    ? [styles.picker, { width: columnWidth }]
    : styles.picker;

  return (
    <View style={containerStyle}>
      <Text style={[styles.columnLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      <View style={[wrapperStyle, { backgroundColor: themeColors.background }, { borderRadius: 12 }]}>
        {}
        {Platform.OS === "android" && (
          <View style={[styles.selectedItemOverlay, { backgroundColor: isDark ? themeColors.gray5 : "#FFFFF0" }]} pointerEvents="none" />
        )}
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={[pickerStyle, { color: themeColors.text }]}
          itemStyle={Platform.OS === "ios" ? [styles.pickerItem, { color: themeColors.text }] : { color: themeColors.text }}
        >
          {items.map((item) => (
            <Picker.Item
              key={String(item)}
              label={String(item)}
              value={item}
              color={themeColors.text}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export const DatePicker = React.memo(function DatePicker({
  value,
  onValueChange,
}: DatePickerProps) {
  const { colors: themeColors, isDark } = useTheme();
  const [day, setDay] = useState(value.getDate());
  const [month, setMonth] = useState(value.getMonth());
  const [year, setYear] = useState(value.getFullYear());

  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [year, month]);

  const months = useMemo(() => MONTHS, []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);
  }, []);

  useEffect(() => {
    const newDay = value.getDate();
    const newMonth = value.getMonth();
    const newYear = value.getFullYear();
    if (newDay !== day || newMonth !== month || newYear !== year) {
      setDay(newDay);
      setMonth(newMonth);
      setYear(newYear);
    }
    
  }, []);

  useEffect(() => {
    const daysInMonth = getDaysInMonth(year, month);
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [year, month, day]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newDate = new Date(year, month, day);
      const currentDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());

      if (
        newDate.getFullYear() !== currentDate.getFullYear() ||
        newDate.getMonth() !== currentDate.getMonth() ||
        newDate.getDate() !== currentDate.getDate()
      ) {
        onValueChange(newDate);
      }
    }, 0);
    
    return () => clearTimeout(timer);
    
  }, [day, month, year]);

  const handleDayChange = useCallback(
    (value: string | number) => {
      const numValue = typeof value === "string" ? parseInt(value, 10) : value;
      if (!isNaN(numValue) && numValue > 0) {
        setDay(numValue);
      }
    },
    []
  );

  const handleMonthChange = useCallback(
    (value: string | number) => {
      const monthValue = typeof value === "string" ? value : String(value);
      const newMonth = MONTHS.indexOf(monthValue);
      if (newMonth >= 0) {
        setMonth(newMonth);
      }
    },
    []
  );

  const handleYearChange = useCallback(
    (value: string | number) => {
      const numValue = typeof value === "string" ? parseInt(value, 10) : value;
      if (!isNaN(numValue) && numValue > 0) {
        setYear(numValue);
      }
    },
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.pickersRow}>
        <PickerColumn
          label="ДЕНЬ"
          items={days}
          value={day}
          onValueChange={handleDayChange}
          columnWidth={100}
          themeColors={themeColors}
          isDark={isDark}
        />
        <PickerColumn
          label="МЕСЯЦ"
          items={months}
          value={MONTHS[month]}
          onValueChange={handleMonthChange}
          columnWidth={200}
          themeColors={themeColors}
          isDark={isDark}
        />
        <PickerColumn
          label="ГОД"
          items={years}
          value={year}
          onValueChange={handleYearChange}
          columnWidth={120}
          themeColors={themeColors}
          isDark={isDark}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  pickersRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    width: "100%",
    gap: 16,
    paddingHorizontal: 24,
  },
  columnContainer: {
    alignItems: "center",
    marginBottom: 0,
    marginTop: 0,
    paddingVertical: 0,
    flexShrink: 0,
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16.94,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  pickerWrapper: {
    height: 280,
    overflow: "hidden",
    position: "relative",
  },
  selectedItemOverlay: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 40,
    marginTop: -20,
    borderRadius: 12,
    zIndex: 0,
  },
  picker: {
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  pickerItem: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
});

