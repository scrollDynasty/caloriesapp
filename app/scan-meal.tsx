import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";

type BarcodeLookup = {
  barcode: string;
  name: string;
  brand?: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export default function ScanMealScreen() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraMode, setCameraMode] = useState<"photo" | "barcode">("photo");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<BarcodeLookup | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [savingBarcodeMeal, setSavingBarcodeMeal] = useState(false);
  const barcodeLockRef = useRef<string | null>(null);
  const styles = useMemo(() => createStyles(colors, isDark, insets.top), [colors, isDark, insets.top]);

  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      return () => {
        setCameraActive(false);
        setFlashEnabled(false);
        setScanned(false);
        setScannedBarcode(null);
        setBarcodeResult(null);
        setBarcodeError(null);
        setBarcodeLoading(false);
        setCameraMode("photo");
      };
    }, [])
  );

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        "Разрешение камеры",
        "Для сканирования еды необходимо разрешение на использование камеры. Пожалуйста, разрешите доступ в настройках.",
        [{ text: "ОК" }]
      );
    } else if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }

    if (galleryPermission && !galleryPermission.granted && galleryPermission.canAskAgain) {
      requestGalleryPermission();
    }
  }, [permission, galleryPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    const normalized = (data || "").trim();
    if (!normalized || cameraMode !== "barcode") return;
    if (barcodeLockRef.current === normalized) return;
    barcodeLockRef.current = normalized;
    setScanned(true);
    setScannedBarcode(normalized);
    await lookupBarcode(normalized);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || uploading || isProcessingPhoto) {
      if (__DEV__) {
        console.log("Cannot take picture:", { hasCameraRef: !!cameraRef.current, uploading, isProcessingPhoto });
      }
      return;
    }

    try {
      setIsProcessingPhoto(true);
      setUploading(true);
      setCameraActive(false);
      if (__DEV__) console.log("Taking picture...");
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (__DEV__) console.log("Photo taken:", photo?.uri ? "Success" : "Failed");

      if (photo?.uri) {
        await uploadPhoto(photo.uri, scannedBarcode || undefined);
      } else {
        setUploading(false);
        setIsProcessingPhoto(false);
        Alert.alert("Ошибка", "Не удалось сделать фотографию");
      }
    } catch (error: any) {
      if (__DEV__) console.error("Error taking picture:", error);
      setUploading(false);
      setIsProcessingPhoto(false);
      Alert.alert("Ошибка", error.message || "Не удалось сделать фотографию");
    }
  };

  const handleGalleryPress = async () => {
    if (!galleryPermission?.granted) {
      if (galleryPermission?.canAskAgain) {
        const result = await requestGalleryPermission();
        if (!result.granted) {
          Alert.alert(
            "Разрешение галереи",
            "Для выбора фотографий необходимо разрешение на доступ к галерее."
          );
          return;
        }
      } else {
        Alert.alert(
          "Разрешение галереи",
          "Пожалуйста, разрешите доступ к галерее в настройках приложения."
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri, scannedBarcode || undefined);
      }
    } catch (error) {
      if (__DEV__) console.error("Error picking image:", error);
      Alert.alert("Ошибка", "Не удалось выбрать фотографию");
    }
  };

  const getFileInfoFromUri = (uri: string) => {
    const name = uri.split("/").pop() || `photo_${Date.now()}`;
    const ext = name.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
    };
    const mimeType = ext && mimeMap[ext] ? mimeMap[ext] : "image/jpeg";
    const fileName = name.includes(".") ? name : `${name}.jpg`;
    return { fileName, mimeType };
  };

  const lookupBarcode = async (code: string) => {
    setBarcodeError(null);
    setBarcodeResult(null);
    setBarcodeLoading(true);
    try {
      const product = await apiService.lookupBarcode(code);
      setBarcodeResult(product);
    } catch (error: any) {
      setBarcodeError(error?.message || "Не удалось найти продукт");
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleCreateMealFromBarcode = async () => {
    if (!barcodeResult) return;
    const name = barcodeResult.brand
      ? `${barcodeResult.name} (${barcodeResult.brand})`
      : barcodeResult.name;

    setSavingBarcodeMeal(true);
    try {
      await apiService.createManualMeal({
        meal_name: name,
        calories: barcodeResult.calories ?? 0,
        protein: barcodeResult.protein ?? 0,
        fat: barcodeResult.fat ?? 0,
        carbs: barcodeResult.carbs ?? 0,
      });
      Alert.alert("Сохранено", "Блюдо добавлено из штрихкода.");
      router.replace({ pathname: "/(tabs)", params: { refresh: Date.now().toString() } } as any);
    } catch (error: any) {
      Alert.alert("Ошибка", error?.message || "Не удалось сохранить блюдо");
    } finally {
      setSavingBarcodeMeal(false);
    }
  };

  const handleResetBarcode = () => {
    setScanned(false);
    setScannedBarcode(null);
    setBarcodeResult(null);
    setBarcodeError(null);
    setBarcodeLoading(false);
    barcodeLockRef.current = null;
  };

  const enterBarcodeMode = () => {
    setCameraMode("barcode");
    setCameraActive(true);
    handleResetBarcode();
  };

  const exitBarcodeMode = () => {
    setCameraMode("photo");
    handleResetBarcode();
  };

  const uploadPhoto = async (uri: string, barcode?: string) => {
    try {
      setUploading(true);
      setCameraActive(false);
      if (__DEV__) console.log("Starting photo upload, URI:", uri);

      const { fileName, mimeType } = getFileInfoFromUri(uri);

      if (__DEV__) console.log("Uploading file:", fileName, "mimeType:", mimeType, "barcode:", barcode);

      const response = await apiService.uploadMealPhoto(
        uri,
        fileName,
        mimeType,
        barcode
      );

      if (__DEV__) console.log("Photo uploaded successfully:", response);
      
      const imageUrl = apiService.getMealPhotoUrl(
        response.photo.id,
        apiService.getCachedToken() || undefined
      );

      router.replace({
        pathname: "/meal-result",
        params: {
          photoId: response.photo.id.toString(),
          mealName: response.photo.detected_meal_name || response.photo.meal_name || "Блюдо",
          calories: (response.photo.calories || 0).toString(),
          protein: (response.photo.protein || 0).toString(),
          fat: (response.photo.fat || 0).toString(),
          carbs: (response.photo.carbs || 0).toString(),
              fiber: (response.photo.fiber || 0).toString(),
              sugar: (response.photo.sugar || 0).toString(),
              sodium: (response.photo.sodium || 0).toString(),
              healthScore: response.photo.health_score != null ? response.photo.health_score.toString() : "",
          imageUrl: imageUrl,
        },
      } as any);
    } catch (error: any) {
      setIsProcessingPhoto(false);
      if (__DEV__) {
        console.error("Error uploading photo:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
      }
      
      const errorMessage = 
        error.response?.data?.detail || 
        error.response?.data?.message ||
        (error.response?.status === 422 ? "Некорректные данные для загрузки. Проверьте формат файла." : null) ||
        error.message || 
        "Не удалось загрузить фотографию";
      
      Alert.alert("Ошибка", errorMessage);
      setCameraActive(true);
    } finally {
      setUploading(false);
    }
  };

  const handleBarcodePress = () => {
    if (cameraMode === "barcode") {
      exitBarcodeMode();
    } else {
      enterBarcodeMode();
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.headerFloating, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <View style={styles.headerButtonCircle}>
              <Ionicons name="close" size={24} color={colors.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Meal</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Разрешите доступ к камере для сканирования еды
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              Предоставить разрешение
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.cameraWrapper}>
        <View style={styles.headerFloating}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <View style={styles.headerButtonCircle}>
              <Ionicons name="close" size={22} color={colors.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Meal</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleFlash}
          >
            <View style={styles.headerButtonCircle}>
              <Ionicons
                name={flashEnabled ? "flash" : "flash-off"}
                size={20}
                color={colors.text}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={flashEnabled && cameraActive}
            key={cameraMode}
            onBarcodeScanned={
              cameraMode === "barcode" && !scanned && cameraActive
                ? handleBarCodeScanned
                : undefined
            }
            barcodeScannerSettings={
              cameraMode === "barcode"
                ? {
                    barcodeTypes: [
                      "ean13",
                      "ean8",
                      "upc_a",
                      "upc_e",
                      "code128",
                      "code39",
                      "code93",
                      "codabar",
                      "itf14",
                    ],
                  }
                : undefined
            }
          />
          <View style={styles.scanArea} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          <View style={styles.instructionContainer} pointerEvents="none">
            {cameraMode === "photo" ? (
              <View style={styles.instructionButton}>
                <Ionicons
                  name="scan-outline"
                  size={20}
                  color="#FFFFFF"
                  style={styles.instructionIcon}
                />
                <Text style={styles.instructionText}>Center your food</Text>
              </View>
            ) : (
              <View style={styles.instructionButton}>
                <Ionicons
                  name="barcode-outline"
                  size={20}
                  color="#FFFFFF"
                  style={styles.instructionIcon}
                />
                <Text style={styles.instructionText}>Наведи на штрихкод</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {uploading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Анализируем блюдо...</Text>
            <Text style={styles.loadingSubtitle}>
              AI распознает еду и считает КБЖУ
            </Text>
          </View>
        </View>
      )}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, cameraMode === "barcode" && styles.controlDisabled]}
          onPress={handleGalleryPress}
          disabled={cameraMode === "barcode"}
        >
          <View style={styles.galleryThumbnail}>
            <Ionicons name="images-outline" size={24} color={colors.text} />
          </View>
        </TouchableOpacity>

        {cameraMode === "photo" ? (
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={handleTakePicture}
            disabled={uploading || isProcessingPhoto}
          >
            <View style={styles.shutterButtonOuter}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.shutterButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.barcodeModeBadge}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.barcodeModeText}>Сканер штрихкода</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleBarcodePress}
        >
          <View style={styles.barcodeIcon}>
            <Ionicons
              name={cameraMode === "barcode" ? "camera" : "barcode-outline"}
              size={24}
              color={colors.text}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.barcodePanel}>
        <View style={styles.barcodeHeader}>
          <Text style={styles.barcodeTitle}>Штрихкод</Text>
          {scannedBarcode ? (
            <Text style={styles.barcodeValue}>{scannedBarcode}</Text>
          ) : (
            <Text style={styles.barcodeHint}>Наведите камеру на штрихкод товара</Text>
          )}
        </View>

        {barcodeLoading && (
          <View style={styles.barcodeRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.barcodeStatus}>Ищем продукт...</Text>
          </View>
        )}

        {barcodeError ? (
          <View style={styles.barcodeRow}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.barcodeStatus, { color: colors.error }]}>{barcodeError}</Text>
            <TouchableOpacity style={styles.rescanButton} onPress={handleResetBarcode}>
              <Text style={styles.rescanText}>Сканировать снова</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {barcodeResult ? (
          <View style={styles.barcodeResultCard}>
            <Text style={styles.productName}>{barcodeResult.name}</Text>
            {barcodeResult.brand ? (
              <Text style={styles.productBrand}>{barcodeResult.brand}</Text>
            ) : null}
            <View style={styles.macrosRowInline}>
              <View style={styles.macroPill}><Text style={styles.macroPillLabel}>Ккал</Text><Text style={styles.macroPillValue}>{barcodeResult.calories ?? 0}</Text></View>
              <View style={styles.macroPill}><Text style={styles.macroPillLabel}>Белки</Text><Text style={styles.macroPillValue}>{barcodeResult.protein ?? 0}</Text></View>
              <View style={styles.macroPill}><Text style={styles.macroPillLabel}>Жиры</Text><Text style={styles.macroPillValue}>{barcodeResult.fat ?? 0}</Text></View>
              <View style={styles.macroPill}><Text style={styles.macroPillLabel}>Углев.</Text><Text style={styles.macroPillValue}>{barcodeResult.carbs ?? 0}</Text></View>
            </View>
            <TouchableOpacity
              style={[styles.saveBarcodeButton, (savingBarcodeMeal || uploading) && { opacity: 0.7 }]}
              onPress={handleCreateMealFromBarcode}
              disabled={savingBarcodeMeal || uploading}
            >
              {savingBarcodeMeal ? (
                <ActivityIndicator color={colors.buttonPrimaryText} />
              ) : (
                <Text style={styles.saveBarcodeText}>Добавить в дневник</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
const createStyles = (colors: any, isDark: boolean, insetTop: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    cameraWrapper: {
      flex: 1,
      position: "relative",
      paddingTop: insetTop + 6,
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    headerFloating: {
      position: "absolute",
      top: insetTop + 6,
      left: 20,
      right: 20,
      zIndex: 5,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerButtonCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    cameraContainer: {
      flex: 1,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: "#000",
      position: "relative",
    },
    camera: {
      flex: 1,
    },
    scanArea: {
      position: "absolute",
      top: 40,
      left: 40,
      right: 40,
      bottom: 40,
      zIndex: 1,
    },
    corner: {
      position: "absolute",
      width: 40,
      height: 40,
      borderColor: "#FFFFFF",
      borderWidth: 3,
    },
    cornerTopLeft: {
      top: 0,
      left: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    cornerTopRight: {
      top: 0,
      right: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
    },
    cornerBottomLeft: {
      bottom: 0,
      left: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
    },
    cornerBottomRight: {
      bottom: 0,
      right: 0,
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
    instructionContainer: {
      position: "absolute",
      bottom: 28,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 1,
    },
    instructionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 8,
    },
    instructionIcon: {
      marginRight: 4,
    },
    instructionText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 28,
      paddingVertical: 18,
      backgroundColor: colors.background,
    },
    controlButton: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    controlDisabled: {
      opacity: 0.45,
    },
    galleryThumbnail: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    shutterButton: {
      width: 80,
      height: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    shutterButtonOuter: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 6,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    shutterButtonInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
    },
    barcodeModeBadge: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 160,
      justifyContent: "center",
    },
    barcodeModeText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    barcodeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    permissionContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    permissionText: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      textAlign: "center",
      marginBottom: 24,
    },
    permissionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
    },
    permissionButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    },
    loadingCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      marginHorizontal: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.2 : 0.3,
      shadowRadius: 16,
      elevation: isDark ? 6 : 10,
    },
    loadingTitle: {
      marginTop: 20,
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
      textAlign: "center",
    },
    loadingSubtitle: {
      marginTop: 8,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      textAlign: "center",
    },
    barcodePanel: {
      paddingHorizontal: 20,
      paddingBottom: 18,
      backgroundColor: colors.background,
      gap: 10,
    },
    barcodeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    barcodeTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    barcodeValue: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.textSecondary,
    },
    barcodeHint: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    barcodeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    barcodeStatus: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.text,
    },
    rescanButton: {
      marginLeft: "auto",
    },
    rescanText: {
      color: colors.primary,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    barcodeResultCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: isDark ? 0 : 2,
    },
    productName: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    productBrand: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    macrosRowInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    macroPill: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 72,
    },
    macroPillLabel: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    macroPillValue: {
      marginTop: 4,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    saveBarcodeButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
    },
    saveBarcodeText: {
      color: colors.buttonPrimaryText,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
  });
