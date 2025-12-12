import { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";

interface WeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  achievedDates?: Record<string, boolean>;
}

export const WeekCalendar = memo(function WeekCalendar({ selectedDate, onDateSelect, achievedDates }: WeekCalendarProps) {
  
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedDateTimestamp = useMemo(() => {
    const normalized = new Date(selectedDate);
    normalized.setHours(0, 0, 0, 0);
    return normalized.getTime();
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    
    const mondayOffset = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, [selectedDateTimestamp]);

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
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const isAchieved = achievedDates?.[key];

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
                isAchieved && styles.calendarDateAchieved,
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

  return prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
         prevProps.onDateSelect === nextProps.onDateSelect &&
         prevProps.achievedDates === nextProps.achievedDates;
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
  calendarDateAchieved: {
    backgroundColor: "rgba(255,69,0,0.28)", 
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
