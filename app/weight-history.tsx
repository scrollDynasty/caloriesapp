import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WeightChart } from "../components/progress/WeightChart";
import { LottieLoader } from "../components/ui/LottieLoader";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";

interface WeightEntry {
  id: number;
  weight: number;
  created_at: string;
}

interface WeightStats {
  current_weight: number | null;
  target_weight: number | null;
  start_weight: number | null;
  total_change: number | null;
  changes: Array<{
    period: string;
    change_kg: number | null;
    status: string;
  }>;
  history: WeightEntry[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    "янв", "фев", "мар", "апр", "мая", "июн",
    "июл", "авг", "сен", "окт", "ноя", "дек"
  ];
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

function WeightEntryItem({ 
  item, 
  previousWeight, 
  colors,
  isDark,
}: { 
  item: WeightEntry; 
  previousWeight: number | null; 
  colors: any;
  isDark: boolean;
}) {
  const change = previousWeight ? item.weight - previousWeight : null;
  
  return (
    <View style={[styles.entryItem, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
      <View style={styles.entryLeft}>
        <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
        <Text style={[styles.entryWeight, { color: colors.text }]}>
          {item.weight.toFixed(1)} кг
        </Text>
      </View>
      {change !== null && (
        <View style={[
          styles.changeTag,
          { backgroundColor: change > 0 ? "#FFEBEE" : change < 0 ? "#E8F5E9" : colors.backgroundSecondary }
        ]}>
          <Ionicons 
            name={change > 0 ? "arrow-up" : change < 0 ? "arrow-down" : "remove"} 
            size={14} 
            color={change > 0 ? "#EF5350" : change < 0 ? "#4CAF50" : colors.textSecondary} 
          />
          <Text style={[
            styles.changeText,
            { color: change > 0 ? "#EF5350" : change < 0 ? "#4CAF50" : colors.textSecondary }
          ]}>
            {Math.abs(change).toFixed(1)} кг
          </Text>
        </View>
      )}
    </View>
  );
}

function WeightHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<WeightStats | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await apiService.getWeightStats();
      setStats(data);
    } catch {

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const sortedHistory = useMemo(() => {
    if (!stats?.history) return [];
    return [...stats.history].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [stats?.history]);

  const keyExtractor = useCallback((item: WeightEntry) => item.id.toString(), []);

  const renderWeightItem = useCallback(
    ({ item }: { item: WeightEntry }) => {
      const currentIndex = sortedHistory.findIndex(h => h.id === item.id);
      const previousWeight = currentIndex > 0 ? sortedHistory[currentIndex - 1].weight : null;
      
      return (
        <WeightEntryItem 
          item={item} 
          previousWeight={previousWeight}
          colors={colors}
          isDark={isDark}
        />
      );
    },
    [sortedHistory, colors, isDark]
  );

  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case "week": return "За неделю";
      case "month": return "За месяц";
      case "3months": return "За 3 месяца";
      case "total": return "Всего";
      default: return period;
    }
  };

  const renderHeader = () => (
    <>
      {}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Текущий</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.current_weight?.toFixed(1) || "--"} кг
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Цель</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.target_weight?.toFixed(1) || "--"} кг
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Изменение</Text>
          <Text style={[
            styles.statValue, 
            { 
              color: (stats?.total_change || 0) > 0 
                ? "#EF5350" 
                : (stats?.total_change || 0) < 0 
                  ? "#4CAF50" 
                  : colors.text 
            }
          ]}>
            {stats?.total_change 
              ? `${stats.total_change > 0 ? "+" : ""}${stats.total_change.toFixed(1)}` 
              : "--"} кг
          </Text>
        </View>
      </View>

      {}
      <View style={[styles.chartCard, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>График веса</Text>
        <WeightChart 
          data={stats?.history || []} 
          targetWeight={stats?.target_weight}
        />
      </View>

      {}
      {stats?.changes && stats.changes.length > 0 && (
        <View style={[styles.changesCard, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Изменения</Text>
          <View style={styles.changesGrid}>
            {stats.changes.map((change, index) => (
              <View key={index} style={styles.changeItem}>
                <Text style={[styles.changePeriod, { color: colors.textSecondary }]}>
                  {getPeriodLabel(change.period)}
                </Text>
                <Text style={[
                  styles.changeValue,
                  { 
                    color: change.change_kg === null 
                      ? colors.textSecondary 
                      : (change.change_kg || 0) > 0 
                        ? "#EF5350" 
                        : (change.change_kg || 0) < 0 
                          ? "#4CAF50" 
                          : colors.text 
                  }
                ]}>
                  {change.change_kg !== null 
                    ? `${(change.change_kg || 0) > 0 ? "+" : ""}${change.change_kg.toFixed(1)} кг`
                    : "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {}
      <View style={styles.historyHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>История</Text>
      </View>
    </>
  );

  const renderEmptyHistory = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
      <Ionicons name="scale-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Нет записей о весе
      </Text>
      <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
        Добавьте первую запись для отслеживания прогресса
      </Text>
      <TouchableOpacity 
        style={[
          styles.addButton, 
          { backgroundColor: isDark ? colors.backgroundSecondary : "#FFFFF0" }
        ]}
        onPress={() => router.push("/add-weight" as any)}
      >
        <Text style={[styles.addButtonText, { color: colors.text }]}>Добавить вес</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.card }, isDark && styles.noShadow]} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>История веса</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <LottieLoader size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }, isDark && styles.noShadow]} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>История веса</Text>
        <TouchableOpacity 
          style={[
            styles.addWeightButton,
            { 
              backgroundColor: isDark ? colors.backgroundSecondary : "#FFFFF0", 
              borderColor: colors.border, 
              borderWidth: 1 
            },
            isDark && styles.noShadow,
          ]}
          onPress={() => router.push("/add-weight" as any)}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlashList
        data={stats?.history || []}
        keyExtractor={keyExtractor}
        renderItem={renderWeightItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyHistory}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        drawDistance={250}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

export default memo(WeightHistoryScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  headerPlaceholder: {
    width: 44,
  },
  addWeightButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  changesCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  changesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  changeItem: {
    width: "47%",
  },
  changePeriod: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  changeValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  historyHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  entryItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  entryLeft: {
    flex: 1,
  },
  entryDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  entryWeight: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  changeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  addButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  noShadow: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
});
