import { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";

interface WeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const WeekCalendar = memo(function WeekCalendar({ selectedDate, onDateSelect }: WeekCalendarProps) {
  // Мемоизируем сегодняшнюю дату
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Мемоизируем timestamp выбранной даты для стабильного сравнения
  const selectedDateTimestamp = useMemo(() => {
    const normalized = new Date(selectedDate);
    normalized.setHours(0, 0, 0, 0);
    return normalized.getTime();
  }, [selectedDate]);

  // Мемоизируем вычисление дней недели
  const weekDays = useMemo(() => {
    // Получаем начало недели, содержащей выбранную дату (понедельник)
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    // Преобразуем воскресенье (0) в 7, чтобы неделя начиналась с понедельника
    const mondayOffset = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

    // Генерируем 7 дней недели
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, [selectedDateTimestamp]);

  // Массив дней недели
  const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  return (
    <View style={styles.calendarContainer}>
      {weekDays.map((date, index) => {
        const dateTimestamp = date.getTime();
        const isSelected = dateTimestamp === selectedDateTimestamp;
        const isToday = isSameDay(date, today);

        return (
          <TouchableOpacity
            key={`${dateTimestamp}-${index}`}
            style={styles.calendarDay}
            onPress={() => onDateSelect(date)}
          >
            <Text style={styles.calendarDayName}>{daysOfWeek[index]}</Text>
            <View
              style={[
                styles.calendarDate,
                isSelected && styles.calendarDateActive,
              ]}
            >
              <Text
                style={[
                  styles.calendarDateText,
                  isSelected && styles.calendarDateTextActive,
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для оптимизации
  // Сравниваем только timestamp даты, не сам объект Date
  return prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
         prevProps.onDateSelect === nextProps.onDateSelect;
});

const styles = StyleSheet.create({
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  calendarDay: {
    alignItems: "center",
    gap: 8,
  },
  calendarDayName: {
    fontSize: 14,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
  },
  calendarDate: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDateActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  calendarDateText: {
    fontSize: 16,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
  },
  calendarDateTextActive: {
    color: colors.primary,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
