import { Picker } from "@react-native-picker/picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";


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


// Компонент для одной колонки пикера
const PickerColumn = ({
  label,
  items,
  value,
  onValueChange,
  columnWidth,
}: {
  label: string;
  items: (string | number)[];
  value: string | number;
  onValueChange: (value: string | number) => void;
  columnWidth?: number;
}) => {
  const containerStyle = columnWidth
    ? [styles.columnContainer, { width: columnWidth }]
    : styles.columnContainer;

  // Проверяем, что items не пустой
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
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={wrapperStyle}>
        {/* Overlay для фона выбранного элемента (только для Android) */}
        {Platform.OS === "android" && (
          <View style={styles.selectedItemOverlay} pointerEvents="none" />
        )}
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={pickerStyle}
          itemStyle={Platform.OS === "ios" ? styles.pickerItem : undefined}
        >
          {items.map((item) => (
            <Picker.Item
              key={String(item)}
              label={String(item)}
              value={item}
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
  const [day, setDay] = useState(value.getDate());
  const [month, setMonth] = useState(value.getMonth());
  const [year, setYear] = useState(value.getFullYear());

  // Генерируем дни в зависимости от месяца и года
  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [year, month]);

  // Генерируем месяцы
  const months = useMemo(() => MONTHS, []);

  // Генерируем годы (от 1950 до текущего года)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);
  }, []);

  // Инициализация при монтировании
  useEffect(() => {
    const newDay = value.getDate();
    const newMonth = value.getMonth();
    const newYear = value.getFullYear();
    if (newDay !== day || newMonth !== month || newYear !== year) {
      setDay(newDay);
      setMonth(newMonth);
      setYear(newYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обновляем день при изменении месяца/года (только если день больше дней в месяце)
  useEffect(() => {
    const daysInMonth = getDaysInMonth(year, month);
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [year, month, day]);

  // Обновляем дату при изменении дня, месяца или года (с задержкой, чтобы избежать конфликтов)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newDate = new Date(year, month, day);
      const currentDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
      
      // Обновляем только если дата действительно изменилась
      if (
        newDate.getFullYear() !== currentDate.getFullYear() ||
        newDate.getMonth() !== currentDate.getMonth() ||
        newDate.getDate() !== currentDate.getDate()
      ) {
        onValueChange(newDate);
      }
    }, 0);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        />
        <PickerColumn
          label="МЕСЯЦ"
          items={months}
          value={MONTHS[month]}
          onValueChange={handleMonthChange}
          columnWidth={200}
        />
        <PickerColumn
          label="ГОД"
          items={years}
          value={year}
          onValueChange={handleYearChange}
          columnWidth={120}
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
    backgroundColor: "#F4F2EF",
    borderRadius: 12,
    zIndex: 0,
  },
  picker: {
    width: "100%",
    height: "100%",
    zIndex: 1,
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

