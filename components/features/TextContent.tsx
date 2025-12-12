import { StyleSheet, Text, View } from "react-native";

interface TextContentProps {
  title: string;
  subtitle: string;
}

export default function TextContent({ title, subtitle }: TextContentProps) {
  return (
    <View style={styles.textWrapper}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  textWrapper: {
    alignItems: "center",
    gap: 8, 
    marginBottom: 0,
  },
  title: {
    color: "#2D2A26",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24.2,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    flexShrink: 0,
  },
  subtitle: {
    color: "#8C867D",
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 18.15,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    flexShrink: 0,
  },
});

