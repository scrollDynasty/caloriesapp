import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { SupportedLanguage, initLanguage, t } from "../../utils/language";

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
  { id: "foundation", label: "Основные", icon: "leaf" as const },
  { id: "branded", label: "Бренды", icon: "storefront" as const },
  { id: "survey", label: "Survey", icon: "pulse" as const },
];

export default function FoodDatabaseScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("foundation");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [lang, setLang] = useState<SupportedLanguage>("en");
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const searchTimeoutRef = useRef<number | null>(null);

  const isInitialMount = useRef(true);

  useEffect(() => {
    initLanguage().then(setLang);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInitialFoods("foundation");
      return () => {
        setSearchQuery("");
        setSelectedSource("foundation");
        setOffset(0);
        setHasMore(true);
      };
    }, [lang])
  );

  const loadInitialFoods = async (source: string) => {
    try {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
      
      const response = await apiService.getFoods(0, 20, source, lang);
      const result = response.foods || [];
      
      setFoods(result);
      setHasMore(response.total > 20);
      setError(null);
    } catch (err: any) {
      setFoods([]);
      setHasMore(false);
      setError(err?.message || t('common.loading', lang));
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFoods = async () => {
    if (loadingMore || !hasMore || searchQuery.trim()) return;

    try {
      setLoadingMore(true);
      const newOffset = offset + 20;
      
      const response = await apiService.getFoods(newOffset, 20, selectedSource, lang);
      const result = response.foods || [];
      
      setFoods(prev => [...prev, ...result]);
      setOffset(newOffset);
      setHasMore(newOffset + result.length < response.total);
    } finally {
      setLoadingMore(false);
    }
  };

  const searchFoods = async (query: string, source: string) => {
    if (!query.trim()) {
      loadInitialFoods(source);
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.searchFoods(query, 50, source, lang);
      const result = response.foods || [];
      
      setFoods(result);
      setHasMore(false);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || "Ошибка поиска";
      
      setFoods([]);
      setHasMore(false);
      setError(`Ошибка: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        searchFoods(searchQuery, selectedSource);
      } else {
        loadInitialFoods(selectedSource);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedSource]);

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setSearchQuery("");
    setOffset(0);
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

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View
      style={[
        styles.foodItem,
        { backgroundColor: colors.card },
        isDark && styles.noShadow,
      ]}
    >
      <View style={styles.foodInfo}>
        <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        {item.brand && (
          <Text style={[styles.foodBrand, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
        <Text style={[styles.foodDetails, { color: colors.textSecondary }]}>
          {item.calories ? `${item.calories} ккал` : "Нет данных"} {item.portion && `· ${item.portion}`}
        </Text>
        {item.calories !== undefined && item.protein !== undefined && (
          <Text style={[styles.foodMacros, { color: colors.textTertiary }]}>
            Б: {item.protein}г · Ж: {item.fat}г · У: {item.carbs}г
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: isDark ? colors.backgroundSecondary : "#F5F5F5" }]}
        onPress={() => handleAddFood(item)}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }, isDark && styles.noShadow]}>
        <Ionicons 
          name={error ? "alert-circle" : "search"} 
          size={36} 
          color={error ? colors.error : colors.textTertiary} 
        />
        <Text style={[styles.emptyText, { color: error ? colors.error : colors.textSecondary }]}>
          {error || "Продукты не найдены"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>База продуктов</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Поиск продуктов..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sourceTabsContainer}>
          {SOURCES.map((source) => {
            const isSelected = selectedSource === source.id;
            // В темной теме: темный фон с белым текстом для невыбранных
            // В светлой теме: светлый фон с темным текстом для невыбранных
            const unselectedBgColor = isDark ? "#1A1A1A" : "#FFFFFF";
            const unselectedTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
            
            return (
              <TouchableOpacity
                key={source.id}
                activeOpacity={0.7}
                style={[
                  styles.sourceTab,
                  isSelected 
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: unselectedBgColor },
                ]}
                onPress={() => handleSourceChange(source.id)}
              >
                <Ionicons
                  name={source.icon}
                  size={16}
                  color={isSelected ? "white" : unselectedTextColor}
                />
                <Text
                  style={[
                    styles.sourceTabText,
                    {
                      color: isSelected ? "white" : unselectedTextColor,
                    },
                  ]}
                >
                  {source.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          {searchQuery ? "Результаты поиска" : `${SOURCES.find(s => s.id === selectedSource)?.label || ""} продукты`}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={foods}
            renderItem={renderFoodItem}
            keyExtractor={(item, index) => `${item.fdc_id}-${item.source}-${index}`}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreFoods}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={15}
            windowSize={5}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
    },
    headerPlaceholder: {
      width: 36,
    },
    content: {
      flex: 1,
      paddingHorizontal: 14,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      marginBottom: 12,
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
      gap: 6,
      marginBottom: 12,
    },
    sourceTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: colors.backgroundSecondary,
      gap: 4,
    },
    sourceTabText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
    },
    resultsTitle: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      marginBottom: 10,
    },
    listContent: {
      paddingBottom: 20,
    },
    foodItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 6,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    foodInfo: {
      flex: 1,
      paddingRight: 8,
    },
    foodName: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 2,
    },
    foodBrand: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
      marginBottom: 3,
    },
    foodDetails: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    foodMacros: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      marginTop: 3,
    },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      borderRadius: 10,
      marginTop: 20,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    emptyText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      marginTop: 10,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    footerLoader: {
      paddingVertical: 16,
      alignItems: "center",
    },
    noShadow: {
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
  });
