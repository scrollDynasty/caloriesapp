import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LottieLoader } from "../components/ui/LottieLoader";
import { useProcessingMeals } from "../context/ProcessingMealsContext";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "../hooks/use-fonts";
import type { BarcodeLookup } from "../services/api";
import { apiService } from "../services/api";
import { showToast } from "../utils/toast";

export default function ScanMealScreen() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { addProcessingMeal } = useProcessingMeals();
  const [permission, requestPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraMode, setCameraMode] = useState<"photo" | "barcode">((params.mode as "photo" | "barcode") || "photo");
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
      showToast.warning(
        "Для сканирования еды необходимо разрешение на использование камеры. Пожалуйста, разрешите доступ в настройках.",
        "Разрешение камеры"
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
    if (!cameraRef.current) {
      return;
    }

    try {
      setCameraActive(false);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        const { fileName, mimeType } = getFileInfoFromUri(photo.uri);
        
        addProcessingMeal(photo.uri, fileName, mimeType, scannedBarcode || undefined);
        
        router.replace({ 
          pathname: "/(tabs)", 
          params: { refresh: Date.now().toString() } 
        } as any);
      } else {
        showToast.error("Не удалось сделать фотографию");
        setCameraActive(true);
      }
    } catch (error: any) {
      showToast.error(error.message || "Не удалось сделать фотографию");
      setCameraActive(true);
    }
  };

  const handleGalleryPress = async () => {
    if (!galleryPermission?.granted) {
      if (galleryPermission?.canAskAgain) {
        const result = await requestGalleryPermission();
        if (!result.granted) {
          showToast.warning(
            "Для выбора фотографий необходимо разрешение на доступ к галерее.",
            "Разрешение галереи"
          );
          return;
        }
      } else {
        showToast.warning(
          "Пожалуйста, разрешите доступ к галерее в настройках приложения.",
          "Разрешение галереи"
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
        const { fileName, mimeType } = getFileInfoFromUri(result.assets[0].uri);
        
        addProcessingMeal(result.assets[0].uri, fileName, mimeType, scannedBarcode || undefined);
        
        router.replace({ 
          pathname: "/(tabs)", 
          params: { refresh: Date.now().toString() } 
        } as any);
      }
    } catch {
      showToast.error("Не удалось выбрать фотографию");
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
        fiber: barcodeResult.fiber ?? 0,
        sugar: barcodeResult.sugar ?? 0,
        sodium: barcodeResult.sodium ?? 0,
        health_score: barcodeResult.health_score ?? null,
      });
      router.replace({ pathname: "/(tabs)", params: { refresh: Date.now().toString() } } as any);
    } catch (error: any) {
      showToast.error(error?.message || "Не удалось сохранить блюдо");
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
        <LottieLoader size="large" />
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

          {cameraMode === "photo" && (
            <View style={styles.scanArea} pointerEvents="none">
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          )}

          {cameraMode === "barcode" && (
            <View style={styles.barcodeIndicator} pointerEvents="none">
              <View style={styles.barcodeCircle}>
                <Ionicons name="barcode-outline" size={40} color="#FFFFF0" />
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.shutterButton}
          onPress={handleTakePicture}
        >
          <View style={styles.shutterButtonOuter}>
            <View style={styles.shutterButtonInner} />
          </View>
        </TouchableOpacity>
      </View>

      {cameraMode === "barcode" && (
        <View style={styles.barcodePanel}>
          {barcodeLoading && (
            <View style={styles.barcodeRow}>
              <LottieLoader size="small" />
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
                style={[styles.saveBarcodeButton, savingBarcodeMeal && { opacity: 0.7 }]}
                onPress={handleCreateMealFromBarcode}
                disabled={savingBarcodeMeal}
              >
                {savingBarcodeMeal ? (
                  <LottieLoader size="small" />
                ) : (
                  <Text style={styles.saveBarcodeText}>Добавить в дневник</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
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
      paddingTop: insetTop + 8,
      paddingHorizontal: 0,
      paddingBottom: 0,
      backgroundColor: "#000",
    },
    headerFloating: {
      position: "absolute",
      top: insetTop + 8,
      left: 16,
      right: 16,
      zIndex: 10,
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
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0,
      borderColor: "transparent",
    },
    headerTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
    },
    cameraContainer: {
      flex: 1,
      borderRadius: 0,
      overflow: "hidden",
      backgroundColor: "#000000",
      position: "relative",
    },
    camera: {
      flex: 1,
    },
    scanArea: {
      position: "absolute",
      top: 60,
      left: 40,
      right: 40,
      bottom: 100,
      zIndex: 2,
    },
    corner: {
      position: "absolute",
      width: 32,
      height: 32,
      borderColor: "#FFFFFF",
      borderWidth: 2,
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
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 2,
    },
    barcodeIndicator: {
      position: "absolute",
      bottom: 100,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 2,
    },
    barcodeCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: "rgba(255, 255, 240, 0.6)",
    },
    instructionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 8,
    },
    instructionIcon: {
      marginRight: 2,
    },
    instructionText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 0,
      paddingVertical: 8,
      paddingBottom: 50,
      backgroundColor: "transparent",
      gap: 0,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    controlButton: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    controlDisabled: {
      opacity: 0.35,
    },
    galleryThumbnail: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0,
      borderColor: "transparent",
    },
    shutterButton: {
      width: 76,
      height: 76,
      alignItems: "center",
      justifyContent: "center",
    },
    shutterButtonOuter: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 4,
      borderColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    shutterButtonInner: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
    },
    barcodeModeBadge: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 0,
      borderColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 140,
      justifyContent: "center",
    },
    barcodeModeText: {
      color: colors.text,
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    barcodeIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0,
      borderColor: "transparent",
    },
    permissionContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    permissionText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      textAlign: "center",
      marginBottom: 24,
    },
    permissionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 10,
    },
    permissionButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    barcodePanel: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      paddingBottom: 12,
      backgroundColor: colors.background,
      gap: 6,
    },
    barcodeHeader: {
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      gap: 3,
    },
    barcodeTitle: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    barcodeValue: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
    barcodeHint: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
    },
    barcodeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingTop: 2,
    },
    barcodeStatus: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.text,
      flex: 1,
    },
    rescanButton: {
      marginLeft: "auto",
      paddingHorizontal: 8,
    },
    rescanText: {
      color: colors.primary,
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
    },
    barcodeResultCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 10,
      borderWidth: 0,
      borderColor: "transparent",
      gap: 6,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0 : 0.02,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: isDark ? 0 : 1,
      marginTop: 2,
    },
    productName: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    productBrand: {
      fontSize: 10,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
      marginTop: -2,
    },
    macrosRowInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexWrap: "wrap",
      marginTop: 3,
    },
    macroPill: {
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 0,
      borderColor: "transparent",
      minWidth: 54,
      alignItems: "center",
    },
    macroPillLabel: {
      fontSize: 9,
      fontFamily: "Inter_500Medium",
      color: colors.textSecondary,
    },
    macroPillValue: {
      marginTop: 1,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    saveBarcodeButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 9,
      alignItems: "center",
      marginTop: 3,
    },
    saveBarcodeText: {
      color: colors.buttonPrimaryText,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
    },
  });
