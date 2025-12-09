import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { colors } from "../constants/theme";
import { apiService } from "../services/api";

const QUICK_AMOUNTS = [200, 300, 500];

export default function AddWaterScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [goal, setGoal] = useState("2000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    const toNum = (v: string) => (v.trim() ? Number(v) : 0);
    const ml = toNum(amount);
    const g = toNum(goal);
    if (!ml) return "Введите объём воды";
    if (isNaN(ml) || ml <= 0) return "Объём должен быть > 0";
    if (isNaN(g) || g < 0) return "Цель должна быть 0 или больше";
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
      await apiService.addWater({
        amount_ml: Number(amount),
        goal_ml: goal.trim() ? Number(goal) : undefined,
        created_at: new Date().toISOString(),
      });
      Alert.alert("Сохранено", "Запись по воде добавлена.");
      router.push({ pathname: "/", params: { refresh: Date.now().toString() } } as any);
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const applyQuick = (val: number) => setAmount(String(val));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Вода</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>{saving ? "..." : "Сохранить"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.card}>
          <Text style={styles.label}>Объём, мл</Text>
          <TextInput
            style={styles.input}
            placeholder="Например, 250"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((v) => (
              <TouchableOpacity key={v} style={styles.chip} onPress={() => applyQuick(v)}>
                <Text style={styles.chipText}>{v} мл</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Дневная цель, мл</Text>
          <TextInput
            style={styles.input}
            placeholder="2000"
            keyboardType="numeric"
            value={goal}
            onChangeText={setGoal}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? "Сохраняем..." : "Сохранить"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    color: colors.primary,
  },
  saveText: {
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F7F7F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0F6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5E6FF",
  },
  chipText: {
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  errorText: {
    color: "#C62828",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});

