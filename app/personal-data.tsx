import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import DatePicker from "react-native-date-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { LottieLoader } from "../components/ui/LottieLoader";
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

// Кросс-платформный компонент для выбора чисел
// iOS: красивый пикер, Android: простой TextInput
const NumericInput = React.memo(function NumericInput({
  value,
  onChangeValue,
  unit,
  min,
  max,
  step = 1,
  colors,
}: {
  value: string;
  onChangeValue: (value: string) => void;
  unit: string;
  min: number;
  max: number;
  step?: number;
  colors: any;
}) {
  const [inputValue, setInputValue] = useState(value);

  const handleChangeText = useCallback((text: string) => {
    const numValue = parseInt(text) || 0;
    if (numValue >= min && numValue <= max) {
      setInputValue(text);
      onChangeValue(text);
    } else if (text === "") {
      setInputValue("");
    }
  }, [min, max, onChangeValue]);

  const incrementValue = useCallback(() => {
    const current = parseInt(inputValue) || min;
    const newValue = Math.min(current + step, max);
    setInputValue(String(newValue));
    onChangeValue(String(newValue));
  }, [inputValue, min, max, step, onChangeValue]);

  const decrementValue = useCallback(() => {
    const current = parseInt(inputValue) || max;
    const newValue = Math.max(current - step, min);
    setInputValue(String(newValue));
    onChangeValue(String(newValue));
  }, [inputValue, min, max, step, onChangeValue]);

  return (
    <View style={{ gap: 16 }}>
      {Platform.OS === "android" ? (
        // Android: простой TextInput с кнопками
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 2,
          borderRadius: 12,
          borderColor: colors.primary,
          paddingHorizontal: 8,
          gap: 8,
          height: 56,
        }}>
          <TouchableOpacity 
            onPress={decrementValue}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Text style={{ fontSize: 24, color: colors.primary }}>−</Text>
          </TouchableOpacity>
          
          <TextInput
            value={inputValue}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            style={{
              flex: 1,
              fontSize: 20,
              fontFamily: "Inter_600SemiBold",
              borderWidth: 0,
              textAlign: "center",
              paddingHorizontal: 8,
              color: colors.text,
              backgroundColor: colors.backgroundSecondary,
            }}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            maxLength={3}
          />
          
          <TouchableOpacity 
            onPress={incrementValue}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Text style={{ fontSize: 24, color: colors.primary }}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // iOS: стрелочки по сторонам с красивым отображением
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderRadius: 12,
          height: 100,
          backgroundColor: colors.backgroundSecondary,
        }}>
          <TouchableOpacity 
            onPress={decrementValue}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              textAlign: "center",
              color: colors.text,
            }}>
              {inputValue}
            </Text>
            <Text style={{
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              letterSpacing: 0.5,
              color: colors.textSecondary,
            }}>
              {unit}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={incrementValue}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={{ paddingHorizontal: 4, paddingVertical: 8 }}>
        <Text style={{
          fontSize: 12,
          fontFamily: "Inter_400Regular",
          textAlign: "center",
          color: colors.textSecondary,
        }}>
          Диапазон: {min} - {max} {unit}
        </Text>
      </View>
    </View>
  );
});

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

  const pickerDataSource = useMemo(() => {
    if (editField === "weight" || editField === "targetWeight") {
      return Array.from({ length: 251 }, (_, i) => i + 20);
    } else if (editField === "height") {
      return Array.from({ length: 151 }, (_, i) => i + 100);
    } else if (editField === "stepGoal") {
      return Array.from({ length: 41 }, (_, i) => (i + 1) * 1000);
    }
    return [];
  }, [editField]);

  const pickerSelectedIndex = useMemo(() => {
    if (editField === "weight" || editField === "targetWeight") {
      return Math.max(0, (parseInt(editValue) || 70) - 20);
    } else if (editField === "height") {
      return Math.max(0, (parseInt(editValue) || 170) - 100);
    } else if (editField === "stepGoal") {
      return Math.max(0, Math.floor((parseInt(editValue) || 10000) / 1000) - 1);
    }
    return 0;
  }, [editField, editValue]);

  const handlePickerValueChange = useCallback((value: number) => {
    setEditValue(String(value));
  }, []);

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
        setEditField(null);
        setTempDate(data.birthDate || new Date(2000, 0, 1));
        setTimeout(() => setShowDatePicker(true), 100);
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
      case "stepGoal": return "Ежедневная цель";
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

  const getMinValue = (field: EditField) => {
    switch (field) {
      case "weight":
      case "targetWeight":
        return 20;
      case "height":
        return 100;
      case "stepGoal":
        return 1000;
      default:
        return 0;
    }
  };

  const getMaxValue = (field: EditField) => {
    switch (field) {
      case "weight":
      case "targetWeight":
        return 270;
      case "height":
        return 250;
      case "stepGoal":
        return 41000;
      default:
        return 100;
    }
  };

  const getStepValue = (field: EditField) => {
    switch (field) {
      case "stepGoal":
        return 1000;
      default:
        return 1;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LottieLoader size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Личные данные</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.targetCard}>
          <View>
            <Text style={styles.targetLabel}>Целевой вес</Text>
            <Text style={styles.targetValue}>{data.targetWeight || data.weight || "--"} кг</Text>
          </View>
          <TouchableOpacity 
            style={styles.changeGoalButton}
            onPress={() => openEditModal("targetWeight")}
          >
            <Text style={styles.changeGoalText}>Изменить цель</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
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

          <TouchableOpacity style={styles.row} onPress={() => openEditModal("stepGoal")} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Ежедневная цель</Text>
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

      <Modal
        visible={editField !== null && editField !== "gender" && editField !== "birthDate"}
        transparent
        animationType="fade"
        onRequestClose={() => setEditField(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditField(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getFieldTitle(editField)}</Text>
                
                <View style={styles.pickerContainer}>
                  <NumericInput
                    value={editValue}
                    onChangeValue={setEditValue}
                    unit={getFieldUnit(editField)}
                    min={getMinValue(editField)}
                    max={getMaxValue(editField)}
                    step={getStepValue(editField)}
                    colors={colors}
                  />
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
                      <LottieLoader size="small" />
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

      <DatePicker
        modal
        open={showDatePicker}
        date={tempDate}
        mode="date"
        maximumDate={new Date()}
        minimumDate={new Date(1920, 0, 1)}
        onConfirm={(date) => {
          setShowDatePicker(false);
          handleSave("birthDate", date);
        }}
        onCancel={() => {
          setShowDatePicker(false);
        }}
        title="Дата рождения"
        confirmText="Сохранить"
        cancelText="Отмена"
      />
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
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  targetLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: colors.textSecondary,
    marginBottom: 1,
  },
  targetValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.text,
  },
  changeGoalButton: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeGoalText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },
  section: {
    marginHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.text,
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.text,
  },
  editIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 12,
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
    borderRadius: 14,
    padding: 18,
    width: "100%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 14,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
    paddingVertical: 10,
    textAlign: "center",
  },
  inputUnit: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.textSecondary,
    marginLeft: 6,
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
  },
  modalButtonCancelText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.textSecondary,
  },
  modalButtonCancelFull: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
  },
  modalButtonSaveText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 8,
    gap: 10,
  },
  genderOptionSelected: {
    backgroundColor: colors.successSurface || "#E8F5E9",
    borderWidth: 1.5,
    borderColor: colors.success || "#4CAF50",
  },
  genderEmoji: {
    fontSize: 20,
  },
  genderOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.text,
  },
  genderOptionTextSelected: {
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },
  datePickerContainer: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    maxWidth: 300,
  },
  datePicker: {
    height: 180,
    marginBottom: 16,
  },
  androidInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 8,
    height: 56,
  },
  androidButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  androidInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 0,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  iosContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    height: 100,
  },
  iosValueDisplay: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  iosUnitDisplay: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  rangeInfo: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  rangeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },});