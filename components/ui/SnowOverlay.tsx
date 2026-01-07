import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import { useSnow } from "../../context/SnowContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SNOWFLAKE_COUNT = 20;

interface SnowflakeConfig {
  id: number;
  size: number;
  startX: number;
  opacity: number;
  duration: number;
  delay: number;
  wobbleOffset: number;
}

function generateConfig(id: number): SnowflakeConfig {
  return {
    id,
    size: 4 + Math.random() * 6,
    startX: Math.random() * SCREEN_WIDTH,
    opacity: 0.5 + Math.random() * 0.4,
    duration: 10000 + Math.random() * 5000,
    delay: Math.random() * 5000, 
    wobbleOffset: Math.random() * Math.PI * 2,
  };
}

const Snowflake = React.memo(function Snowflake({ config }: { config: SnowflakeConfig }) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let loopRef: Animated.CompositeAnimation | null = null;
    let wobbleLoopRef: Animated.CompositeAnimation | null = null;
    
    timeout = setTimeout(() => {
      loopRef = Animated.loop(
        Animated.timing(fallAnim, { toValue: 1, duration: config.duration, easing: Easing.linear, useNativeDriver: true })
      );
      loopRef.start();
      
      wobbleLoopRef = Animated.loop(
        Animated.timing(wobbleAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
      );
      wobbleLoopRef.start();
    }, config.delay);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (loopRef) loopRef.stop();
      if (wobbleLoopRef) wobbleLoopRef.stop();
      fallAnim.stopAnimation();
      wobbleAnim.stopAnimation();
    };
  }, [fallAnim, wobbleAnim, config.delay, config.duration]);

  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, SCREEN_HEIGHT + 20],
  });

  const translateX = wobbleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 25 * Math.sin(config.wobbleOffset), 0],
  });

  return (
    <Animated.View
      style={[
        styles.snowflake,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          opacity: config.opacity,
          left: config.startX,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
});

export function SnowOverlay() {
  const { isSnowEnabled } = useSnow();

  const snowflakes = useMemo(() => {
    return Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => generateConfig(i));
  }, []);

  if (!isSnowEnabled) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {snowflakes.map((c) => <Snowflake key={c.id} config={c} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  snowflake: {
    position: "absolute",
    top: 0,
    backgroundColor: "#FFFEF5",
  },
});

export default SnowOverlay;
