import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";

interface FoodItem {
  fdc_id: string;
  name: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  portion?: string;
  brand?: string;
  source: string;
}

const SOURCES = [
  { id: "foundation", label: "Foundation", icon: "leaf" as const },
  { id: "branded", label: "Brands", icon: "storefront" as const },
  { id: "survey", label: "Survey", icon: "pulse" as const },
];

export default function FoodDatabaseScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("foundation");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useFocusEffect(
    useCallback(() => {
      loadFoodsBySource("foundation");
      return () => {
        setSearchQuery("");
        setSelectedSource("foundation");
      };
    }, [])
  );

  const loadFoodsBySource = async (source: string) => {
    try {
      setLoading(true);
      const result = await apiService.getFoods(0, 30, source);
      setFoods(result.foods);
      setError(null);
    } catch (err) {
      setError(`Ошибка при загрузке ${source}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (query: string, source: string) => {
    if (!query.trim()) {
      loadFoodsBySource(source);
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.searchFoods(query, 50, source);
      setFoods(result.foods);
      setError(null);
    } catch (err) {
      setError("Ошибка при поиске");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchFoods(searchQuery, selectedSource);
      } else {
        loadFoodsBySource(selectedSource);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedSource]);

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setSearchQuery("");
  };

  const handleAddFood = (food: FoodItem) => {
    router.push({
      pathname: "/",
      params: {
        addedFood: JSON.stringify({
          fdc_id: food.fdc_id,
          name: food.name,
          calories: food.calories || 0,
          protein: food.protein || 0,
          fat: food.fat || 0,
          carbs: food.carbs || 0,
          portion: food.portion || "100g",
          brand: food.brand,
          source: food.source,
        }),
        refresh: Date.now().toString(),
      },
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Food Database</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search foods..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sourceTabsContainer}>
          {SOURCES.map((source) => (
            <TouchableOpacity
              key={source.id}
              style={[
                styles.sourceTab,
                selectedSource === source.id && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => handleSourceChange(source.id)}
            >
              <Ionicons
                name={source.icon}
                size={18}
                color={selectedSource === source.id ? "white" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.sourceTabText,
                  {
                    color: selectedSource === source.id ? "white" : colors.textSecondary,
                  },
                ]}
              >
                {source.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          {searchQuery ? "Search Results" : `${selectedSource.toUpperCase()} Foods`}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
            <Ionicons name="alert-circle" size={40} color={colors.error} />
            <Text style={[styles.emptyText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        ) : foods.length > 0 ? (
          foods.map((food) => (
            <View
              key={`${food.fdc_id}-${food.source}`}
              style={[
                styles.foodItem,
                { backgroundColor: colors.card },
                isDark && styles.noShadow,
              ]}
            >
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                {food.brand && (
                  <Text style={[styles.foodBrand, { color: colors.textSecondary }]}>
                    {food.brand}
                  </Text>
                )}
                <Text style={[styles.foodDetails, { color: colors.textSecondary }]}>
                  {food.calories ? `${food.calories} cal` : "No data"} {food.portion && `· ${food.portion}`}
                </Text>
                {food.calories && food.protein !== undefined && (
                  <Text style={[styles.foodMacros, { color: colors.textTertiary }]}>
                    P: {food.protein}g · F: {food.fat}g · C: {food.carbs}g
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: isDark ? colors.backgroundSecondary : "#F5F5F5" }]}
                onPress={() => handleAddFood(food)}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
            <Ionicons name="search" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No foods found
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
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
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
    },
    headerPlaceholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    sourceTabsContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    sourceTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      gap: 6,
    },
    sourceTabText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    resultsTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      marginBottom: 12,
    },
    foodItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    foodInfo: {
      flex: 1,
    },
    foodName: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 2,
    },
    foodBrand: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
      marginBottom: 4,
    },
    foodDetails: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    foodMacros: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      borderRadius: 12,
      marginTop: 20,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      marginTop: 12,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    noShadow: {
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
  });
