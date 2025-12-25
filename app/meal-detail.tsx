import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewToken
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.38;

// Circle constants
const CIRCLE_SIZE = 52;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;

export default function MealDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const fontsLoaded = useFonts();

  const mealId = Number(params.id || 0);
  const imageUrl = params.imageUrl as string | undefined;
  const mealName = (params.name as string) || "Блюдо";
  const mealTime = (params.time as string) || "";
  const calories = Number(params.calories || 0);
  const protein = Number(params.protein || 0);
  const carbs = Number(params.carbs || 0);
  const fats = Number(params.fats || 0);
  const isManual = params.isManual === "true";

  // Carousel state
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // For editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(mealName);
  const [editCalories, setEditCalories] = useState(calories.toString());
  const [editProtein, setEditProtein] = useState(protein.toString());
  const [editCarbs, setEditCarbs] = useState(carbs.toString());
  const [editFats, setEditFats] = useState(fats.toString());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dynamic data from AI/Neural Network
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [ingredients, setIngredients] = useState<Array<{ name: string; calories: number }>>([]);
  const [extraMacros, setExtraMacros] = useState({
    fiber: 0,
    sugar: 0,
    sodium: 0,
  });
  const [healthScore, setHealthScore] = useState<number | null>(null);

  // Load meal detail data from API
  useEffect(() => {
    const loadMealDetail = async () => {
      try {
        setLoadingDetail(true);
        const detail = await apiService.getMealPhotoDetail(mealId);
        
        if (detail.ingredients) {
          setIngredients(detail.ingredients);
        }
        
        if (detail.extra_macros) {
          setExtraMacros({
            fiber: detail.extra_macros.fiber || 0,
            sugar: detail.extra_macros.sugar || 0,
            sodium: detail.extra_macros.sodium || 0,
          });
        }
        
        if (detail.health_score !== undefined) {
          setHealthScore(detail.health_score);
        }
      } catch (error: any) {
        if (__DEV__) console.warn("Failed to load meal detail:", error);
        // If API doesn't support detail endpoint yet, data will remain empty
        // This is expected until backend implements neural network analysis
      } finally {
        setLoadingDetail(false);
      }
    };

    if (mealId) {
      loadMealDetail();
    }
  }, [mealId]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentPage(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (!fontsLoaded) return null;

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    Alert.alert("Поделиться", "Функция в разработке");
  };

  const handleMore = () => {
    Alert.alert(
      "Действия",
      undefined,
      [
        { text: "Редактировать", onPress: () => setIsEditing(true) },
        {
          text: "Удалить",
          style: "destructive",
          onPress: handleDelete,
        },
        { text: "Отмена", style: "cancel" },
      ]
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      "Удалить блюдо",
      "Вы уверены, что хотите удалить это блюдо?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await apiService.deleteMealPhoto(mealId);
              router.replace({
                pathname: "/(tabs)",
                params: { refresh: Date.now().toString() },
              } as any);
            } catch (error: any) {
              Alert.alert("Ошибка", "Не удалось удалить блюдо");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateMealPhoto(mealId, {
        meal_name: editName,
        calories: Number(editCalories) || 0,
        protein: Number(editProtein) || 0,
        fat: Number(editFats) || 0,
        carbs: Number(editCarbs) || 0,
      });
      setIsEditing(false);
      router.replace({
        pathname: "/(tabs)",
        params: { refresh: Date.now().toString() },
      } as any);
    } catch (error: any) {
      Alert.alert("Ошибка", "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    router.back();
  };

  const handleReportProblem = () => {
    Alert.alert("Исправить проблему", "Функция обратной связи в разработке");
  };

  // Page 1: Calories + Macros (Protein, Carbs, Fats)
  const renderPage1 = () => (
    <View style={styles.carouselPage}>
      {/* Calories Card */}
      <View style={styles.caloriesCard}>
        <View style={styles.caloriesIconContainer}>
          <Ionicons name="flame" size={24} color="#1A1A1A" />
        </View>
        <View style={styles.caloriesInfo}>
          <Text style={styles.caloriesLabel}>Калории</Text>
          {isEditing ? (
            <TextInput
              style={styles.caloriesValueInput}
              value={editCalories}
              onChangeText={setEditCalories}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.caloriesValue}>{calories}</Text>
          )}
        </View>
      </View>

      {/* Macros Row */}
      <View style={styles.macrosRow}>
        <View style={styles.macroCard}>
          <Text style={styles.macroIcon}>🍖</Text>
          <Text style={styles.macroLabel}>Белки</Text>
          {isEditing ? (
            <TextInput
              style={styles.macroValueInput}
              value={editProtein}
              onChangeText={setEditProtein}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.macroValue}>{protein}g</Text>
          )}
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroCard}>
          <Text style={styles.macroIcon}>🌾</Text>
          <Text style={styles.macroLabel}>Углеводы</Text>
          {isEditing ? (
            <TextInput
              style={styles.macroValueInput}
              value={editCarbs}
              onChangeText={setEditCarbs}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.macroValue}>{carbs}g</Text>
          )}
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroCard}>
          <Text style={styles.macroIcon}>🫒</Text>
          <Text style={styles.macroLabel}>Жиры</Text>
          {isEditing ? (
            <TextInput
              style={styles.macroValueInput}
              value={editFats}
              onChangeText={setEditFats}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.macroValue}>{fats}g</Text>
          )}
        </View>
      </View>
    </View>
  );

  // Page 2: Extra Macros (Fiber, Sugar, Sodium) + Health Score
  const renderPage2 = () => (
    <View style={styles.carouselPage}>
      {/* Extra Macros Row */}
      <View style={styles.extraMacrosRow}>
        <View style={styles.extraMacroCard}>
          <Text style={styles.extraMacroIcon}>🍆</Text>
          <Text style={styles.extraMacroLabel}>Клетчатка</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.extraMacroValue}>{extraMacros.fiber}g</Text>
          )}
        </View>
        <View style={styles.extraMacroCard}>
          <Text style={styles.extraMacroIcon}>🍬</Text>
          <Text style={styles.extraMacroLabel}>Сахар</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.extraMacroValue}>{extraMacros.sugar}g</Text>
          )}
        </View>
        <View style={styles.extraMacroCard}>
          <Text style={styles.extraMacroIcon}>🧂</Text>
          <Text style={styles.extraMacroLabel}>Натрий</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.extraMacroValue}>{extraMacros.sodium}mg</Text>
          )}
        </View>
      </View>

      {/* Health Score Card */}
      <View style={styles.healthScoreCard}>
        <View style={styles.healthScoreIcon}>
          <Ionicons name="flash" size={22} color="#FF6B9D" />
        </View>
        <View style={styles.healthScoreInfo}>
          <Text style={styles.healthScoreLabel}>Оценка здоровья</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 6 }} />
          ) : healthScore !== null ? (
            <View style={styles.healthScoreBar}>
              <View style={[
                styles.healthScoreBarFill, 
                { 
                  width: `${healthScore * 10}%`,
                  backgroundColor: healthScore >= 7 ? "#4CAF50" 
                                 : healthScore >= 4 ? "#FF9800" 
                                 : "#E91E63"
                }
              ]} />
            </View>
          ) : (
            <Text style={styles.healthScorePlaceholder}>Н/д</Text>
          )}
        </View>
        {!loadingDetail && (
          <Text style={[
            styles.healthScoreValue,
            healthScore !== null && {
              color: healthScore >= 7 ? "#4CAF50" 
                   : healthScore >= 4 ? "#FF9800" 
                   : "#E91E63"
            }
          ]}>
            {healthScore !== null ? `${healthScore}/10` : "Н/д"}
          </Text>
        )}
      </View>
    </View>
  );

  const carouselPages = [
    { key: "page1", render: renderPage1 },
    { key: "page2", render: renderPage2 },
  ];

  return (
    <View style={styles.container}>
      {/* Image Section */}
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
          {/* Header over image */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Питание</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={handleMore}>
                  <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.noImageHeader, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerButtonDark} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitleDark}>Питание</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButtonDark} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButtonDark} onPress={handleMore}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Content Card */}
      <View style={[styles.contentCard, !imageUrl && styles.contentCardNoImage]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Bookmark & Time */}
          <View style={styles.metaRow}>
            <TouchableOpacity style={styles.bookmarkButton}>
              <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.timeText}>{mealTime}</Text>
          </View>

          {/* Meal Name & Portions */}
          <View style={styles.titleRow}>
            {isEditing ? (
              <TextInput
                style={styles.titleInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Название блюда"
              />
            ) : (
              <Text style={styles.mealTitle} numberOfLines={2}>{mealName}</Text>
            )}
            <TouchableOpacity style={styles.portionButton}>
              <Text style={styles.portionText}>1</Text>
              <Ionicons name="pencil" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Carousel Section */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={carouselPages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <View style={styles.carouselPageWrapper}>
                  {item.render()}
                </View>
              )}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH - 40,
                offset: (SCREEN_WIDTH - 40) * index,
                index,
              })}
            />
            {/* Pagination dots */}
            <View style={styles.paginationDots}>
              {carouselPages.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentPage === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.ingredientsTitle}>Ингредиенты</Text>
              <TouchableOpacity>
                <Text style={styles.addIngredient}>+ Добавить ещё</Text>
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <View style={styles.loadingIngredients}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Анализ ингредиентов...</Text>
              </View>
            ) : ingredients.length > 0 ? (
              ingredients.map((ingredient, index) => (
                <TouchableOpacity key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientCalories}>• {ingredient.calories} cal</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyIngredients}>
                <Text style={styles.emptyIngredientsText}>
                  Ингредиенты будут определены нейросетью после анализа блюда
                </Text>
              </View>
            )}
          </View>

          {/* Feedback Section */}
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackContent}>
              <Text style={styles.feedbackIcon}>-:-</Text>
              <Text style={styles.feedbackText}>Как, по-твоему, справился{"\n"}Cal AI?</Text>
            </View>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity style={styles.feedbackButton}>
                <Ionicons name="thumbs-down-outline" size={22} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedbackButton}>
                <Ionicons name="thumbs-up-outline" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Spacer for bottom buttons */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 16 }]}>
        {isEditing ? (
          <>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.doneButton, saving && styles.doneButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.doneButtonText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.reportButton} onPress={handleReportProblem}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.reportButtonText}>Исправить проблему</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Готово</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Loading overlay */}
      {deleting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 44,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  noImageHeader: {
    backgroundColor: colors.background,
    paddingBottom: 8,
  },
  headerButtonDark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleDark: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  contentCard: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentCardNoImage: {
    marginTop: 0,
  },
  scrollContent: {
    paddingTop: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
    paddingHorizontal: 20,
  },
  mealTitle: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  titleInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  portionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E4DC",
  },
  portionText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },

  // Carousel
  carouselContainer: {
    marginBottom: 20,
  },
  carouselPageWrapper: {
    width: SCREEN_WIDTH - 40,
    marginHorizontal: 20,
  },
  carouselPage: {
    gap: 12,
  },

  // Page 1: Calories Card
  caloriesCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  caloriesIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F3EF",
    alignItems: "center",
    justifyContent: "center",
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    marginBottom: 2,
  },
  caloriesValue: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    letterSpacing: -1,
  },
  caloriesValueInput: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    backgroundColor: "#F5F3EF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  // Page 1: Macros Row
  macrosRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  macroCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  macroDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#E8E4DC",
    alignSelf: "center",
  },
  macroIcon: {
    fontSize: 18,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  macroValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },
  macroValueInput: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    backgroundColor: "#F5F3EF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    textAlign: "center",
    minWidth: 50,
  },

  // Page 2: Extra Macros Row
  extraMacrosRow: {
    flexDirection: "row",
    gap: 10,
  },
  extraMacroCard: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  extraMacroIcon: {
    fontSize: 20,
  },
  extraMacroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  extraMacroValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },

  // Page 2: Health Score Card
  healthScoreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  healthScoreIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF0F5",
    alignItems: "center",
    justifyContent: "center",
  },
  healthScoreInfo: {
    flex: 1,
    gap: 6,
  },
  healthScoreLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  healthScoreBar: {
    height: 6,
    backgroundColor: "#F2EFE9",
    borderRadius: 3,
    overflow: "hidden",
  },
  healthScoreBarFill: {
    height: "100%",
    backgroundColor: "#FF6B9D",
    borderRadius: 3,
  },
  healthScoreValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
  },

  // Pagination
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DAD4CA",
  },
  dotActive: {
    backgroundColor: colors.primary,
  },

  // Ingredients
  ingredientsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  addIngredient: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.secondary,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  ingredientCalories: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    marginLeft: 8,
  },
  loadingIngredients: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  emptyIngredients: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyIngredientsText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  healthScorePlaceholder: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
    marginTop: 6,
  },

  // Feedback
  feedbackSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  feedbackContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  feedbackIcon: {
    fontSize: 20,
    color: colors.secondary,
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
    lineHeight: 20,
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: 8,
  },
  feedbackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F3EF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom Buttons
  bottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#E8E4DC",
  },
  reportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E8E4DC",
  },
  reportButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E8E4DC",
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
  },
  doneButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 28,
  },
  doneButtonDisabled: {
    opacity: 0.7,
  },
  doneButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
});
