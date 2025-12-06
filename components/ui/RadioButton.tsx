import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/theme";

interface RadioButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Компонент радио-кнопки для выбора опций
 */
export function RadioButton({ label, selected, onPress }: RadioButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.radioContainer, selected && styles.radioContainerSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.radioText}>{label}</Text>
      {selected && (
        <View style={styles.checkmarkContainer}>
          <View style={styles.checkmark} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0)",
    // Тень из Figma: 0px 2px 8px 0px rgba(0, 0, 0, 0.04)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  radioContainerSelected: {
    backgroundColor: "#F4F2EF",
    borderColor: colors.primary,
    // Тень из Figma: 0px 8px 20px -6px rgba(0, 0, 0, 0.1)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  radioText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 21.78,
    fontFamily: "Inter_600SemiBold",
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 7, // (24 - 10) / 2 = 7
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});

