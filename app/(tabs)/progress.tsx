import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BMICard } from "../../components/progress/BMICard";
import { ProgressCard } from "../../components/progress/ProgressCard";
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
        {}
        <Text style={[styles.title, { color: themeColors.text }]}>Прогресс</Text>

        {}
        <View style={styles.cardsRow}>
          <ProgressCard
            icon="flame-outline"
            value={streakCount}
            label="Дней подряд"
            subtitle="Серия активности"
            iconColor="#FF6B6B"
            gradientColors={["#FF6B6B15", "#FF6B6B05"]}
          />
          <ProgressCard
            icon="body-outline"
            value={weightStats?.current_weight ? `${weightStats.current_weight} кг` : "--"}
            label="Текущий вес"
            subtitle={weightStats?.total_change ? `${weightStats.total_change > 0 ? '+' : ''}${weightStats.total_change.toFixed(1)} кг` : "Без изменений"}
            iconColor="#5271FF"
            gradientColors={["#5271FF15", "#5271FF05"]}
          />
        </View>

        {}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Динамика веса
            </Text>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: isDark ? themeColors.white : themeColors.primary },
              ]}
              onPress={() => {
                hapticMedium();
                router.push("/add-weight" as any);
              }}
            >
              <Ionicons
                name="add"
                size={18}
                color={isDark ? themeColors.black : themeColors.white}
              />
            </TouchableOpacity>
          </View>

          {weightStats?.current_weight && weightStats?.target_weight && weightStats?.start_weight ? (
            <Text style={[styles.goalText, { color: themeColors.textSecondary, marginBottom: 12 }]}>
              {(() => {
                const start = weightStats.start_weight;
                const current = weightStats.current_weight;
                const target = weightStats.target_weight;
                
                // Если старт и цель одинаковые
                if (Math.abs(start - target) < 0.1) {
                  return "🎯 Цель достигнута";
                }
                
                let progress = 0;
                
                // Если цель - похудеть (start > target)
                if (start > target) {
                  if (current <= target) {
                    return "🎯 Цель достигнута!";
                  }
                  progress = ((start - current) / (start - target)) * 100;
                } 
                // Если цель - набрать вес (start < target)
                else if (start < target) {
                  if (current >= target) {
                    return "🎯 Цель достигнута!";
                  }
                  progress = ((current - start) / (target - start)) * 100;
                }
                
                if (!isFinite(progress) || progress < 0) {
                  return "📍 Установите целевой вес";
                }
                
                return `📍 ${Math.round(Math.min(100, Math.max(0, progress)))}% от цели`;
              })()}
            </Text>
          ) : (
            <Text style={[styles.goalText, { color: themeColors.textSecondary, marginBottom: 12 }]}>
              📍 Добавьте вес и установите цель для отслеживания прогресса
            </Text>
          )}

          {}
          <View style={styles.periodSelector}>
            {(Object.keys(TIME_PERIOD_LABELS) as TimePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  { backgroundColor: themeColors.fillTertiary },
                  selectedPeriod === period && { backgroundColor: themeColors.primary },
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.text },
                    selectedPeriod === period && { color: themeColors.buttonPrimaryText },
                  ]}
                >
                  {TIME_PERIOD_LABELS[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <WeightChart data={filteredWeightHistory} targetWeight={weightStats?.target_weight} />

          {}
          {weightStats?.current_weight && weightStats?.target_weight && weightStats?.start_weight && (
            <View style={styles.weightProgress}>
              <View style={styles.weightProgressHeader}>
                <Text style={[styles.weightProgressLabel, { color: themeColors.textSecondary }]}>
                  Текущий вес
                </Text>
                {lastWeightDate && (
                  <Text style={[styles.weightProgressNext, { color: themeColors.textSecondary }]}>
                    {(() => {
                      const now = new Date();
                      const daysSinceLastWeight = Math.floor(
                        (now.getTime() - lastWeightDate.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      // Рекомендуем взвешиваться раз в неделю
                      const daysUntilNext = Math.max(0, 7 - daysSinceLastWeight);
                      if (daysUntilNext === 0) {
                        return "Пора взвеситься!";
                      }
                      return `Взвешивание через ${daysUntilNext} дн.`;
                    })()}
                  </Text>
                )}
              </View>
              <Text style={[styles.currentWeight, { color: themeColors.text }]}>
                {weightStats.current_weight} кг
              </Text>
              
              {}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: themeColors.primary,
                        width: `${(() => {
                          const start = weightStats.start_weight;
                          const current = weightStats.current_weight;
                          const target = weightStats.target_weight;
                          
                          // Проверка на валидность данных
                          if (!start || !current || !target) return 0;
                          
                          // Если старт и цель одинаковые, прогресс 100%
                          if (Math.abs(start - target) < 0.1) return 100;
                          
                          // Вычисляем прогресс
                          const totalDistance = Math.abs(start - target);
                          const traveledDistance = Math.abs(start - current);
                          
                          // Если цель - похудеть (start > target)
                          if (start > target) {
                            // Если уже достигли или перешли цель
                            if (current <= target) return 100;
                            // Иначе считаем прогресс
                            const progress = ((start - current) / (start - target)) * 100;
                            return Math.min(100, Math.max(0, progress));
                          } 
                          // Если цель - набрать вес (start < target)
                          else if (start < target) {
                            // Если уже достигли или перешли цель
                            if (current >= target) return 100;
                            // Иначе считаем прогресс
                            const progress = ((current - start) / (target - start)) * 100;
                            return Math.min(100, Math.max(0, progress));
                          }
                          
                          return 0;
                        })()}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>
                    Старт: {weightStats.start_weight?.toFixed(1) || "--"} кг
                  </Text>
                  <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>
                    Цель: {weightStats.target_weight?.toFixed(1) || "--"} кг
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
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
                  <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
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

        {}
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
          
          <TouchableOpacity 
            style={[
              styles.uploadButton, 
              { 
                backgroundColor: themeColors.card,
                borderColor: themeColors.border 
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

        {}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Среднее количество калорий в день
          </Text>

          {}
          <View style={styles.periodSelector}>
            {(Object.keys(CALORIE_PERIOD_LABELS) as CaloriePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  { backgroundColor: themeColors.fillTertiary },
                  selectedCaloriePeriod === period && { backgroundColor: themeColors.primary },
                ]}
                onPress={() => {
                  hapticLight();
                  setSelectedCaloriePeriod(period);
                }}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.text },
                    selectedCaloriePeriod === period && { color: themeColors.buttonPrimaryText },
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

        {}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Энергия за неделю
          </Text>

          {}
          <View style={styles.periodSelector}>
            {(Object.keys(CALORIE_PERIOD_LABELS) as CaloriePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  { backgroundColor: themeColors.fillTertiary },
                  selectedCaloriePeriod === period && { backgroundColor: themeColors.primary },
                ]}
                onPress={() => {
                  hapticLight();
                  setSelectedCaloriePeriod(period);
                }}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.text },
                    selectedCaloriePeriod === period && { color: themeColors.buttonPrimaryText },
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
                  <Ionicons name="bar-chart-outline" size={48} color={themeColors.textSecondary} />
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
            
            // Если нет цели калорий, показываем только среднее
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
                    <Text style={[styles.calorieProgressValue, { color: isOverTarget ? themeColors.error : themeColors.success }]}>
                      {percentage}% от цели
                    </Text>
                  </View>
                  <View style={[styles.calorieProgressBar, { backgroundColor: themeColors.border }]}>
                    <View 
                      style={[
                        styles.calorieProgressFill, 
                        { 
                          backgroundColor: isOverTarget ? themeColors.error : themeColors.success,
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
                      <Text style={[styles.calorieOverTarget, { color: themeColors.error }]}>
                        +{Math.round(avgCalories - targetCalories)} ккал
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })()}
        </View>

        {}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
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
                : isPositive ? themeColors.error : themeColors.success;

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
                    <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                  )}
                </View>
              );
            })
          )}
        </View>

        {}
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
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    lineHeight: 18,
  },
  goalText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  periodButtonText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  weightProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  weightProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  weightProgressLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  weightProgressNext: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  currentWeight: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  progressBarContainer: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 11,
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
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  photoThumbnail: {
    width: 85,
    height: 100,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyStateSmall: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  calorieStatsContainer: {
    paddingTop: 12,
  },
  calorieMainStat: {
    alignItems: "center",
    marginBottom: 20,
  },
  calorieValue: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  calorieUnit: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 3,
  },
  calorieLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  calorieProgressContainer: {
    width: "100%",
  },
  calorieProgressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calorieProgressLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  calorieProgressValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  calorieProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  calorieProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  calorieTargetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  calorieTargetLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  calorieOverTarget: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  energyChangeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  periodLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  energyChangeValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  energyChangeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  energyStatus: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});

