import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  achievedDates?: Record<string, boolean>;
  dailyProgress?: Record<string, number>;
}

const CIRCLE_SIZE = 44;
const STROKE_WIDTH = 3;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const WeekCalendar = memo(function WeekCalendar({ selectedDate, onDateSelect, achievedDates, dailyProgress }: WeekCalendarProps) {
  
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

  return (
    <View style={styles.calendarContainer}>
      {weekDays.map((date, index) => {
        const dateTimestamp = date.getTime();
        const isSelected = dateTimestamp === selectedDateTimestamp;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const isAchieved = achievedDates?.[key];
        const progress = dailyProgress?.[key] || 0;
        
        return (
          <DayCircle
            key={`${dateTimestamp}-${index}`}
            date={date}
            dayName={daysOfWeek[index]}
            isSelected={isSelected}
            isAchieved={isAchieved || false}
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
  isAchieved: boolean;
  progress: number;
  onPress: (date: Date) => void;
}

function DayCircle({ date, dayName, isSelected, isAchieved, progress, onPress }: DayCircleProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: isSelected ? progress : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [isSelected, progress]);

  let bgStrokeColor = "#E8E4DC";
  let progressColor = "#1A1A1A";
  let strokeDasharray: number | string = "4 4";
  
  if (isSelected) {
    strokeDasharray = CIRCUMFERENCE;
    bgStrokeColor = "#E8E4DC";
    if (progress >= 1) {
      progressColor = "#4CAF50";
    } else if (progress >= 0.8) {
      progressColor = "#FF8C42";
    }
  } else if (isAchieved) {
    strokeDasharray = "4 4";
    bgStrokeColor = "rgba(255,69,0,1)";
  }

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <TouchableOpacity
      style={styles.calendarDay}
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
            strokeDasharray={isSelected ? undefined : strokeDasharray}
          />
          {isSelected && progress > 0 && (
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 8,
  },
  calendarDay: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  calendarDayName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#8A8A8A",
  },
  calendarDayNameActive: {
    color: "#111111",
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
    color: "#8A8A8A",
  },
  calendarDateTextActive: {
    fontSize: 15,
    fontFamily: "Inter_800ExtraBold",
    color: "#111111",
  },
});
