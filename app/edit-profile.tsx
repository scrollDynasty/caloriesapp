import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LottieLoader } from "../components/ui/LottieLoader";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";
import { showToast } from "../utils/toast";

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    username: "",
    avatarUrl: null,
  });
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await apiService.getProfile();
      
      setData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username || "",
        avatarUrl: profile.avatar_url || null,
      });
      
      if (profile.avatar_url) {
        setLocalAvatarUri(profile.avatar_url);
      }
    } catch {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data.username || data.username.length < 3) {
      setUsernameError(null);
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingUsername(true);
        const result = await apiService.checkUsername(data.username);
        setUsernameAvailable(result.available);
        setUsernameError(result.available ? null : result.message);
      } catch {

      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [data.username]);

  const handlePickAvatar = async () => {
    if (!galleryPermission?.granted) {
      if (galleryPermission?.canAskAgain) {
        const result = await requestGalleryPermission();
        if (!result.granted) {
          showToast.warning("Разрешите доступ к фотографиям для выбора аватара", "Разрешение");
          return;
        }
      } else {
        showToast.warning("Разрешите доступ к фотографиям в настройках устройства", "Разрешение");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = useCallback(async () => {
    if (data.username && data.username.length < 3) {
      showToast.error("Username должен быть минимум 3 символа");
      return;
    }

    if (usernameError) {
      showToast.error(usernameError);
      return;
    }

    try {
      setSaving(true);

      let avatarUrl = data.avatarUrl;

      if (localAvatarUri && localAvatarUri !== data.avatarUrl && localAvatarUri.startsWith("file://")) {
        try {
          const fileName = localAvatarUri.split("/").pop() || "avatar.jpg";
          const uploadResult = await apiService.uploadAvatar(
            localAvatarUri,
            fileName,
            "image/jpeg"
          );
          avatarUrl = uploadResult.avatar_url;
        } catch {
          showToast.error("Не удалось загрузить фотографию");
          setSaving(false);
          return;
        }
      } else if (localAvatarUri && localAvatarUri !== data.avatarUrl) {
        avatarUrl = localAvatarUri;
      }

      await apiService.updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username.toLowerCase(),
        avatar_url: avatarUrl,
      });

      router.back();
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }, [data, localAvatarUri, usernameError, router]);

  const handleUsernameChange = (text: string) => {
    const sanitized = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setData(prev => ({ ...prev, username: sanitized }));
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <LottieLoader size="large" />
      </SafeAreaView>
    );
  }

  const avatarDisplay = localAvatarUri || data.avatarUrl;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    headerPlaceholder: {
      width: 44,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 12,
    },
    avatarContainer: {
      alignItems: "center",
      marginTop: 12,
      marginBottom: 12,
    },
    avatarWrapper: {
      position: "relative",
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.fill,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.fill,
      alignItems: "center",
      justifyContent: "center",
    },
    editBadge: {
      position: "absolute",
      bottom: 4,
      right: 4,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    changePhotoText: {
      marginTop: 8,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    form: {
      paddingHorizontal: 12,
      gap: 12,
    },
    inputGroup: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputLabel: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    input: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.text,
      padding: 0,
    },
    usernameInputContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    usernameInput: {
      flex: 1,
    },
    usernameIndicator: {
      marginLeft: 8,
    },
    errorText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.error,
      marginTop: 4,
    },
    successText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.success,
      marginTop: 4,
    },
    buttonContainer: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 12,
    },
    saveButton: {
      backgroundColor: isDark ? "#1C1C1E" : colors.buttonPrimary,
      borderRadius: 24,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: isDark ? "#FFFFF0" : colors.buttonPrimaryText,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Редактировать профиль</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {}
              <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
                <View style={styles.avatarWrapper}>
                  {avatarDisplay ? (
                    <Image 
                      source={{ uri: avatarDisplay }} 
                      style={styles.avatar} 
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={50} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.editBadge}>
                    <Ionicons name="pencil" size={14} color="#FFFFF0" />
                  </View>
                </View>
                <Text style={styles.changePhotoText}>Сменить фото</Text>
              </TouchableOpacity>

              {}
              <View style={styles.form}>
                {}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Имя</Text>
                  <TextInput
                    style={styles.input}
                    value={data.firstName}
                    onChangeText={(text) => setData(prev => ({ ...prev, firstName: text }))}
                    placeholder="Введите имя"
                    placeholderTextColor={colors.placeholderText}
                    autoCapitalize="words"
                  />
                </View>

                {}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Фамилия</Text>
                  <TextInput
                    style={styles.input}
                    value={data.lastName}
                    onChangeText={(text) => setData(prev => ({ ...prev, lastName: text }))}
                    placeholder="Введите фамилию"
                    placeholderTextColor={colors.placeholderText}
                    autoCapitalize="words"
                  />
                </View>

                {}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Имя пользователя</Text>
                  <View style={styles.usernameInputContainer}>
                    <TextInput
                      style={[styles.input, styles.usernameInput]}
                      value={data.username}
                      onChangeText={handleUsernameChange}
                      placeholder="username"
                      placeholderTextColor={colors.placeholderText}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {checkingUsername && (
                      <LottieLoader size="small" />
                    )}
                    {!checkingUsername && usernameAvailable === true && data.username.length >= 3 && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.success} style={styles.usernameIndicator} />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <Ionicons name="close-circle" size={22} color={colors.error} style={styles.usernameIndicator} />
                    )}
                  </View>
                  {usernameError && (
                    <Text style={styles.errorText}>{usernameError}</Text>
                  )}
                  {usernameAvailable && data.username.length >= 3 && (
                    <Text style={styles.successText}>Имя пользователя доступно</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {}
            <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || (data.username.length > 0 && data.username.length < 3) || usernameError !== null}
              >
                {saving ? (
                  <LottieLoader size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Продолжить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
