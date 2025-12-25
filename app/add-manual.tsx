import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";

export default function AddManualScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!name.trim()) {
      return "Введите название блюда";
    }
    const toNum = (v: string) => (v.trim() ? Number(v) : 0);
    const values = [calories, protein, fat, carbs].map(toNum);
    if (values.some((v) => isNaN(v))) return "Проверьте числовые поля";
    if (values.some((v) => v < 0)) return "Значения не могут быть отрицательными";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiService.createManualMeal({
        meal_name: name.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        carbs: Number(carbs) || 0,
      });
      Alert.alert("Сохранено", "Блюдо добавлено.");
      router.push({ pathname: "/", params: { refresh: Date.now().toString() } } as any);
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Добавить вручную</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{saving ? "..." : "Сохранить"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.card}>
          <Text style={styles.label}>Название блюда</Text>
          <TextInput
            style={styles.input}
            placeholder="Омлет с овощами"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="sentences"
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Калории, ккал</Text>
              <TextInput
                style={styles.input}
                placeholder="ккал"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Белки, г</Text>
              <TextInput
                style={styles.input}
                placeholder="г"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Жиры, г</Text>
              <TextInput
                style={styles.input}
                placeholder="г"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Углеводы, г</Text>
              <TextInput
                style={styles.input}
                placeholder="г"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? "Сохраняем..." : "Сохранить"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerButton: {
      minWidth: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    saveText: {
      color: colors.text,
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: isDark ? 0 : 2,
      marginTop: 12,
    },
    label: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    col: {
      flex: 1,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      marginTop: 4,
    },
    saveButton: {
      backgroundColor: isDark ? colors.backgroundSecondary : colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.primary,
    },
    saveButtonText: {
      color: isDark ? colors.text : colors.buttonPrimaryText,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });

