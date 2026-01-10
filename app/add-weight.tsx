import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";

export default function AddWeightScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWeightChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 3) return;
    setWeight(cleaned);
  };

  const validate = () => {
    if (!weight.trim()) return t('weight.enterWeight');
    const val = parseFloat(weight.replace(',', '.'));
    if (isNaN(val) || val <= 0) return t('weight.invalidValue');
    if (val < 30 || val > 300) return t('weight.rangeError');
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
      await apiService.addWeightLog(parseFloat(weight.replace(',', '.')));
      router.back();
    } catch (e: any) {
      setError(e?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const applyQuick = (val: number) => setWeight(String(val));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Вес</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            Взвешивайтесь регулярно для отслеживания прогресса. Лучшее время - утром натощак.
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Текущий вес, кг</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="70.5"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={handleWeightChange}
            autoFocus
          />

          <View style={styles.quickButtons}>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Быстрый ввод:</Text>
            <View style={styles.quickButtonsRow}>
              {[50, 60, 70, 80, 90, 100].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={() => applyQuick(val)}
                >
                  <Text style={[styles.quickButtonText, { color: colors.text }]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: isDark ? colors.backgroundSecondary : "#FFFFF0", 
                borderColor: colors.border, 
                borderWidth: 1 
              },
              saving && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={[styles.saveButtonText, { color: colors.text }]}>
              {saving ? t('weight.saving') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
  },
  instruction: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  quickButtons: {
    marginBottom: 24,
  },
  quickLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },
  quickButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  quickButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
