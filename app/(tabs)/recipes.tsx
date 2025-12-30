import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { sanitizeString } from "../../utils/validation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH > 768;
const ADAPTIVE_COLUMNS = isTablet ? 3 : 2;
const ADAPTIVE_CARD_WIDTH = (SCREEN_WIDTH - 24 * (ADAPTIVE_COLUMNS + 1)) / ADAPTIVE_COLUMNS;

interface Recipe {
  id: string;
  title: string;
  image: string;
  calories: number;
  time: number;
  difficulty: "Легко" | "Средне" | "Сложно";
  category: string;
  ingredients: string[];
  description: string;
  isPopular?: boolean;
  count?: number;
}

const POPULAR_UZBEK_RECIPES: Recipe[] = [
  {
    id: "breakfast-1",
    title: "Каша маш",
    image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400",
    calories: 280,
    time: 30,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["Маш", "Рис", "Морковь", "Лук", "Мясо"],
    description: "Традиционный узбекский завтрак с машем и рисом",
    isPopular: true,
  },
  {
    id: "breakfast-2",
    title: "Самса с тыквой",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    calories: 320,
    time: 40,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["Тесто", "Тыква", "Лук", "Масло"],
    description: "Хрустящая самса с тыквенной начинкой",
    isPopular: true,
  },
  {
    id: "breakfast-3",
    title: "Ширчой",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    calories: 250,
    time: 20,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["Молоко", "Рис", "Сахар", "Масло"],
    description: "Молочная рисовая каша по-узбекски",
    isPopular: true,
  },
  {
    id: "breakfast-4",
    title: "Кукси",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    calories: 380,
    time: 25,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["Лапша", "Овощи", "Яйцо", "Соус"],
    description: "Холодный суп с лапшой",
    isPopular: true,
  },
  {
    id: "breakfast-5",
    title: "Катлама",
    image: "https://images.unsplash.com/photo-1612874742036-e570796f688d?w=400",
    calories: 350,
    time: 30,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["Тесто", "Масло", "Яйцо", "Зелень"],
    description: "Слоеная лепешка",
    isPopular: true,
  },
  {
    id: "breakfast-6",
    title: "Чучвара",
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400",
    calories: 400,
    time: 45,
    difficulty: "Сложно",
    category: "Завтрак",
    ingredients: ["Тесто", "Мясо", "Лук", "Специи"],
    description: "Узбекские пельмени",
    isPopular: true,
  },
  {
    id: "breakfast-7",
    title: "Халваитар",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    calories: 420,
    time: 25,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["Мука", "Масло", "Сахар", "Яйца"],
    description: "Сладкая выпечка",
    isPopular: true,
  },
  {
    id: "breakfast-8",
    title: "Нон с маслом",
    image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400",
    calories: 220,
    time: 5,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["Нон", "Масло", "Мед"],
    description: "Узбекская лепешка с маслом",
    isPopular: true,
  },
  {
    id: "breakfast-9",
    title: "Шавля",
    image: "https://images.unsplash.com/photo-1516714819001-8ee7a13b71d7?w=400",
    calories: 380,
    time: 30,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["Рис", "Мясо", "Морковь", "Лук"],
    description: "Легкий плов на завтрак",
    isPopular: true,
  },
  {
    id: "breakfast-10",
    title: "Яйца с помидорами",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400",
    calories: 200,
    time: 15,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["Яйца", "Помидоры", "Лук", "Специи"],
    description: "Простое и полезное блюдо",
    isPopular: true,
  },
  {
    id: "lunch-1",
    title: "Плов",
    image: "https://images.unsplash.com/photo-1645177628172-a94c30a5460a?w=400",
    calories: 650,
    time: 90,
    difficulty: "Сложно",
    category: "Обед",
    ingredients: ["Рис", "Баранина", "Морковь", "Лук", "Специи"],
    description: "Классический узбекский плов",
    isPopular: true,
  },
  {
    id: "lunch-2",
    title: "Шурпа",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 450,
    time: 120,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["Баранина", "Картофель", "Морковь", "Лук", "Помидоры"],
    description: "Наваристый мясной суп",
    isPopular: true,
  },
  {
    id: "lunch-3",
    title: "Лагман",
    image: "https://images.unsplash.com/photo-1612874742036-e570796f688d?w=400",
    calories: 550,
    time: 60,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["Лапша", "Мясо", "Овощи", "Специи"],
    description: "Лапша с мясом и овощами",
    isPopular: true,
  },
  {
    id: "lunch-4",
    title: "Мантышка",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400",
    calories: 480,
    time: 50,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["Тесто", "Мясо", "Лук", "Тыква"],
    description: "Манты на пару",
    isPopular: true,
  },
  {
    id: "lunch-5",
    title: "Димляма",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    calories: 420,
    time: 80,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["Мясо", "Картофель", "Капуста", "Морковь", "Лук"],
    description: "Тушеное мясо с овощами",
    isPopular: true,
  },
  {
    id: "lunch-6",
    title: "Нарын",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    calories: 520,
    time: 90,
    difficulty: "Сложно",
    category: "Обед",
    ingredients: ["Конина", "Лапша", "Лук", "Специи"],
    description: "Традиционное блюдо с кониной",
    isPopular: true,
  },
  {
    id: "lunch-7",
    title: "Самса с мясом",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    calories: 400,
    time: 45,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["Тесто", "Мясо", "Лук", "Специи"],
    description: "Хрустящая самса с мясной начинкой",
    isPopular: true,
  },
  {
    id: "lunch-8",
    title: "Мастава",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 380,
    time: 60,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["Рис", "Мясо", "Овощи", "Зелень"],
    description: "Густой рисовый суп",
    isPopular: true,
  },
  {
    id: "lunch-9",
    title: "Хасип",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400",
    calories: 500,
    time: 120,
    difficulty: "Сложно",
    category: "Обед",
    ingredients: ["Баранина", "Рис", "Субпродукты", "Специи"],
    description: "Колбаса из баранины",
    isPopular: true,
  },
  {
    id: "lunch-10",
    title: "Шашлык",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400",
    calories: 450,
    time: 40,
    difficulty: "Легко",
    category: "Обед",
    ingredients: ["Баранина", "Лук", "Специи"],
    description: "Мясо на углях",
    isPopular: true,
  },
  {
    id: "dinner-1",
    title: "Салат Ачичук",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    calories: 120,
    time: 10,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["Помидоры", "Лук", "Зелень", "Специи"],
    description: "Легкий овощной салат",
    isPopular: true,
  },
  {
    id: "dinner-2",
    title: "Салат Ташкент",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
    calories: 180,
    time: 15,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["Редька", "Морковь", "Мясо", "Яйца"],
    description: "Сытный салат",
    isPopular: true,
  },
  {
    id: "dinner-3",
    title: "Чалоп",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 150,
    time: 15,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["Катык", "Редис", "Огурцы", "Зелень"],
    description: "Холодный суп на катыке",
    isPopular: true,
  },
  {
    id: "dinner-4",
    title: "Кабоб",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400",
    calories: 350,
    time: 30,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["Фарш", "Лук", "Специи"],
    description: "Котлеты на углях",
    isPopular: true,
  },
  {
    id: "dinner-5",
    title: "Салат из редьки",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    calories: 100,
    time: 10,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["Редька", "Лук", "Масло", "Специи"],
    description: "Острый салат",
    isPopular: true,
  },
  {
    id: "dinner-6",
    title: "Жаркое",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    calories: 380,
    time: 40,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["Мясо", "Картофель", "Лук", "Помидоры"],
    description: "Жареное мясо с картофелем",
    isPopular: true,
  },
  {
    id: "dinner-7",
    title: "Шавит",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 200,
    time: 20,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["Укроп", "Мята", "Базилик", "Катык"],
    description: "Травяной суп",
    isPopular: true,
  },
  {
    id: "dinner-8",
    title: "Хоним",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400",
    calories: 320,
    time: 35,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["Тесто", "Картофель", "Лук", "Масло"],
    description: "Хрустящие чебуреки",
    isPopular: true,
  },
  {
    id: "dinner-9",
    title: "Катык с зеленью",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
    calories: 90,
    time: 5,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["Катык", "Укроп", "Чеснок"],
    description: "Легкий йогурт",
    isPopular: true,
  },
  {
    id: "dinner-10",
    title: "Кутабы",
    image: "https://images.unsplash.com/photo-1612874742036-e570796f688d?w=400",
    calories: 280,
    time: 30,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["Тесто", "Зелень", "Сыр"],
    description: "Тонкие лепешки с начинкой",
    isPopular: true,
  },
];

