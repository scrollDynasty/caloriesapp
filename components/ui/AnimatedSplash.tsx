import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View, useColorScheme } from "react-native";
import { hapticLight, hapticMedium } from "../../utils/haptics";

const { width, height } = Dimensions.get("window");

SplashScreen.preventAutoHideAsync();

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    hapticLight();

    let breathingInterval: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;

    breathingInterval = setInterval(() => {
      hapticLight();
    }, 1600); 

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    timeoutId = setTimeout(() => {
      clearInterval(breathingInterval);
      hapticMedium();
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 600,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(async () => {
        await SplashScreen.hideAsync();
        setIsVisible(false);
        onFinish();
      });
    }, 2500);

    return () => {
      clearInterval(breathingInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isVisible) return null;

  const backgroundColor = isDark ? "#000000" : "#FFFFF0";
  
  let logoSource;
  try {
    logoSource = require("../../assets/images/bright_logo.png");
  } catch (error) {
    console.warn("Logo image not found, using fallback");
    logoSource = null;
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View
        style={[
          styles.glowContainer,
          {
            opacity: glowOpacity,
            transform: [
              { scale: Animated.multiply(scaleAnim, glowScale) },
              { rotate: rotation },
            ],
          },
        ]}
      >
        <View style={styles.glow} />
      </Animated.View>

      {logoSource && (
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: rotation },
              ],
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
    zIndex: 99999,
    elevation: 99999,
  },
  glowContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#FFFFF0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
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
