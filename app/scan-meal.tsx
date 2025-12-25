import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts } from "../hooks/use-fonts";
import { apiService } from "../services/api";

const IVORY_COLOR = "#F5F0E8";

export default function ScanMealScreen() {
  const fontsLoaded = useFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      return () => {
        setCameraActive(false);
        setFlashEnabled(false);
        setScanned(false);
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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      setScannedBarcode(data);
      Alert.alert("Штрих-код отсканирован", `Код: ${data}`, [
        {
          text: "OK",
          onPress: () => setScanned(false),
        },
      ]);
    }
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
    setScanned(false);
    setScannedBarcode(null);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 14 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <View style={styles.headerButtonCircle}>
              <Ionicons name="close" size={24} color="#000" />
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
      {}
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 14 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <View style={styles.headerButtonCircle}>
            <Ionicons name="close" size={24} color="#000" />
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
              size={24}
              color="#000"
            />
          </View>
        </TouchableOpacity>
      </View>

      {}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={flashEnabled && cameraActive}
          onBarcodeScanned={scanned || !cameraActive ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
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
          }}
        />
        
        {}
        <View style={styles.scanArea} pointerEvents="none">
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>

        {}
        <View style={styles.instructionContainer} pointerEvents="none">
          <View style={styles.instructionButton}>
            <Ionicons
              name="scan-outline"
              size={20}
              color="#FFFFFF"
              style={styles.instructionIcon}
            />
            <Text style={styles.instructionText}>Center your food</Text>
          </View>
        </View>
      </View>

      {uploading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingTitle}>Анализируем блюдо...</Text>
            <Text style={styles.loadingSubtitle}>
              AI распознает еду и считает КБЖУ
            </Text>
          </View>
        </View>
      )}

      {}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleGalleryPress}
        >
          <View style={styles.galleryThumbnail}>
            <Ionicons name="images-outline" size={24} color="#000" />
          </View>
        </TouchableOpacity>

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

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleBarcodePress}
        >
          <View style={styles.barcodeIcon}>
            <Ionicons name="barcode-outline" size={24} color="#000" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IVORY_COLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: IVORY_COLOR,
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#000",
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
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
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  instructionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
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
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: IVORY_COLOR,
  },
  resultSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: IVORY_COLOR,
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  controlButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F6F0E6",
    alignItems: "center",
    justifyContent: "center",
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
    borderColor: "#E6DED0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: IVORY_COLOR,
  },
  shutterButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E0D6C8",
  },
  barcodeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F6F0E6",
    alignItems: "center",
    justifyContent: "center",
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
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#000",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: IVORY_COLOR,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  loadingTitle: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#000",
    textAlign: "center",
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#666",
    textAlign: "center",
  },
});
