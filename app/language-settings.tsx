import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { hapticLight } from "../utils/haptics";
import {
    getUserLanguage,
    setUserLanguage,
    SupportedLanguage
} from "../utils/language";

const LANGUAGES: { id: SupportedLanguage; name: string; flag: string }[] = [
  { id: "ru", name: "Русский", flag: "🇷🇺" },
  { id: "uz", name: "O'zbekcha", flag: "🇺🇿" },
  { id: "en", name: "English", flag: "🇬🇧" },
];

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("en");

  useEffect(() => {
    getUserLanguage().then(setSelectedLang);
  }, []);

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    hapticLight();
    setSelectedLang(lang);
    await setUserLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            router.back();
          }}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Язык приложения</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Выберите язык для отображения продуктов в базе данных
        </Text>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {LANGUAGES.map((lang, index) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageItem,
                index !== LANGUAGES.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? colors.separator : "#F2F2F2",
                },
              ]}
              onPress={() => handleSelectLanguage(lang.id)}
              activeOpacity={0.7}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[styles.languageName, { color: colors.text }]}>
                  {lang.name}
                </Text>
              </View>
              {selectedLang === lang.id && (
                <View style={[styles.checkmark, { backgroundColor: colors.info }]}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Названия продуктов будут отображаться на выбранном языке, если доступен перевод. В противном случае будет показан английский вариант.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    borderRadius: 12,
    overflow: "hidden",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 4,
  },
});
