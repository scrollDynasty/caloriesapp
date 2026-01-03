import { Ionicons } from "@expo/vector-icons";
import FastImage from "react-native-fast-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
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
          Alert.alert("Разрешение", "Разрешите доступ к фотографиям для выбора аватара");
          return;
        }
      } else {
        Alert.alert("Разрешение", "Разрешите доступ к фотографиям в настройках устройства");
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
      Alert.alert("Ошибка", "Username должен быть минимум 3 символа");
      return;
    }

    if (usernameError) {
      Alert.alert("Ошибка", usernameError);
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
          Alert.alert("Ошибка", "Не удалось загрузить фотографию");
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
      Alert.alert("Ошибка", error.response?.data?.detail || "Не удалось сохранить профиль");
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
        <ActivityIndicator size="large" color={colors.accent} />
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
      paddingHorizontal: 16,
      paddingVertical: 12,
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
      fontSize: 17,
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
      paddingBottom: 20,
    },
    avatarContainer: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 32,
    },
    avatarWrapper: {
      position: "relative",
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.fill,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.fill,
      alignItems: "center",
      justifyContent: "center",
    },
    editBadge: {
      position: "absolute",
      bottom: 4,
      right: 4,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.background,
    },
    changePhotoText: {
      marginTop: 12,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    form: {
      paddingHorizontal: 16,
      gap: 16,
    },
    inputGroup: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputLabel: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      fontSize: 16,
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
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.error,
      marginTop: 6,
    },
    successText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.success,
      marginTop: 6,
    },
    buttonContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    saveButton: {
      backgroundColor: colors.buttonPrimary,
      borderRadius: 28,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.buttonPrimaryText,
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
                    <FastImage 
                      source={{ uri: avatarDisplay, priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }} 
                      style={styles.avatar} 
                      resizeMode={FastImage.resizeMode.cover}
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
                      <ActivityIndicator size="small" color={colors.textSecondary} style={styles.usernameIndicator} />
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
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || (data.username.length > 0 && data.username.length < 3) || usernameError !== null}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFF0" />
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
