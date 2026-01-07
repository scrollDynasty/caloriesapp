import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { hapticLight } from "../../utils/haptics";

SplashScreen.preventAutoHideAsync();

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    hapticLight();

    let timeoutId: ReturnType<typeof setTimeout>;

    // Простая анимация появления
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Скрываем через 1.5 секунды
    timeoutId = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(async () => {
        await SplashScreen.hideAsync();
        setIsVisible(false);
        onFinish();
      });
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fadeAnim, scaleAnim, onFinish]);

  if (!isVisible) return null;

  let logoSource;
  try {
    logoSource = require("../../assets/images/bright_logo.png");
  } catch (error) {
    console.warn("Logo image not found, using fallback");
    logoSource = null;
  }

  return (
    <View style={styles.container}>
      {logoSource && (
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image 
            source={logoSource} 
            style={styles.logo} 
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="high"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFF0",
    zIndex: 99999,
    elevation: 99999,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
