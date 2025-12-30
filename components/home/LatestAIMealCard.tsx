import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const IVORY = "#F5F0E8";
const IVORY_DARK = "#E6DED0";
const TEXT_PRIMARY = "#2D2A26";
const TEXT_SECONDARY = "#5A5247";

export type LatestMealProps = {
  title: string;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  imageUrl?: string;
};

export const LatestAIMealCard: React.FC<LatestMealProps> = ({
  title,
  calories,
  protein,
  fat,
  carbs,
  imageUrl,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={36} color={TEXT_SECONDARY} />
            <Text style={styles.placeholderText}>Фото блюда</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title || "Блюдо"}</Text>
        <View style={styles.badges}>
          <View style={styles.kcalBadge}>
            <Text style={styles.kcalValue}>{calories ?? "—"}</Text>
            <Text style={styles.kcalLabel}>ккал</Text>
          </View>
          <View style={styles.macrosRow}>
            <MacroPill label="Белки" value={protein} />
            <MacroPill label="Жиры" value={fat} />
            <MacroPill label="Углев." value={carbs} />
          </View>
        </View>
      </View>
    </View>
  );
};

const MacroPill: React.FC<{ label: string; value?: number | null }> = ({ label, value }) => (
  <View style={styles.pill}>
    <Text style={styles.pillValue}>{value ?? "—"}S</Text>
    <Text style={styles.pillLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: IVORY,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  imageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: IVORY_DARK,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: TEXT_PRIMARY,
  },
  badges: {
    gap: 10,
  },
  kcalBadge: {
    backgroundColor: "#FFFFF0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  kcalValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: TEXT_PRIMARY,
  },
  kcalLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: TEXT_SECONDARY,
  },
  macrosRow: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    backgroundColor: "#FFFFF0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
  },
  pillValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: TEXT_PRIMARY,
  },
  pillLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: TEXT_SECONDARY,
  },
});
