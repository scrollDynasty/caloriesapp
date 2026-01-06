import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import BaseToast from "react-native-toast-message";
import { useTheme } from "../../context/ThemeContext";

export function CustomToast() {
  const { colors, isDark } = useTheme();

  const toastConfig = {
    success: ({ text1, text2 }: any) => (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "rgba(28, 28, 30, 0.98)" : "rgba(255, 255, 240, 0.98)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
            },
          ]}
        >
          <View style={[styles.accentBar, { backgroundColor: colors.success }]} />
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark" size={18} color={colors.success} />
            </View>
            <View style={styles.textContainer}>
              {text2 && (
                <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
                  {text2}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    ),
    error: ({ text1, text2 }: any) => (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "rgba(28, 28, 30, 0.98)" : "rgba(255, 255, 240, 0.98)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
            },
          ]}
        >
          <View style={[styles.accentBar, { backgroundColor: colors.error }]} />
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.error}15` }]}>
              <Ionicons name="close" size={18} color={colors.error} />
            </View>
            <View style={styles.textContainer}>
              {text2 && (
                <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
                  {text2}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    ),
    info: ({ text1, text2 }: any) => (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "rgba(28, 28, 30, 0.98)" : "rgba(255, 255, 240, 0.98)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
            },
          ]}
        >
          <View style={[styles.accentBar, { backgroundColor: colors.info }]} />
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.info}15` }]}>
              <Ionicons name="information" size={18} color={colors.info} />
            </View>
            <View style={styles.textContainer}>
              {text2 && (
                <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
                  {text2}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    ),
    warning: ({ text1, text2 }: any) => (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "rgba(28, 28, 30, 0.98)" : "rgba(255, 255, 240, 0.98)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
            },
          ]}
        >
          <View style={[styles.accentBar, { backgroundColor: colors.warning }]} />
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="alert" size={18} color={colors.warning} />
            </View>
            <View style={styles.textContainer}>
              {text2 && (
                <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
                  {text2}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    ),
  };

  return <BaseToast config={toastConfig} />;
}

const styles = StyleSheet.create({
  wrapper: {
    width: "88%",
    marginHorizontal: "6%",
    marginTop: Platform.OS === "ios" ? 50 : 20,
  },
  container: {
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  accentBar: {
    width: 3,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    letterSpacing: -0.1,
  },
});

