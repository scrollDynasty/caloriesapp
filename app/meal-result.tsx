import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";

const IVORY_COLOR = "#F5F0E8";

export default function MealResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fontsLoaded = useFonts();

  const photoId = Number(params.photoId || 0);
  const imageUrl = params.imageUrl as string;
  const mealName = (params.mealName as string) || "Блюдо";
  const calories = Number(params.calories || 0);
  const protein = Number(params.protein || 0);
  const fat = Number(params.fat || 0);
  const carbs = Number(params.carbs || 0);

  const [name, setName] = useState(mealName);
  const [caloriesInput, setCaloriesInput] = useState(calories.toString());
  const [proteinInput, setProteinInput] = useState(protein.toString());
  const [fatInput, setFatInput] = useState(fat.toString());
  const [carbsInput, setCarbsInput] = useState(carbs.toString());
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
              />
              <Text style={styles.mealMeta}>350 г • Обед</Text>
            </View>
            <View style={styles.caloriesBox}>
              <TextInput
                style={styles.caloriesValue}
                value={caloriesInput}
                onChangeText={setCaloriesInput}
                keyboardType="numeric"
              />
              <Text style={styles.caloriesLabel}>ККАЛ</Text>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroCard}>
              <Ionicons name="egg-outline" size={18} color="#A6A6A6" />
              <Text style={styles.macroLabel}>Белки</Text>
              <TextInput
                style={styles.macroValue}
                value={proteinInput}
                onChangeText={setProteinInput}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroCard}>
              <Ionicons name="water-outline" size={18} color="#A6A6A6" />
              <Text style={styles.macroLabel}>Жиры</Text>
              <TextInput
                style={styles.macroValue}
                value={fatInput}
                onChangeText={setFatInput}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroCard}>
              <Ionicons name="leaf-outline" size={18} color="#A6A6A6" />
              <Text style={styles.macroLabel}>Углев.</Text>
              <TextInput
                style={styles.macroValue}
                value={carbsInput}
                onChangeText={setCarbsInput}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Изменить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, saving && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.addText}>Добавить</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
    backgroundColor: IVORY_COLOR,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  mealName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#101010",
  },
  mealMeta: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#9E9E9E",
  },
  caloriesBox: {
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },
  caloriesValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#101010",
    textAlign: "center",
    minWidth: 60,
  },
  caloriesLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#9E9E9E",
    marginTop: 2,
  },
  macrosRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    gap: 6,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#8B8B8B",
  },
  macroValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#101010",
    minWidth: 40,
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#101010",
  },
  addButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#101010",
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
