import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import SnowOverlay from "../components/ui/SnowOverlay";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.38;

const CIRCLE_SIZE = 52;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;

export default function MealDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const fontsLoaded = useFonts();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const mealId = Number(params.id || 0);
  const imageUrl = params.imageUrl as string | undefined;
  const mealName = (params.name as string) || "Блюдо";
  const mealTime = (params.time as string) || "";
  const calories = Number(params.calories || 0);
  const protein = Number(params.protein || 0);
  const carbs = Number(params.carbs || 0);
  const fats = Number(params.fats || 0);
  const isManual = params.isManual === "true";

  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(mealName);
  const [editCalories, setEditCalories] = useState(calories.toString());
  const [editProtein, setEditProtein] = useState(protein.toString());
  const [editCarbs, setEditCarbs] = useState(carbs.toString());
  const [editFats, setEditFats] = useState(fats.toString());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [loadingDetail, setLoadingDetail] = useState(true);
  const [ingredients, setIngredients] = useState<Array<{ name: string; calories: number }>>([]);
  const [extraMacros, setExtraMacros] = useState({
    fiber: 0,
    sugar: 0,
    sodium: 0,
  });
  const [healthScore, setHealthScore] = useState<number | null>(null);

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
      } catch {

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

  const handleAddIngredient = () => {
    Alert.prompt(
      "Добавить ингредиент",
      "Введите название ингредиента и калории (например: Помидор, 20)",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Добавить",
          onPress: async (text?: string) => {
            if (!text || !text.trim()) return;
            
            const parts = text.split(",").map((p: string) => p.trim());
            if (parts.length < 2) {
              Alert.alert("Ошибка", "Укажите название и калории через запятую");
              return;
            }
            
            const name = parts[0];
            const calories = Number(parts[1]);
            
            if (!name || isNaN(calories)) {
              Alert.alert("Ошибка", "Неверный формат. Пример: Помидор, 20");
              return;
            }
            
            try {
              await apiService.addMealIngredient(mealId, { name, calories });
              setIngredients([...ingredients, { name, calories }]);
              Alert.alert("Успешно", "Ингредиент добавлен");
            } catch (error: any) {
              Alert.alert("Ошибка", "Не удалось добавить ингредиент");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleCorrectMeal = () => {
    Alert.prompt(
      "Исправить блюдо",
      "Опишите, что нужно исправить (состав, ингредиенты, описание)",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Исправить",
          onPress: async (correctionText?: string) => {
            if (!correctionText || !correctionText.trim()) return;
            
            try {
              setSaving(true);
              const corrected = await apiService.correctMealWithAI(mealId, correctionText);
              
              if (corrected.meal_name) setEditName(corrected.meal_name);
              if (corrected.calories) setEditCalories(corrected.calories.toString());
              if (corrected.protein) setEditProtein(corrected.protein.toString());
              if (corrected.carbs) setEditCarbs(corrected.carbs.toString());
              if (corrected.fats) setEditFats(corrected.fats.toString());
              if (corrected.ingredients) setIngredients(corrected.ingredients);
              if (corrected.extra_macros) {
                setExtraMacros({
                  fiber: corrected.extra_macros.fiber || 0,
                  sugar: corrected.extra_macros.sugar || 0,
                  sodium: corrected.extra_macros.sodium || 0,
                });
              }
              if (corrected.health_score !== undefined) setHealthScore(corrected.health_score);
              
              Alert.alert("Успешно", "Блюдо обновлено на основе анализа AI");
            } catch (error: any) {
              Alert.alert("Ошибка", error.message || "Не удалось исправить блюдо");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderPage1 = () => (
    <View style={styles.carouselPage}>
      <View style={styles.caloriesCard}>
        <View style={styles.caloriesIconContainer}>
          <Ionicons name="flame" size={24} color={colors.primary} />
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

      {}
      <View style={styles.healthScoreCard}>
        <View style={styles.healthScoreIcon}>
          <Ionicons name="flash" size={22} color="#FF6B9D" />
        </View>
        <View style={styles.healthScoreInfo}>
          <Text style={styles.healthScoreLabel}>Оценка здоровья</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 6 }} />
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

  const renderPage2 = () => (
    <View style={styles.carouselPage}>
      <View style={styles.extraMacrosRow}>
        <View style={styles.extraMacroCard}>
          <Text style={styles.extraMacroIcon}>🍆</Text>
          <Text style={styles.extraMacroLabel}>Клетчатка</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.extraMacroValue}>{extraMacros.fiber}g</Text>
          )}
        </View>
        <View style={styles.extraMacroCard}>
          <Text style={styles.extraMacroIcon}>🍬</Text>
          <Text style={styles.extraMacroLabel}>Сахар</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.extraMacroValue}>{extraMacros.sugar}g</Text>
          )}
        </View>
        <View style={styles.extraMacroCard}>
          <Text style={styles.extraMacroIcon}>🧂</Text>
          <Text style={styles.extraMacroLabel}>Натрий</Text>
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.extraMacroValue}>{extraMacros.sodium}mg</Text>
          )}
        </View>
      </View>
    </View>
  );

  const carouselPages = [
    { key: "page1", render: renderPage1 },
    { key: "page2", render: renderPage2 },
  ];

  return (
    <View style={styles.container}>
      <SnowOverlay />
      {}
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
          {}
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

      {}
      <View style={[styles.contentCard, !imageUrl && styles.contentCardNoImage]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {}
          <View style={styles.metaRow}>
            <TouchableOpacity style={styles.bookmarkButton}>
              <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.timeText}>{mealTime}</Text>
          </View>

          {}
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

          {}
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
            {}
            <View style={styles.paginationDots}>
              {carouselPages.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentPage === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          {}
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.ingredientsTitle}>Ингредиенты</Text>
              <TouchableOpacity onPress={handleAddIngredient}>
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

          {}
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackContent}>
              <Text style={styles.feedbackIcon}>-:-</Text>
              <Text style={styles.feedbackText}>Как, по-твоему, справился{"\n"}Yeb-Ich?</Text>
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

          {}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {}
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
            <TouchableOpacity style={styles.reportButton} onPress={handleCorrectMeal}>
              <Ionicons name="sparkles" size={18} color={isDark ? "#FFFFFF" : colors.primary} />
              <Text style={styles.reportButtonText}>Исправить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Готово</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {}
      {deleting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleDark: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
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
    backgroundColor: colors.card,
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
    color: colors.textSecondary,
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
    color: colors.text,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  titleInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portionText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },

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

  caloriesCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
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
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  caloriesValue: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.text,
    letterSpacing: -1,
  },
  caloriesValueInput: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  macrosRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
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
    backgroundColor: colors.border,
    alignSelf: "center",
  },
  macroIcon: {
    fontSize: 18,
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
  },
  macroValueInput: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    textAlign: "center",
    minWidth: 50,
  },

  extraMacrosRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
  },
  extraMacroCard: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    gap: 6,
  },
  extraMacroIcon: {
    fontSize: 20,
  },
  extraMacroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.textSecondary,
  },
  extraMacroValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.text,
  },

  healthScoreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
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
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.textSecondary,
  },
  healthScoreBar: {
    height: 6,
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.text,
  },

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
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },

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
    color: colors.text,
    letterSpacing: -0.3,
  },
  addIngredient: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.textSecondary,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
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
    color: colors.text,
  },
  loadingIngredients: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.textSecondary,
  },
  emptyIngredients: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyIngredientsText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  healthScorePlaceholder: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.textSecondary,
    marginTop: 6,
  },

  feedbackSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
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
    color: colors.textSecondary,
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.text,
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
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },

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
    borderTopColor: colors.border,
  },
  reportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: isDark ? "#2D2D2D" : colors.backgroundSecondary,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: isDark ? "#2D2D2D" : colors.primary,
  },
  reportButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: isDark ? "#FFFFFF" : colors.primary,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.text,
  },
  doneButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: isDark ? "#2D2D2D" : colors.primary,
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
    backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
});
