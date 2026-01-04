import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { hapticLight, hapticMedium } from "../utils/haptics";

interface ReminderSetting {
  enabled: boolean;
  time: Date;
}

interface RemindersData {
  breakfast: ReminderSetting;
  lunch: ReminderSetting;
  snack: ReminderSetting;
  dinner: ReminderSetting;
  endOfDay: ReminderSetting;
}

const REMINDERS_STORAGE_KEY = "@caloriesapp:tracking_reminders";

const defaultReminders: RemindersData = {
  breakfast: { enabled: true, time: new Date(2000, 0, 1, 8, 30) },
  lunch: { enabled: true, time: new Date(2000, 0, 1, 11, 30) },
  snack: { enabled: false, time: new Date(2000, 0, 1, 16, 0) },
  dinner: { enabled: true, time: new Date(2000, 0, 1, 18, 0) },
  endOfDay: { enabled: false, time: new Date(2000, 0, 1, 21, 0) },
};

type ReminderKey = keyof RemindersData;

const reminderLabels: Record<ReminderKey, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  snack: "Перекус",
  dinner: "Ужин",
  endOfDay: "Конец дня",
};

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const displayHours = hours.toString().padStart(2, "0");
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes}`;
}

function ReminderRow({
  label,
  time,
  enabled,
  onTimePress,
  onToggle,
  isLast = false,
  colors,
  isDark,
}: {
  label: string;
  time: Date;
  enabled: boolean;
  onTimePress: () => void;
  onToggle: (value: boolean) => void;
  isLast?: boolean;
  colors: any;
  isDark: boolean;
}) {
  return (
    <>
      <View style={styles.reminderRow}>
        <Text style={[styles.reminderLabel, { color: colors.text }]}>{label}</Text>
        <View style={styles.reminderRight}>
          <TouchableOpacity 
            style={[styles.timeButton, { backgroundColor: isDark ? colors.gray5 : "#F5F5F5" }]} 
            onPress={() => {
              hapticLight();
              onTimePress();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(time)}</Text>
          </TouchableOpacity>
          <Switch
            value={enabled}
            onValueChange={(value) => {
              hapticLight();
              onToggle(value);
            }}
            trackColor={{ false: colors.switchTrackOff, true: "#34C759" }}
            thumbColor="#FFFFF0"
            ios_backgroundColor={colors.switchTrackOff}
          />
        </View>
      </View>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.separator }]} />}
    </>
  );
}

export default function TrackingRemindersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [reminders, setReminders] = useState<RemindersData>(defaultReminders);
  const [editingReminder, setEditingReminder] = useState<ReminderKey | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const restored: RemindersData = {
          breakfast: { 
            enabled: parsed.breakfast.enabled, 
            time: new Date(parsed.breakfast.time) 
          },
          lunch: { 
            enabled: parsed.lunch.enabled, 
            time: new Date(parsed.lunch.time) 
          },
          snack: { 
            enabled: parsed.snack.enabled, 
            time: new Date(parsed.snack.time) 
          },
          dinner: { 
            enabled: parsed.dinner.enabled, 
            time: new Date(parsed.dinner.time) 
          },
          endOfDay: { 
            enabled: parsed.endOfDay.enabled, 
            time: new Date(parsed.endOfDay.time) 
          },
        };
        setReminders(restored);
      }
    } catch {

    }
  };

  const saveReminders = async (newReminders: RemindersData) => {
    try {
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(newReminders));
    } catch {

    }
  };

  const handleToggle = (key: ReminderKey, value: boolean) => {
    hapticLight();
    const newReminders = {
      ...reminders,
      [key]: { ...reminders[key], enabled: value },
    };
    setReminders(newReminders);
    saveReminders(newReminders);
  };

  const handleTimePress = (key: ReminderKey) => {
    hapticLight();
    setEditingReminder(key);
    setTempTime(reminders[key].time);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    
    if (selectedTime && editingReminder) {
      setTempTime(selectedTime);
      
      if (Platform.OS === "android") {
        const newReminders = {
          ...reminders,
          [editingReminder]: { ...reminders[editingReminder], time: selectedTime },
        };
        setReminders(newReminders);
        saveReminders(newReminders);
        setEditingReminder(null);
      }
    }
  };

  const handleTimeConfirm = () => {
    hapticMedium();
    if (editingReminder) {
      const newReminders = {
        ...reminders,
        [editingReminder]: { ...reminders[editingReminder], time: tempTime },
      };
      setReminders(newReminders);
      saveReminders(newReminders);
    }
    setShowTimePicker(false);
    setEditingReminder(null);
  };

  const handleTimeCancel = () => {
    hapticLight();
    setShowTimePicker(false);
    setEditingReminder(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {}
        <Text style={[styles.title, { color: colors.text }]}>
          Напоминания об{"\n"}отслеживании
        </Text>

        {}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <ReminderRow
            label={reminderLabels.breakfast}
            time={reminders.breakfast.time}
            enabled={reminders.breakfast.enabled}
            onTimePress={() => handleTimePress("breakfast")}
            onToggle={(value) => handleToggle("breakfast", value)}
            colors={colors}
            isDark={isDark}
          />
          <ReminderRow
            label={reminderLabels.lunch}
            time={reminders.lunch.time}
            enabled={reminders.lunch.enabled}
            onTimePress={() => handleTimePress("lunch")}
            onToggle={(value) => handleToggle("lunch", value)}
            colors={colors}
            isDark={isDark}
          />
          <ReminderRow
            label={reminderLabels.snack}
            time={reminders.snack.time}
            enabled={reminders.snack.enabled}
            onTimePress={() => handleTimePress("snack")}
            onToggle={(value) => handleToggle("snack", value)}
            colors={colors}
            isDark={isDark}
          />
          <ReminderRow
            label={reminderLabels.dinner}
            time={reminders.dinner.time}
            enabled={reminders.dinner.enabled}
            onTimePress={() => handleTimePress("dinner")}
            onToggle={(value) => handleToggle("dinner", value)}
            isLast
            colors={colors}
            isDark={isDark}
          />
        </View>

        {}
        <View style={[styles.section, styles.endOfDaySection, { backgroundColor: colors.card }]}>
          <ReminderRow
            label={reminderLabels.endOfDay}
            time={reminders.endOfDay.time}
            enabled={reminders.endOfDay.enabled}
            onTimePress={() => handleTimePress("endOfDay")}
            onToggle={(value) => handleToggle("endOfDay", value)}
            isLast
            colors={colors}
            isDark={isDark}
          />
          <Text style={[styles.endOfDayHint, { color: colors.textSecondary }]}>
            Получай одно ежедневное напоминание и записывай все приёмы пищи сразу.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {}
      {Platform.OS === "ios" && showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="none"
          onRequestClose={handleTimeCancel}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.modalOverlay}
          >
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.modalBackdrop}
            >
              <TouchableOpacity 
                style={StyleSheet.absoluteFill} 
                activeOpacity={1} 
                onPress={handleTimeCancel}
              />
            </Animated.View>
            <Animated.View
              entering={FadeInDown.springify().damping(18).stiffness(280).mass(0.7)}
              exiting={FadeOut.duration(200)}
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleTimeCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Отмена</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingReminder ? reminderLabels[editingReminder] : ""}
                </Text>
                <TouchableOpacity onPress={handleTimeConfirm} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={[styles.modalDone, { color: colors.primary }]}>Готово</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timePickerContainer}>
                <DatePicker
                  date={tempTime}
                  mode="time"
                  onDateChange={(date) => {
                    setTempTime(date);
                  }}
                  style={styles.timePicker}
                  locale="ru"
                />
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}

      {}
      {Platform.OS === "android" && showTimePicker && (
        <DatePicker
          modal
          open={showTimePicker}
          date={tempTime}
          mode="time"
          onConfirm={(date) => {
            setTempTime(date);
            setShowTimePicker(false);
            if (editingReminder) {
              const newReminders = {
                ...reminders,
                [editingReminder]: { ...reminders[editingReminder], time: date },
              };
              setReminders(newReminders);
              saveReminders(newReminders);
              setEditingReminder(null);
            }
          }}
          onCancel={() => {
            setShowTimePicker(false);
          }}
          title={editingReminder ? reminderLabels[editingReminder] : ""}
          confirmText="Готово"
          cancelText="Отмена"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 28,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  endOfDaySection: {
    marginTop: 16,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  reminderLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  reminderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  timeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  endOfDayHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    minWidth: 70,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    flex: 1,
  },
  modalDone: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    minWidth: 70,
    textAlign: "right",
  },
  timePickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  timePicker: {
    width: "100%",
    height: 216,
  },
});
