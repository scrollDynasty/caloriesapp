import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import { colors } from "../constants/theme";
import { apiService } from "../services/api";
import { setAvatarUri, useAvatarUri } from "../stores/userPreferences";

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const currentAvatarUri = useAvatarUri();
  
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

  useEffect(() => {
    setLocalAvatarUri(currentAvatarUri);
  }, [currentAvatarUri]);

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
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced username check
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
      } catch (error) {
        console.error("Error checking username:", error);
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
    // Validate username
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

      // Update profile on server
      await apiService.updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username.toLowerCase(),
        avatar_url: localAvatarUri,
      });

      // Save avatar locally for tab bar
      await setAvatarUri(localAvatarUri);

      router.back();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert("Ошибка", error.response?.data?.detail || "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }, [data, localAvatarUri, usernameError, router]);

  const handleUsernameChange = (text: string) => {
    // Only allow lowercase letters, numbers, and underscores
    const sanitized = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setData(prev => ({ ...prev, username: sanitized }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const avatarDisplay = localAvatarUri || data.avatarUrl;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
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
              {/* Avatar */}
              <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
                <View style={styles.avatarWrapper}>
                  {avatarDisplay ? (
                    <Image 
                      source={{ uri: avatarDisplay }} 
                      style={styles.avatar} 
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={50} color={colors.secondary} />
                    </View>
                  )}
                  <View style={styles.editBadge}>
                    <Ionicons name="pencil" size={14} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.changePhotoText}>Сменить фото</Text>
              </TouchableOpacity>

              {/* Form */}
              <View style={styles.form}>
                {/* First Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Имя</Text>
                  <TextInput
                    style={styles.input}
                    value={data.firstName}
                    onChangeText={(text) => setData(prev => ({ ...prev, firstName: text }))}
                    placeholder="Введите имя"
                    placeholderTextColor={colors.secondary}
                    autoCapitalize="words"
                  />
                </View>

                {/* Last Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Фамилия</Text>
                  <TextInput
                    style={styles.input}
                    value={data.lastName}
                    onChangeText={(text) => setData(prev => ({ ...prev, lastName: text }))}
                    placeholder="Введите фамилию"
                    placeholderTextColor={colors.secondary}
                    autoCapitalize="words"
                  />
                </View>

                {/* Username */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Имя пользователя</Text>
                  <View style={styles.usernameInputContainer}>
                    <TextInput
                      style={[styles.input, styles.usernameInput]}
                      value={data.username}
                      onChangeText={handleUsernameChange}
                      placeholder="username"
                      placeholderTextColor={colors.secondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {checkingUsername && (
                      <ActivityIndicator size="small" color={colors.secondary} style={styles.usernameIndicator} />
                    )}
                    {!checkingUsername && usernameAvailable === true && data.username.length >= 3 && (
                      <Ionicons name="checkmark-circle" size={22} color="#4CAF50" style={styles.usernameIndicator} />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <Ionicons name="close-circle" size={22} color="#F44336" style={styles.usernameIndicator} />
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

            {/* Save Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || (data.username.length > 0 && data.username.length < 3) || usernameError !== null}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: colors.primary,
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
  // Avatar
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
    backgroundColor: "#F0F0F0",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.secondary,
  },
  // Form
  form: {
    paddingHorizontal: 16,
    gap: 16,
  },
  inputGroup: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.secondary,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: colors.primary,
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
    color: "#F44336",
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4CAF50",
    marginTop: 6,
  },
  // Button
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
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
    color: "#FFFFFF",
  },
});

