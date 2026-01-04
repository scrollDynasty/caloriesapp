import LottieView from "lottie-react-native";
import React from "react";
import { View } from "react-native";

interface LottieLoaderProps {
  size?: "small" | "large";
  color?: string;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({ size = "large", color = "#007AFF" }) => {
  const loaderSize = size === "small" ? 50 : 100;

  return (
    <View style={{ width: loaderSize, height: loaderSize }}>
      <LottieView
        source={require("../../assets/animations/loader.json")}
        autoPlay
        loop
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};

LottieLoader.displayName = "LottieLoader";

export { LottieLoader };
export default LottieLoader;
