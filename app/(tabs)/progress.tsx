import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BMICard } from "../../components/progress/BMICard";
import { WeightChangeItem } from "../../components/progress/WeightChangeItem";
import { WeightChart } from "../../components/progress/WeightChart";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { hapticLight, hapticMedium } from "../../utils/haptics";

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
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("90_days");
  const [selectedCaloriePeriod, setSelectedCaloriePeriod] = useState<CaloriePeriod>("this_week");
  
  const [streakCount, setStreakCount] = useState(0);
  const [weightStats, setWeightStats] = useState<any>(null);
  const [lastWeightDate, setLastWeightDate] = useState<Date | null>(null);
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
      setWeightStats(progressData.weight_stats);
      
      // Получаем дату последнего взвешивания из истории
      if (progressData.weight_stats?.history?.length > 0) {
        const sortedHistory = [...progressData.weight_stats.history].sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLastWeightDate(new Date(sortedHistory[0].created_at));
      }
      setCalorieStats(progressData.calorie_stats);
      setEnergyChanges(progressData.energy_changes);
      setBmi(progressData.bmi);
      setBmiCategory(progressData.bmi_category);
      setProgressPhotos(photos);
    } catch {
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
        
        const photos = await apiService.getProgressPhotos();
        setProgressPhotos(photos);
        
        Alert.alert("Успешно", "Фото прогресса добавлено");
      }
    } catch {
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
        {/* Title */}
        <Text style={[styles.title, { color: themeColors.text }]}>Прогресс</Text>

        {/* Current Weight Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.currentWeightHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Текущий вес
              </Text>
              <Text style={[styles.bigWeight, { color: themeColors.text }]}>
                {weightStats?.current_weight ? `${weightStats.current_weight} кг` : "-- кг"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.recordWeightButtonDark]}
              onPress={() => {
                hapticMedium();
                router.push("/add-weight" as any);
              }}
            >
              <Text style={styles.recordWeightButtonDarkText}>Записать вес</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          {weightStats?.current_weight && weightStats?.target_weight && weightStats?.start_weight && (
            <View style={styles.currentWeightProgress}>
              <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#2C2C2E' : '#E8E8E8' }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: '#000000',
                      width: `${(() => {
                        const start = weightStats.start_weight;
                        const current = weightStats.current_weight;
                        const target = weightStats.target_weight;
                        if (!start || !current || !target) return 0;
                        if (Math.abs(start - target) < 0.1) return 100;
                        if (start > target) {
                          if (current <= target) return 100;
                          return Math.min(100, Math.max(0, ((start - current) / (start - target)) * 100));
                        } else if (start < target) {
                          if (current >= target) return 100;
                          return Math.min(100, Math.max(0, ((current - start) / (target - start)) * 100));
                        }
                        return 0;
                      })()}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>
                  Старт: {weightStats.start_weight?.toFixed(1)} кг
                </Text>
                <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>
                  Цель: {weightStats.target_weight?.toFixed(1)} кг
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Weight Chart Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Динамика веса
            </Text>
            {weightStats?.current_weight && weightStats?.target_weight && weightStats?.start_weight && (
              <View style={styles.progressPercentageRow}>
                <Ionicons name="checkmark-circle" size={16} color={themeColors.text} />
                <Text style={[styles.progressPercentage, { color: themeColors.text }]}>
                  {(() => {
                    const start = weightStats.start_weight;
                    const current = weightStats.current_weight;
                    const target = weightStats.target_weight;
                    if (!start || !current || !target) return "0%";
                    if (Math.abs(start - target) < 0.1) return "100%";
                    let progress = 0;
                    if (start > target) {
                      if (current <= target) return "100%";
                      progress = ((start - current) / (start - target)) * 100;
                    } else if (start < target) {
                      if (current >= target) return "100%";
                      progress = ((current - start) / (target - start)) * 100;
                    }
                    return `${Math.round(Math.min(100, Math.max(0, progress)))}% от цели`;
                  })()}
                </Text>
              </View>
            )}
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
                  selectedPeriod === period && { backgroundColor: isDark ? '#3A3A3C' : '#E0E0E0' },
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.textSecondary },
                    selectedPeriod === period && { color: themeColors.text, fontFamily: 'Inter_600SemiBold' },
                  ]}
                >
                  {TIME_PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weight Chart */}
          <WeightChart data={filteredWeightHistory} targetWeight={weightStats?.target_weight} />
        </View>

        {/* Weight Changes Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Изменения веса
          </Text>
          {weightStats?.changes && weightStats.changes.length > 0 ? (
            weightStats.changes.map((change: any, index: number) => (
              <View key={change.period}>
                <WeightChangeItem
                  period={change.period}
                  changeKg={change.change_kg}
                  status={change.status}
                />
                {index < weightStats.changes.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0' }]} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyStateSmall}>
              <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
                Добавьте несколько записей веса для отслеживания изменений
              </Text>
            </View>
          )}
        </View>

        {/* Progress Photos Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
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
          
          <TouchableOpacity 
            style={[
              styles.uploadButton, 
              { 
                backgroundColor: 'transparent',
                borderColor: isDark ? '#3A3A3C' : '#E0E0E0'
              }
            ]} 
            onPress={handleUploadPhoto}
          >
            <Ionicons name="add" size={18} color={themeColors.text} />
            <Text style={[styles.uploadButtonText, { color: themeColors.text }]}>
              Загрузить фото
            </Text>
          </TouchableOpacity>
        </View>

        {/* Average Calories Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Среднее количество калорий в день
          </Text>

          {/* Calorie Period Selector */}
          <View style={styles.periodSelector}>
            {(Object.keys(CALORIE_PERIOD_LABELS) as CaloriePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
                  selectedCaloriePeriod === period && { backgroundColor: isDark ? '#3A3A3C' : '#E0E0E0' },
                ]}
                onPress={() => {
                  hapticLight();
                  setSelectedCaloriePeriod(period);
                }}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.textSecondary },
                    selectedCaloriePeriod === period && { color: themeColors.text, fontFamily: 'Inter_600SemiBold' },
                  ]}
                >
                  {CALORIE_PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCalorieStat?.status === "insufficient_data" ? (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={40} color={themeColors.textSecondary} />
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

        {/* Energy per Week Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Энергия за неделю
          </Text>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(Object.keys(CALORIE_PERIOD_LABELS) as CaloriePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
                  selectedCaloriePeriod === period && { backgroundColor: isDark ? '#3A3A3C' : '#E0E0E0' },
                ]}
                onPress={() => {
                  hapticLight();
                  setSelectedCaloriePeriod(period);
                }}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.textSecondary },
                    selectedCaloriePeriod === period && { color: themeColors.text, fontFamily: 'Inter_600SemiBold' },
                  ]}
                >
                  {CALORIE_PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(() => {
            const currentStats = calorieStats.find((s: any) => s.period === selectedCaloriePeriod);
            if (!currentStats || currentStats.status === "insufficient_data") {
              return (
                <View style={styles.emptyState}>
                  <Ionicons name="bar-chart-outline" size={40} color={themeColors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: themeColors.text }]}>
                    Нет данных для отображения
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
                    Добавляйте приемы пищи для отслеживания энергии
                  </Text>
                </View>
              );
            }

            const avgCalories = currentStats.average_calories || 0;
            const targetCalories = weightStats?.target_calories;
            
            if (!targetCalories) {
              return (
                <View style={styles.calorieStatsContainer}>
                  <View style={styles.calorieMainStat}>
                    <Text style={[styles.calorieValue, { color: themeColors.text }]}>
                      {Math.round(avgCalories)}
                    </Text>
                    <Text style={[styles.calorieUnit, { color: themeColors.textSecondary }]}>
                      ккал/день
                    </Text>
                  </View>
                  <Text style={[styles.calorieLabel, { color: themeColors.textSecondary, textAlign: 'center' }]}>
                    Установите целевые калории в настройках для отслеживания прогресса
                  </Text>
                </View>
              );
            }
            
            const percentage = Math.round((avgCalories / targetCalories) * 100);
            const isOverTarget = avgCalories > targetCalories;

            return (
              <View style={styles.calorieStatsContainer}>
                <View style={styles.calorieMainStat}>
                  <Text style={[styles.calorieValue, { color: themeColors.text }]}>
                    {Math.round(avgCalories)}
                  </Text>
                  <Text style={[styles.calorieUnit, { color: themeColors.textSecondary }]}>
                    ккал/день
                  </Text>
                </View>

                <View style={styles.calorieProgressContainer}>
                  <View style={styles.calorieProgressLabels}>
                    <Text style={[styles.calorieProgressLabel, { color: themeColors.textSecondary }]}>
                      Среднее потребление
                    </Text>
                    <Text style={[styles.calorieProgressValue, { color: isOverTarget ? '#FF6B6B' : '#51CF66' }]}>
                      {percentage}% от цели
                    </Text>
                  </View>
                  <View style={[styles.calorieProgressBar, { backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}>
                    <View 
                      style={[
                        styles.calorieProgressFill, 
                        { 
                          backgroundColor: isOverTarget ? '#FF6B6B' : '#51CF66',
                          width: `${Math.min(percentage, 100)}%` 
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.calorieTargetRow}>
                    <Text style={[styles.calorieTargetLabel, { color: themeColors.textSecondary }]}>
                      Цель: {targetCalories} ккал
                    </Text>
                    {isOverTarget && (
                      <Text style={[styles.calorieOverTarget, { color: '#FF6B6B' }]}>
                        +{Math.round(avgCalories - targetCalories)} ккал
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Energy Changes Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Изменения расхода
          </Text>
          {energyChanges.length === 0 ? (
            <View style={styles.emptyStateSmall}>
              <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
                Недостаточно данных
              </Text>
            </View>
          ) : (
            energyChanges.map((change: any, index: number) => {
              const periodLabels: Record<string, string> = {
                "3_days": "3 дня",
                "7_days": "7 дней", 
                "14_days": "14 дней",
                "30_days": "30 дней",
                "90_days": "90 дней"
              };

              const hasData = change.status === "ok" && change.change_calories !== null;
              const isPositive = hasData && change.change_calories > 0;
              const changeText = hasData 
                ? `${isPositive ? '+' : ''}${Math.round(change.change_calories)} ккал`
                : change.status === "waiting" ? "Ожидание..." : "Нет данных";
              
              const statusColor = !hasData 
                ? themeColors.textSecondary 
                : isPositive ? '#FF6B6B' : '#51CF66';

              return (
                <View key={change.period}>
                  <View style={styles.energyChangeItem}>
                    <Text style={[styles.periodLabel, { color: themeColors.textSecondary }]}>
                      {periodLabels[change.period] || change.period}
                    </Text>
                    <View style={styles.energyChangeValue}>
                      <Text style={[styles.energyChangeText, { color: statusColor }]}>
                        {changeText}
                      </Text>
                      {hasData && (
                        <Ionicons 
                          name={isPositive ? "trending-up" : "trending-down"} 
                          size={14} 
                          color={statusColor} 
                        />
                      )}
                    </View>
                  </View>
                  {index < energyChanges.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0' }]} />
                  )}
                </View>
              );
            })
          )}
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
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  compactCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  section: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    lineHeight: 16,
  },
  bigWeight: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  weightChange: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 12,
  },
  currentWeightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentWeightProgress: {
    marginTop: 12,
  },
  recordWeightButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#000000',
  },
  recordWeightButtonDarkText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  recordWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  recordWeightButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPercentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressPercentage: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  periodSelector: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  periodButtonText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  weightProgress: {
    marginTop: 12,
    paddingTop: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  photoThumbnail: {
    width: 75,
    height: 90,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyStateSmall: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 10,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 260,
  },
  calorieStatsContainer: {
    paddingTop: 8,
  },
  calorieMainStat: {
    alignItems: "center",
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
  },
  calorieUnit: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  calorieLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  calorieProgressContainer: {
    width: "100%",
  },
  calorieProgressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  calorieProgressLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  calorieProgressValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  calorieProgressBar: {
    height: 5,
    borderRadius: 2.5,
    overflow: "hidden",
  },
  calorieProgressFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  calorieTargetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  calorieTargetLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  calorieOverTarget: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  energyChangeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  periodLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  energyChangeValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  energyChangeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