const CATEGORIES = ["Все", "Завтрак", "Обед", "Ужин"];

export default function RecipesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>(POPULAR_UZBEK_RECIPES);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const filteredRecipes = useMemo(() => {
    if (selectedCategory === "Все") {
      return recipes;
    }
    return recipes.filter((recipe) => recipe.category === selectedCategory);
  }, [selectedCategory, recipes]);

  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: "/recipe-detail",
      params: {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        calories: recipe.calories.toString(),
        time: recipe.time.toString(),
        difficulty: recipe.difficulty,
        category: recipe.category,
        description: recipe.description,
        ingredients: JSON.stringify(recipe.ingredients),
      },
    } as any);
  };

  const handleGenerateRecipe = async () => {
    const sanitizedPrompt = sanitizeString(prompt.trim(), 500);
    if (!sanitizedPrompt) {
      Alert.alert("Ошибка", "Опишите желаемый рецепт");
      return;
    }

    setGenerating(true);
    try {
      const result = await apiService.generateRecipe(sanitizedPrompt);

      setShowGenerateModal(false);
      setPrompt("");

      Alert.alert(
        "Рецепт создан!",
        `Рецепт "${result.recipe.name}" успешно добавлен в ваш рацион.`,
        [
          {
            text: "Посмотреть",
            onPress: () => {
              router.push({
                pathname: "/recipe-detail",
                params: {
                  id: "ai",
                  title: result.recipe.name,
                  image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400",
                  calories: result.recipe.calories?.toString() || "0",
                  time: result.recipe.time?.toString() || "0",
                  difficulty: result.recipe.difficulty || "Легко",
                  category: result.recipe.meal_type || "перекус",
                  description: result.recipe.description || "",
                  ingredients: JSON.stringify(result.recipe.ingredients || []),
                  instructions: JSON.stringify(result.recipe.instructions || []),
                },
              } as any);
            },
          },
          { text: "OK" },
        ]
      );
    } catch (error: any) {
      Alert.alert("Ошибка", error.message || "Не удалось создать рецепт");
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Легко":
        return "#51CF66";
      case "Средне":
        return "#FFD43B";
      case "Сложно":
        return "#FF6B6B";
      default:
        return colors.secondary;
    }
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { width: ADAPTIVE_CARD_WIDTH }]}
      onPress={() => handleRecipePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.recipeImage}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
          <Text style={styles.difficultyText}>{item.difficulty}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.recipeInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="flame" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.calories} ккал</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.time} мин</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Рецепты</Text>
          <Text style={styles.headerSubtitle}>Найдите идеальное блюдо</Text>
        </View>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => setShowGenerateModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          numColumns={ADAPTIVE_COLUMNS}
          key={`grid-${ADAPTIVE_COLUMNS}`}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={ADAPTIVE_COLUMNS > 1 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Рецепты не найдены</Text>
              <Text style={styles.emptySubtext}>Создайте свой первый рецепт!</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showGenerateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowGenerateModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Создать рецепт</Text>
              <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Опишите желаемый рецепт
                </Text>
                <Text style={styles.inputHint}>
                  Например: "Сделай мне завтрак на 300 калорий, у меня есть яйца, молоко и овсянка"
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Опишите тип приёма пищи, калорийность, доступные ингредиенты..."
                  placeholderTextColor={colors.textSecondary}
                  value={prompt}
                  onChangeText={(text) => setPrompt(text)}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  keyboardType="default"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (generating || !prompt.trim()) && styles.submitButtonDisabled,
                ]}
                onPress={handleGenerateRecipe}
                disabled={generating || !prompt.trim()}
                activeOpacity={0.8}
              >
                {generating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Создать рецепт</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 34,
      fontFamily: "Inter_800ExtraBold",
      color: colors.text,
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      opacity: 0.7,
    },
    generateButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? "#2C2C2E" : colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    categoriesWrapper: {
      marginBottom: 24,
      backgroundColor: colors.background,
    },
    categoriesContent: {
      paddingHorizontal: 24,
      gap: 10,
      paddingVertical: 4,
    },
    categoryChip: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: isDark ? "#2C2C2E" : "rgba(0, 0, 0, 0.06)",
      borderWidth: 0,
    },
    categoryChipActive: {
      backgroundColor: isDark ? "#3A3A3C" : colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    categoryText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: isDark ? "#9A9A9E" : "rgba(0, 0, 0, 0.65)",
    },
    categoryTextActive: {
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
    },
    listContent: {
      paddingHorizontal: 24,
      paddingBottom: 100,
    },
    row: {
      justifyContent: "space-between",
      marginBottom: 16,
    },
    recipeCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.08,
      shadowRadius: 12,
      elevation: 5,
      marginBottom: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "transparent",
    },
    imageContainer: {
      width: "100%",
      height: 150,
      position: "relative",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F5F5F5",
    },
    recipeImage: {
      width: "100%",
      height: "100%",
    },
    difficultyBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    difficultyText: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
    },
    cardContent: {
      padding: 14,
      backgroundColor: colors.card,
    },
    recipeTitle: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      marginBottom: 10,
      minHeight: 42,
      lineHeight: 21,
    },
    recipeInfo: {
      flexDirection: "row",
      gap: 16,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    infoText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      marginTop: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalOverlayTouchable: {
      flex: 1,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 24,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    modalBody: {
      maxHeight: 400,
    },
    inputGroup: {
      gap: 8,
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    inputHint: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      backgroundColor: colors.background,
      color: colors.text,
      height: 120,
      textAlignVertical: "top",
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: isDark ? "#2C2C2E" : colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
    },
  });

