import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../context/LanguageContext";
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
  { id: "foundation", labelKey: "food.sources.foundation", icon: "leaf" as const },
  { id: "branded", labelKey: "food.sources.branded", icon: "storefront" as const },
  { id: "survey", labelKey: "food.sources.survey", icon: "pulse" as const },
];

export default function FoodDatabaseScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("foundation");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isInitialMount = useRef(true);

  const loadInitialFoods = useCallback(async (source: string) => {
    try {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
      
      const response = await apiService.getFoods(0, 20, source, language);
      const result = response.foods || [];
      
      setFoods(result);
      setHasMore(response.total > 20);
      setError(null);
    } catch (err: any) {
      setFoods([]);
      setHasMore(false);
      setError(err?.message || t('common.loading'));
    } finally {
      setLoading(false);
    }
  }, [language, t]);

  useFocusEffect(
    useCallback(() => {
      if (!foods.length && !loading) {
        loadInitialFoods("foundation");
      }
    }, [foods.length, loading, loadInitialFoods])
  );

  const loadMoreFoods = useCallback(async () => {
    if (loadingMore || !hasMore || searchQuery.trim()) return;

    try {
      setLoadingMore(true);
      const newOffset = offset + 20;
      
      const response = await apiService.getFoods(newOffset, 20, selectedSource, language);
      const result = response.foods || [];
      
      setFoods(prev => [...prev, ...result]);
      setOffset(newOffset);
      setHasMore(newOffset + result.length < response.total);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, searchQuery, offset, selectedSource, language, t]);

  const searchFoods = useCallback(async (query: string, source: string) => {
    if (!query.trim()) {
      loadInitialFoods(source);
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.searchFoods(query, 50, source, language);
      const result = response.foods || [];
      
      setFoods(result);
      setHasMore(false);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || t('error.oopsomething');
      
      setFoods([]);
      setHasMore(false);
      setError(`${t('error.oopsomething')}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, [language, loadInitialFoods, t]);

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
  }, [searchQuery, selectedSource, searchFoods, loadInitialFoods]);

  const handleSourceChange = useCallback((source: string) => {
    setSelectedSource(source);
    setSearchQuery("");
    setOffset(0);
  }, []);

  const handleAddFood = useCallback((food: FoodItem) => {
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
  }, [router]);

  const renderFoodItem = useCallback(({ item }: { item: FoodItem }) => (
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
          {item.calories ? `${item.calories} ${t('units.kcal')}` : t('common.noData')} {item.portion && `· ${item.portion}`}
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
  ), [colors, isDark, styles, handleAddFood]);

  const keyExtractor = useCallback((item: FoodItem, index: number) => 
    `${item.fdc_id}-${item.source}-${index}`, 
    []
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
          {error || t('common.noResults')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerPlaceholder} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('food.database')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('food.search.placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sourceTabsContainer}>
          {SOURCES.map((source) => {
            const isSelected = selectedSource === source.id;
            const unselectedBgColor = isDark ? "#1A1A1A" : "#FFFFFF";
            const unselectedTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
            
            return (
              <Pressable
                key={source.id}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.sourceTab,
                  isSelected 
                    ? { 
                        backgroundColor: colors.primary,
                        borderWidth: 0,
                      }
                    : { 
                        backgroundColor: unselectedBgColor,
                        borderWidth: 1,
                        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                      },
                  pressed && !isSelected && isDark && {
                    backgroundColor: "#2A2A2A",
                  },
                ]}
                onPress={() => handleSourceChange(source.id)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons
                    name={source.icon}
                    size={18}
                    color={isSelected ? (isDark ? "white" : "#1A1A1A") : unselectedTextColor}
                  />
                  <Text
                    style={[
                      styles.sourceTabText,
                      {
                        color: isSelected ? (isDark ? "white" : "#1A1A1A") : unselectedTextColor,
                      },
                    ]}
                  >
                    {t(source.labelKey)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          {searchQuery ? t('food.search.placeholder') : `${t(SOURCES.find(s => s.id === selectedSource)?.labelKey || 'food.database')} ${t('food.database')}`}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={foods}
            renderItem={renderFoodItem}
            keyExtractor={keyExtractor}
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
      gap: 10,
      marginTop: 16,
      marginBottom: 20,
      marginHorizontal: 0,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 0,
    },
    sourceTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      minHeight: 48,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sourceTabText: {
      fontSize: 13,
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
