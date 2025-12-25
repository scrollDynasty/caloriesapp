import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";

export default function MealResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fontsLoaded = useFonts();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const photoId = Number(params.photoId || 0);
  const imageUrl = params.imageUrl as string;
  const mealName = (params.mealName as string) || "Блюдо";
  const calories = Number(params.calories || 0);
  const protein = Number(params.protein || 0);
  const fat = Number(params.fat || 0);
  const carbs = Number(params.carbs || 0);
  const fiber = Number(params.fiber || 0);
  const sugar = Number(params.sugar || 0);
  const sodium = Number(params.sodium || 0);
  const healthScore = params.healthScore ? Number(params.healthScore) : null;

  const [name, setName] = useState(mealName);
  const [caloriesInput, setCaloriesInput] = useState(calories.toString());
  const [proteinInput, setProteinInput] = useState(protein.toString());
  const [fatInput, setFatInput] = useState(fat.toString());
  const [carbsInput, setCarbsInput] = useState(carbs.toString());
  const healthScoreValue = Number.isFinite(healthScore || NaN) ? healthScore : null;
  const [saving, setSaving] = useState(false);

  if (!fontsLoaded) return null;

  const handleClose = async () => {
    try {
      if (photoId) {
        await apiService.deleteMealPhoto(photoId);
      }
    } catch (error: any) {
      if (__DEV__) console.warn("Error deleting photo:", error);
    } finally {
      router.replace("/scan-meal" as any);
    }
  };

  const handleAdd = async () => {
    try {
      setSaving(true);
      await apiService.updateMealPhoto(photoId, {
        meal_name: name,
        calories: Number(caloriesInput) || 0,
        protein: Number(proteinInput) || 0,
        fat: Number(fatInput) || 0,
        carbs: Number(carbsInput) || 0,
      });
      router.replace({
        pathname: "/(tabs)",
        params: { refresh: Date.now().toString() },
      } as any);
    } catch (error: any) {
      if (__DEV__) console.error("Error saving meal:", error);
      Alert.alert("Ошибка", error?.response?.data?.detail || "Не удалось сохранить блюдо");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
        <SafeAreaView style={styles.header} edges={["top"]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </SafeAreaView>
      </View>

      <View style={styles.card}>
        <View style={styles.dragHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <View style={styles.titleSection}>
              <TextInput
                style={styles.mealName}
                value={name}
                onChangeText={setName}
                placeholder="Название блюда"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.mealMeta}>350 г • Обед</Text>
            </View>
            <View style={styles.caloriesBox}>
              <TextInput
                style={styles.caloriesValue}
                value={caloriesInput}
                onChangeText={setCaloriesInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.caloriesLabel}>ККАЛ</Text>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroCard}>
              <Ionicons name="egg-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.macroLabel}>Белки</Text>
              <TextInput
                style={styles.macroValue}
                value={proteinInput}
                onChangeText={setProteinInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.macroCard}>
              <Ionicons name="water-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.macroLabel}>Жиры</Text>
              <TextInput
                style={styles.macroValue}
                value={fatInput}
                onChangeText={setFatInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.macroCard}>
              <Ionicons name="leaf-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.macroLabel}>Углев.</Text>
              <TextInput
                style={styles.macroValue}
                value={carbsInput}
                onChangeText={setCarbsInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.extraSection}>
            <View style={styles.extraHeader}>
              <Text style={styles.extraTitle}>Доп. нутриенты</Text>
              <View style={styles.healthChip}>
                <Ionicons name="pulse-outline" size={16} color={colors.text} />
                <Text style={styles.healthChipText}>{healthScoreValue != null ? healthScoreValue : "Н/Д"}</Text>
              </View>
            </View>
            <View style={styles.extraRow}>
              <View style={styles.extraPill}>
                <Text style={styles.extraLabel}>Клетчатка</Text>
                <Text style={styles.extraValue}>{Number.isFinite(fiber) ? fiber : "—"}</Text>
              </View>
              <View style={styles.extraPill}>
                <Text style={styles.extraLabel}>Сахар</Text>
                <Text style={styles.extraValue}>{Number.isFinite(sugar) ? sugar : "—"}</Text>
              </View>
              <View style={styles.extraPill}>
                <Text style={styles.extraLabel}>Натрий</Text>
                <Text style={styles.extraValue}>{Number.isFinite(sodium) ? sodium : "—"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.85}>
              <Text style={styles.cancelText}>Исправить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, saving && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.addText}>Готово</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    imageContainer: {
      flex: 1,
      position: "relative",
    },
    image: {
      flex: 1,
      width: "100%",
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerSpacer: {
      width: 44,
    },
    card: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: 32,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
    },
    titleSection: {
      flex: 1,
      marginRight: 12,
    },
    mealName: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    mealMeta: {
      marginTop: 6,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    caloriesBox: {
      minWidth: 88,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    caloriesValue: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      textAlign: "center",
      minWidth: 60,
    },
    caloriesLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
      marginTop: 2,
    },
    macrosRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 18,
    },
    macroCard: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    macroLabel: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    macroValue: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      minWidth: 40,
      textAlign: "center",
    },
    extraSection: {
      gap: 10,
      marginBottom: 20,
    },
    extraHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    extraTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    healthChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    healthChipText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    extraRow: {
      flexDirection: "row",
      gap: 10,
    },
    extraPill: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    extraLabel: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    extraValue: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    buttonsRow: {
      flexDirection: "row",
      gap: 14,
      marginTop: 10,
    },
    cancelButton: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSecondary,
      minHeight: 54,
    },
    cancelText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    addButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      backgroundColor: isDark ? "#2D2D2D" : colors.primary,
      minHeight: 54,
    },
    addButtonDisabled: {
      opacity: 0.7,
    },
    addText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
    },
  });
