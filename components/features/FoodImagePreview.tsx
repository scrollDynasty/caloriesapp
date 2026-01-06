import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface FoodImagePreviewProps {
  imageWidth: number;
  imageHeight: number;
}

export default function FoodImagePreview({
  imageWidth,
  imageHeight,
}: FoodImagePreviewProps) {
  
  const overlayTop1 = (imageHeight / 559) * 167.69;
  const overlayLeft1 = (imageWidth / 374) * 158.61;
  const overlayTop2 = (imageHeight / 559) * 331.36;
  const overlayLeft2 = (imageWidth / 374) * 56.09;
  const cameraTop = (imageHeight / 559) * 247.5;
  const cameraLeft = (imageWidth / 374) * 155;
  const cameraSize = (imageWidth / 374) * 64;
  const iconSize = (imageWidth / 374) * 24;

  return (
    <View
      style={[
        styles.imageContainer,
        {
          width: imageWidth,
          height: imageHeight,
        },
      ]}
    >
      {}
      <Image
        source={require("../../assets/images/food-demo-6453ad.png")}
        style={styles.foodImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {}
      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.1)",
          "rgba(0, 0, 0, 0)",
          "rgba(249, 247, 245, 1)",
        ]}
        locations={[0, 0.5, 0.95]}
        style={StyleSheet.absoluteFill}
      />

      {}
      <View
        style={[
          styles.scanningOverlay,
          {
            top: overlayTop1,
            left: overlayLeft1,
          },
        ]}
      >
        <View style={styles.scanningDot} />
        <Text style={styles.overlayText}>Сканирование...</Text>
      </View>

      {}
      <View
        style={[
          styles.caloriesOverlay,
          {
            top: overlayTop2,
            left: overlayLeft2,
          },
        ]}
      >
        <Text style={styles.overlayText}>340 ккал</Text>
      </View>

      {}
      <BlurView
        intensity={8}
        tint="light"
        style={[
          styles.cameraButton,
          {
            top: cameraTop,
            left: cameraLeft,
            width: cameraSize,
            height: cameraSize,
            borderRadius: cameraSize / 2,
          },
        ]}
      >
        <View
          style={[
            styles.cameraIcon,
            {
              width: iconSize,
              height: iconSize,
            },
          ]}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: Platform.OS === "android" ? 32 : 40,
    overflow: "hidden",
    alignSelf: "center",
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: Platform.OS === "android" ? 8 : 12,
    },
    shadowOpacity: Platform.OS === "android" ? 0.12 : 0.15,
    shadowRadius: Platform.OS === "android" ? 16 : 24,
    elevation: Platform.OS === "android" ? 8 : 12,
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  scanningOverlay: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: Platform.OS === "android" ? 5 : 6,
    paddingHorizontal: Platform.OS === "android" ? 12 : 16,
    paddingVertical: Platform.OS === "android" ? 6 : 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: Platform.OS === "android" ? 16 : 20,
    minWidth: Platform.OS === "android" ? 130 : 159.3, 
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  scanningDot: {
    width: Platform.OS === "android" ? 12 : 14,
    height: Platform.OS === "android" ? 12 : 14,
    borderRadius: Platform.OS === "android" ? 6 : 7,
    borderWidth: Platform.OS === "android" ? 1 : 1.17,
    borderColor: colors.primary,
  },
  overlayText: {
    color: colors.primary,
    fontSize: Platform.OS === "android" ? 12 : 13,
    fontWeight: "600",
    lineHeight: Platform.OS === "android" ? 14.5 : 15.73,
    fontFamily: "Inter_600SemiBold",
  },
  caloriesOverlay: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: Platform.OS === "android" ? 5 : 6,
    paddingHorizontal: Platform.OS === "android" ? 12 : 16,
    paddingVertical: Platform.OS === "android" ? 6 : 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: Platform.OS === "android" ? 16 : 20,
    minWidth: Platform.OS === "android" ? 90 : 110.78, 
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraButton: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    
  },
  cameraIcon: {
    width: Platform.OS === "android" ? 20 : 24,
    height: Platform.OS === "android" ? 20 : 24,
    borderWidth: Platform.OS === "android" ? 1.5 : 2,
    borderColor: colors.buttonPrimaryText,
    borderRadius: Platform.OS === "android" ? 3 : 4,
  },
});

