import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    image: string;
    calories: string;
    time: string;
    difficulty: string;
    category: string;
    description: string;
    ingredients: string;
    instructions?: string;
  }>();

  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const ingredients = params.ingredients ? JSON.parse(params.ingredients) : [];
  const instructions = params.instructions ? JSON.parse(params.instructions) : [];

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Рецепт</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: params.image }}
            style={styles.recipeImage}
            contentFit="cover"
          />
          <View style={styles.imageOverlay}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(params.difficulty || "Легко") }]}>
              <Text style={styles.difficultyText}>{params.difficulty || "Легко"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{params.title}</Text>
          <Text style={styles.description}>{params.description}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="flame" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{params.calories}</Text>
                <Text style={styles.statLabel}>ккал</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{params.time}</Text>
                <Text style={styles.statLabel}>минут</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{params.category}</Text>
                <Text style={styles.statLabel}>категория</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ингредиенты</Text>
            <View style={styles.ingredientsList}>
              {ingredients.map((ingredient: string, index: number) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={[styles.ingredientDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Приготовление</Text>
            {instructions.length > 0 ? (
              <View style={styles.instructionsList}>
                {instructions.map((instruction: string, index: number) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.instructionsText}>
                Подробные инструкции по приготовлению этого блюда будут доступны в следующей версии приложения.
                {"\n\n"}
                Пока что вы можете использовать этот рецепт как источник вдохновения для создания здорового и вкусного блюда!
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
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
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    imageContainer: {
      width: "100%",
      height: 300,
      position: "relative",
    },
    recipeImage: {
      width: "100%",
      height: "100%",
    },
    imageOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "flex-start",
      alignItems: "flex-end",
      padding: 16,
    },
    difficultyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    difficultyText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
    },
    content: {
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 32,
      paddingVertical: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
    },
    statItem: {
      alignItems: "center",
      gap: 8,
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      textAlign: "center",
    },
    statLabel: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      marginBottom: 16,
    },
    ingredientsList: {
      gap: 12,
    },
    ingredientItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
    },
    ingredientDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    ingredientText: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      flex: 1,
    },
    instructionsText: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      lineHeight: 24,
    },
    instructionsList: {
      gap: 16,
    },
    instructionItem: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    instructionNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    instructionNumberText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
    },
    instructionText: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      lineHeight: 24,
      flex: 1,
    },
  });

