import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BMICard } from "../../components/progress/BMICard";
import { ProgressCard } from "../../components/progress/ProgressCard";
import { WeightChangeItem } from "../../components/progress/WeightChangeItem";
import { WeightChart } from "../../components/progress/WeightChart";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";

type TimePeriod = "90_days" | "6_months" | "1_year" | "all";

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  "90_days": "90 дн.",
  "6_months": "6 мес.",
  "1_year": "1 г.",
  "all": "ВСЁ",
};

type CaloriePeriod = "this_week" | "last_week" | "2_weeks_ago" | "3_weeks_ago";

const CALORIE_PERIOD_LABELS: Record<CaloriePeriod, string> = {
  "this_week": "Эта нед.",
  "last_week": "Прошлая нед.",
  "2_weeks_ago": "2 нед. назад",
  "3_weeks_ago": "3 нед. назад",
};

export default function ProgressScreen() {
  const { colors: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("90_days");
  const [selectedCaloriePeriod, setSelectedCaloriePeriod] = useState<CaloriePeriod>("this_week");
  
  // Progress data
  const [streakCount, setStreakCount] = useState(0);
  const [badgesCount, setBadgesCount] = useState(0);
  const [weightStats, setWeightStats] = useState<any>(null);
  const [calorieStats, setCalorieStats] = useState<any[]>([]);
  const [energyChanges, setEnergyChanges] = useState<any[]>([]);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string | null>(null);
  const [progressPhotos, setProgressPhotos] = useState<any[]>([]);

  const loadProgressData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [progressData, photos] = await Promise.all([
        apiService.getProgressData(),
        apiService.getProgressPhotos(),
      ]);

      setStreakCount(progressData.streak_count);
      setBadgesCount(progressData.badges_count);
      setWeightStats(progressData.weight_stats);
      setCalorieStats(progressData.calorie_stats);
      setEnergyChanges(progressData.energy_changes);
      setBmi(progressData.bmi);
      setBmiCategory(progressData.bmi_category);
      setProgressPhotos(photos);
    } catch (error: any) {
      console.error("Error loading progress data:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные прогресса");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProgressData();
  }, []);

  const handleRefresh = () => {
    loadProgressData(true);
  };

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ошибка", "Необходимо разрешение на доступ к галерее");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await apiService.uploadProgressPhoto(
          asset.uri,
          asset.fileName || `photo_${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        
        // Reload photos
        const photos = await apiService.getProgressPhotos();
        setProgressPhotos(photos);
        
        Alert.alert("Успешно", "Фото прогресса добавлено");
      }
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      Alert.alert("Ошибка", "Не удалось загрузить фото");
    }
  };

  const getFilteredWeightHistory = () => {
    if (!weightStats?.history) return [];
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedPeriod) {
      case "90_days":
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case "6_months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1_year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        return weightStats.history;
    }
    
    return weightStats.history.filter((item: any) => 
      new Date(item.created_at) >= cutoffDate
    );
  };

  const getSelectedCalorieStats = () => {
    return calorieStats.find(stat => stat.period === selectedCaloriePeriod);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const filteredWeightHistory = getFilteredWeightHistory();
  const selectedCalorieStat = getSelectedCalorieStats();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={themeColors.primary} />
        }
      >
        {/* Header */}
        <Text style={[styles.title, { color: themeColors.text }]}>Прогресс</Text>

        {/* Cards Row */}
        <View style={styles.cardsRow}>
          <ProgressCard
            icon="flame"
            value={streakCount}
            label="Дней подряд"
            subtitle="Серия активности"
            iconColor="#FF6B6B"
            gradientColors={["#FF6B6B15", "#FF6B6B05"]}
          />
          <ProgressCard
            icon="fitness"
            value={weightStats?.current_weight ? `${weightStats.current_weight} кг` : "--"}
            label="Текущий вес"
            subtitle={weightStats?.total_change ? `${weightStats.total_change > 0 ? '+' : ''}${weightStats.total_change.toFixed(1)} кг` : "Без изменений"}
            iconColor="#5271FF"
            gradientColors={["#5271FF15", "#5271FF05"]}
          />
        </View>

        {/* Weight Dynamics */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Динамика веса
            </Text>
            {weightStats?.current_weight && weightStats?.target_weight && (
              <Text style={[styles.goalText, { color: themeColors.textSecondary }]}>
                📍 {Math.round(((weightStats.current_weight - weightStats.target_weight) / (weightStats.start_weight - weightStats.target_weight)) * 100)}% от цели
              </Text>
            )}
          </View>

          {/* Time Period Selector */}
          <View style={styles.periodSelector}>
            {(Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && { backgroundColor: themeColors.primary + '20' },
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: selectedPeriod === period ? themeColors.primary : themeColors.textSecondary },
                  ]}
                >
                  {TIME_PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <WeightChart data={filteredWeightHistory} targetWeight={weightStats?.target_weight} />

          {/* Current Weight Progress */}
          {weightStats?.current_weight && weightStats?.target_weight && (
            <View style={styles.weightProgress}>
              <View style={styles.weightProgressHeader}>
                <Text style={[styles.weightProgressLabel, { color: themeColors.textSecondary }]}>
                  Текущий вес
                </Text>
                <Text style={[styles.weightProgressNext, { color: themeColors.textSecondary }]}>
                  Следующее взвешивание: 6дн
                </Text>
              </View>
              <Text style={[styles.currentWeight, { color: themeColors.text }]}>
                {weightStats.current_weight} кг
              </Text>
              
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: themeColors.primary,
                        width: `${Math.min(100, ((weightStats.start_weight - weightStats.current_weight) / (weightStats.start_weight - weightStats.target_weight)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>
                    Старт: {weightStats.start_weight} кг
                  </Text>
                  <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>
                    Цель: {weightStats.target_weight} кг
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Weight Changes */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Изменения веса
          </Text>
          {weightStats?.changes?.map((change: any, index: number) => (
            <View key={change.period}>
              <WeightChangeItem
                period={change.period}
                changeKg={change.change_kg}
                status={change.status}
              />
              {index < weightStats.changes.length - 1 && (
                <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* Progress Photos */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Фото прогресса
          </Text>
          <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
            Хочешь добавить фото, чтобы отслеживать прогресс?
          </Text>
          
          {progressPhotos.length > 0 ? (
            <View style={styles.photosGrid}>
              {progressPhotos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: apiService.getProgressPhotoUrl(photo.id) }}
                  style={styles.photoThumbnail}
                />
              ))}
            </View>
          ) : null}
          
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
            <Ionicons name="add" size={20} color={themeColors.primary} />
            <Text style={[styles.uploadButtonText, { color: themeColors.primary }]}>
              Загрузить фото
            </Text>
          </TouchableOpacity>
        </View>

        {/* Average Calories */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Среднее количество калорий в день
          </Text>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(Object.keys(CALORIE_PERIOD_LABELS) as CaloriePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedCaloriePeriod === period && { backgroundColor: themeColors.primary + '20' },
                ]}
                onPress={() => setSelectedCaloriePeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: selectedCaloriePeriod === period ? themeColors.primary : themeColors.textSecondary },
                  ]}
                >
                  {CALORIE_PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCalorieStat?.status === "insufficient_data" ? (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={48} color={themeColors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: themeColors.text }]}>
                Нет данных для отображения
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
                Это обновится по мере того, как ты будешь добавлять больше еды.
              </Text>
            </View>
          ) : (
            <View style={styles.calorieStatsContainer}>
              <Text style={[styles.calorieValue, { color: themeColors.text }]}>
                {selectedCalorieStat?.average_calories?.toFixed(0) || "0"} ккал
              </Text>
              <Text style={[styles.calorieLabel, { color: themeColors.textSecondary }]}>
                в среднем в день
              </Text>
            </View>
          )}
        </View>

        {/* Energy Per Week */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Энергия за неделю
          </Text>

          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={themeColors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: themeColors.text }]}>
              Нет данных для отображения
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
              Это обновится по мере того, как ты будешь добавлять больше еды.
            </Text>
          </View>
        </View>

        {/* Energy Changes */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Изменения расхода
          </Text>
          {energyChanges.map((change: any, index: number) => (
            <View key={change.period}>
              <View style={styles.energyChangeItem}>
                <Text style={[styles.periodLabel, { color: themeColors.textSecondary }]}>
                  {change.period === "3_days" ? "3 день" :
                   change.period === "7_days" ? "7 день" :
                   change.period === "14_days" ? "14 день" :
                   change.period === "30_days" ? "30 день" : "90 день"}
                </Text>
                <View style={styles.energyChangeValue}>
                  <Text style={[styles.energyChangeText, { color: themeColors.text }]}>
                    Недостаточно данных
                  </Text>
                  <Text style={[styles.energyStatus, { color: themeColors.textSecondary }]}>
                    Ожидает
                  </Text>
                </View>
              </View>
              {index < energyChanges.length - 1 && (
                <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* BMI Card */}
        <BMICard
          bmi={bmi}
          bmiCategory={bmiCategory}
          currentWeight={weightStats?.current_weight}
          targetWeight={weightStats?.target_weight}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  section: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
    lineHeight: 20,
  },
  goalText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  periodSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  periodButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
  },
  periodButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  weightProgress: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  weightProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  weightProgressLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  weightProgressNext: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  currentWeight: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
  },
  uploadButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  photoThumbnail: {
    width: 100,
    height: 120,
    borderRadius: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  calorieStatsContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  calorieValue: {
    fontSize: 52,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  energyChangeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
  },
  periodLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  energyChangeValue: {
    alignItems: "flex-end",
  },
  energyChangeText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  energyStatus: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});

