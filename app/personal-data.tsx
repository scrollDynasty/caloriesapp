import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";
import { dataCache } from "../stores/dataCache";
import { UserData, calculateCalories } from "../utils/calorieCalculator";

interface OnboardingFullData {
  weight: number | null;
  height: number | null;
  birthDate: Date | null;
  gender: "male" | "female" | null;
  goal: "lose" | "maintain" | "gain" | null;
  workoutFrequency: "0-2" | "3-5" | "6+" | null;
  targetWeight: number | null;
  stepGoal: number;
}

type EditField = "weight" | "height" | "birthDate" | "gender" | "stepGoal" | "targetWeight" | null;

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function PersonalDataScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingFullData>({
    weight: null,
    height: null,
    birthDate: null,
    gender: null,
    goal: null,
    workoutFrequency: null,
    targetWeight: null,
    stepGoal: 10000,
  });

  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const onboarding = await apiService.getOnboardingData();
      
      if (onboarding) {
        setData({
          weight: onboarding.weight || null,
          height: onboarding.height || null,
          birthDate: onboarding.birth_date ? new Date(onboarding.birth_date) : null,
          gender: onboarding.gender || null,
          goal: onboarding.goal || null,
          workoutFrequency: onboarding.workout_frequency || null,
          targetWeight: onboarding.target_weight || onboarding.weight || null,
          stepGoal: onboarding.step_goal || 10000,
        });
      }
    } catch {

    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (field: EditField, value: any) => {
    if (!field) return;

    try {
      setSaving(true);
      
      let updatedData = { ...data };
      
      switch (field) {
        case "weight":
          updatedData.weight = parseFloat(value);
          break;
        case "height":
          updatedData.height = parseFloat(value);
          break;
        case "birthDate":
          updatedData.birthDate = value;
          break;
        case "gender":
          updatedData.gender = value;
          break;
        case "stepGoal":
          updatedData.stepGoal = parseInt(value);
          break;
        case "targetWeight":
          updatedData.targetWeight = parseFloat(value);
          break;
      }

      const canRecalculate = 
        updatedData.gender && 
        updatedData.height && 
        updatedData.weight && 
        updatedData.birthDate &&
        updatedData.goal &&
        updatedData.workoutFrequency;

      let payload: any = {};

      if (canRecalculate) {
        const age = calculateAge(updatedData.birthDate!);

        const userData: UserData = {
          gender: updatedData.gender!,
          age,
          height: updatedData.height!,
          weight: updatedData.weight!,
          workoutFrequency: updatedData.workoutFrequency!,
          goal: updatedData.goal!,
        };

        const calculations = calculateCalories(userData);

        payload = {
          gender: updatedData.gender,
          workout_frequency: updatedData.workoutFrequency,
          height: updatedData.height,
          weight: updatedData.weight,
          birth_date: updatedData.birthDate?.toISOString().split("T")[0],
          goal: updatedData.goal,
          bmr: calculations.bmr,
          tdee: calculations.tdee,
          target_calories: calculations.targetCalories,
          protein_grams: calculations.macros.protein.grams,
          protein_calories: calculations.macros.protein.calories,
          protein_percentage: calculations.macros.protein.percentage,
          carbs_grams: calculations.macros.carbs.grams,
          carbs_calories: calculations.macros.carbs.calories,
          carbs_percentage: calculations.macros.carbs.percentage,
          fats_grams: calculations.macros.fats.grams,
          fats_calories: calculations.macros.fats.calories,
          fats_percentage: calculations.macros.fats.percentage,
        };
        payload.target_weight = updatedData.targetWeight;
        payload.step_goal = updatedData.stepGoal;
      } else {
        switch (field) {
          case "weight":
            payload.weight = updatedData.weight;
            break;
          case "height":
            payload.height = updatedData.height;
            break;
          case "birthDate":
            payload.birth_date = updatedData.birthDate?.toISOString().split("T")[0];
            break;
          case "gender":
            payload.gender = updatedData.gender;
            break;
          case "stepGoal":
            payload.step_goal = updatedData.stepGoal;
            break;
          case "targetWeight":
            payload.target_weight = updatedData.targetWeight;
            break;
        }
      }

      const result = await apiService.saveOnboardingData(payload);
      
      dataCache.invalidateOnboarding();
      dataCache.invalidateAll();
      
      setData(updatedData);
      setEditField(null);
      
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }, [data]);

  const openEditModal = (field: EditField) => {
    if (!field) return;
    
    switch (field) {
      case "weight":
        setEditValue(data.weight?.toString() || "");
        break;
      case "height":
        setEditValue(data.height?.toString() || "");
        break;
      case "birthDate":
        setTempDate(data.birthDate || new Date(2000, 0, 1));
        setShowDatePicker(true);
        return;
      case "gender":
        break;
      case "stepGoal":
        setEditValue(data.stepGoal.toString());
        break;
      case "targetWeight":
        setEditValue(data.targetWeight?.toString() || "");
        break;
    }
    setEditField(field);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Не указано";
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatGender = (gender: string | null) => {
    if (gender === "male") return "Мужской";
    if (gender === "female") return "Женский";
    return "Не указано";
  };

  const getFieldTitle = (field: EditField) => {
    switch (field) {
      case "weight": return "Текущий вес";
      case "height": return "Рост";
      case "stepGoal": return "Ежедневная цель по шагам";
      case "targetWeight": return "Целевой вес";
      default: return "";
    }
  };

  const getFieldUnit = (field: EditField) => {
    switch (field) {
      case "weight":
      case "targetWeight":
        return "кг";
      case "height":
        return "см";
      case "stepGoal":
        return "шагов";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {}
      <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Личные данные</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {}
        <View style={styles.targetCard}>
          <View>
            <Text style={styles.targetLabel}>Целевой вес</Text>
            <Text style={styles.targetValue}>{data.targetWeight || data.weight || "--"} кг</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.changeGoalButton,
              { backgroundColor: isDark ? colors.backgroundSecondary : "#FFFFF0" }
            ]}
            onPress={() => openEditModal("targetWeight")}
          >
            <Text style={[styles.changeGoalText, { color: colors.text }]}>Изменить цель</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.section}>
          {}
          <TouchableOpacity style={styles.row} onPress={() => openEditModal("weight")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Текущий вес</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{data.weight || "--"} кг</Text>
              <View style={styles.editIcon}>
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {}
          <TouchableOpacity style={styles.row} onPress={() => openEditModal("height")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Рост</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{data.height || "--"} cm</Text>
              <View style={styles.editIcon}>
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {}
          <TouchableOpacity style={styles.row} onPress={() => openEditModal("birthDate")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Дата рождения</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{formatDate(data.birthDate)}</Text>
              <View style={styles.editIcon}>
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {}
          <TouchableOpacity style={styles.row} onPress={() => setEditField("gender")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Пол</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{formatGender(data.gender)}</Text>
              <View style={styles.editIcon}>
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {}
          <TouchableOpacity style={styles.row} onPress={() => openEditModal("stepGoal")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Ежедневная цель по шагам</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{data.stepGoal.toLocaleString()} шагов</Text>
              <View style={styles.editIcon}>
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {}
      <Modal
        visible={editField !== null && editField !== "gender" && editField !== "birthDate"}
        transparent
        animationType="fade"
        onRequestClose={() => setEditField(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getFieldTitle(editField)}</Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    autoFocus
                    selectTextOnFocus
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.inputUnit}>{getFieldUnit(editField)}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButtonCancel} 
                    onPress={() => setEditField(null)}
                  >
                    <Text style={styles.modalButtonCancelText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalButtonSave}
                    onPress={() => handleSave(editField, editValue)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text style={styles.modalButtonSaveText}>Сохранить</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {}
      <Modal
        visible={editField === "gender"}
        transparent
        animationType="fade"
        onRequestClose={() => setEditField(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditField(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Выберите пол</Text>
                
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    data.gender === "male" && styles.genderOptionSelected,
                  ]}
                  onPress={() => handleSave("gender", "male")}
                >
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text style={[
                    styles.genderOptionText,
                    data.gender === "male" && styles.genderOptionTextSelected,
                  ]}>
                    Мужской
                  </Text>
                  {data.gender === "male" && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.success || "#4CAF50"} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    data.gender === "female" && styles.genderOptionSelected,
                  ]}
                  onPress={() => handleSave("gender", "female")}
                >
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text style={[
                    styles.genderOptionText,
                    data.gender === "female" && styles.genderOptionTextSelected,
                  ]}>
                    Женский
                  </Text>
                  {data.gender === "female" && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.success || "#4CAF50"} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalButtonCancelFull} 
                  onPress={() => setEditField(null)}
                >
                  <Text style={styles.modalButtonCancelText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.datePickerContainer}>
                  <Text style={styles.modalTitle}>Дата рождения</Text>
                  
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) setTempDate(date);
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(1920, 0, 1)}
                    locale="ru"
                    textColor={colors.primary}
                    style={styles.datePicker}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={styles.modalButtonCancel} 
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.modalButtonCancelText}>Отмена</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modalButtonSave}
                      onPress={() => {
                        setShowDatePicker(false);
                        handleSave("birthDate", tempDate);
                      }}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <Text style={styles.modalButtonSaveText}>Сохранить</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },

  targetCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  targetLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  targetValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: colors.text,
  },
  changeGoalButton: {
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  changeGoalText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.text,
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.text,
  },
  editIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
    paddingVertical: 14,
    textAlign: "center",
  },
  inputUnit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: colors.textSecondary,
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.textSecondary,
  },
  modalButtonCancelFull: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
  },
  modalButtonSaveText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 10,
    gap: 12,
  },
  genderOptionSelected: {
    backgroundColor: colors.successSurface || "#E8F5E9",
    borderWidth: 1.5,
    borderColor: colors.success || "#4CAF50",
  },
  genderEmoji: {
    fontSize: 24,
  },
  genderOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: colors.text,
  },
  genderOptionTextSelected: {
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },
  datePickerContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  datePicker: {
    height: 180,
    marginBottom: 16,
  },
});
