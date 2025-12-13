import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/theme";
import { getTodayLocal } from "../../utils/timezone";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  achievedDates?: Record<string, boolean>;
  dailyProgress?: Record<string, number>;
}
const CIRCLE_SIZE = 36;
const STROKE_WIDTH = 2.5;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const WeekCalendar = memo(function WeekCalendar({ selectedDate, onDateSelect, achievedDates, dailyProgress }: WeekCalendarProps) {
  
  const today = useMemo(() => getTodayLocal(), []);

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

  return (
    <View style={styles.calendarContainer}>
      {weekDays.map((date, index) => {
        const dateTimestamp = date.getTime();
        const isSelected = dateTimestamp === selectedDateTimestamp;
        const isToday = dateTimestamp === today.getTime();
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const progress = dailyProgress?.[key] || 0;
        const isAchieved = Boolean(achievedDates?.[key] || progress >= 1);
        
        return (
          <DayCircle
            key={`${dateTimestamp}-${index}`}
            date={date}
            dayName={daysOfWeek[index]}
            isSelected={isSelected}
            isToday={isToday}
            isAchieved={isAchieved}
            progress={progress}
            onPress={() => onDateSelect(date)}
          />
        );
      })}
    </View>
  );
}, (prevProps, nextProps) => {

  return prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
         prevProps.onDateSelect === nextProps.onDateSelect &&
         prevProps.achievedDates === nextProps.achievedDates &&
         prevProps.dailyProgress === nextProps.dailyProgress;
});

interface DayCircleProps {
  date: Date;
  dayName: string;
  isSelected: boolean;
  isToday: boolean;
  isAchieved: boolean;
  progress: number;
  onPress: (date: Date) => void;
}

function DayCircle({ date, dayName, isSelected, isToday, isAchieved, progress, onPress }: DayCircleProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress]);

  const hasProgress = progress > 0 && progress < 1;
  const isFullyAchieved = progress >= 1;
  
  let bgStrokeColor = "#DAD4CA";
  let progressColor = "#FF6B6B";
  let strokeDasharray: number | string = "2 4";
  
  if (isSelected) {
    bgStrokeColor = colors.primary;
    strokeDasharray = CIRCUMFERENCE;
    if (progress >= 1) {
      progressColor = "#4CAF50";
    } else if (progress > 0) {
      progressColor = colors.primary;
    }
  } else if (isFullyAchieved) {
    bgStrokeColor = "#FF6B6B";
    strokeDasharray = CIRCUMFERENCE;
    progressColor = "#FF6B6B";
  } else if (hasProgress) {
    bgStrokeColor = "#DAD4CA";
    strokeDasharray = "2 4";
    progressColor = "#FF6B6B";
  } else {
    bgStrokeColor = "#DAD4CA";
    strokeDasharray = "2 4";
  }

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <TouchableOpacity
      style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
      onPress={() => onPress(date)}
      activeOpacity={0.7}
    >
      <Text style={[styles.calendarDayName, isSelected && styles.calendarDayNameActive]}>{dayName}</Text>
      <View style={styles.circleContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={bgStrokeColor}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={isFullyAchieved || isSelected ? undefined : strokeDasharray}
          />
          {(hasProgress || isFullyAchieved || (isSelected && progress > 0)) && (
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={progressColor}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          )}
        </Svg>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.calendarDateText,
              isSelected && styles.calendarDateTextActive,
            ]}
          >
            {date.getDate()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
    marginBottom: 10,
  },
  calendarDay: {
    alignItems: "center",
    gap: 6,
    width: 44,
    paddingVertical: 8,
    borderRadius: 18,
  },
  calendarDaySelected: {
    width: 56,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  calendarDayName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: colors.secondary,
  },
  calendarDayNameActive: {
    color: colors.primary,
    fontFamily: "Inter_800ExtraBold",
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  textContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDateText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.secondary,
  },
  calendarDateTextActive: {
    fontSize: 15,
    fontFamily: "Inter_800ExtraBold",
    color: colors.primary,
  },
});
