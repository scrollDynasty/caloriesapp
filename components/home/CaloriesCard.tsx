import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface CaloriesCardProps {
  remainingCalories: number;
}

export const CaloriesCard = memo(function CaloriesCard({ remainingCalories }: CaloriesCardProps) {
  return (
    <View style={styles.caloriesCard}>
      <Text style={styles.caloriesNumber}>{remainingCalories}</Text>
      <Text style={styles.caloriesLabel}>Осталось ккал</Text>
      <Ionicons
        name="flame-outline"
        size={32}
        color={colors.primary}
        style={styles.caloriesIcon}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  caloriesCard: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
  },
  caloriesNumber: {
    fontSize: 64,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Inter_700Bold",
  },
  caloriesLabel: {
    fontSize: 16,
    color: colors.secondary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  caloriesIcon: {
    position: "absolute",
    top: 32,
    right: 32,
  },
});
