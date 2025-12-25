import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    View,
} from "react-native";
import { useSnow } from "../../context/SnowContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNOWFLAKE_COUNT = 80;
const MIN_SIZE = 6;
const MAX_SIZE = 16;
const MIN_DURATION = 6000;
const MAX_DURATION = 12000;
const MIN_OPACITY = 0.6;
const MAX_OPACITY = 1;
const WOBBLE_AMPLITUDE = 40; 

interface SnowflakeConfig {
  id: number;
  size: number;
  startX: number;
  opacity: number;
  duration: number;
  delay: number;
  wobbleOffset: number;
}

function generateSnowflakeConfig(id: number): SnowflakeConfig {
  return {
    id,
    size: Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE,
    startX: Math.random() * SCREEN_WIDTH,
    opacity: Math.random() * (MAX_OPACITY - MIN_OPACITY) + MIN_OPACITY,
    duration: Math.random() * (MAX_DURATION - MIN_DURATION) + MIN_DURATION,
    delay: Math.random() * 5000, 
    wobbleOffset: Math.random() * Math.PI * 2,
  };
}

interface SnowflakeProps {
  config: SnowflakeConfig;
}

function Snowflake({ config }: SnowflakeProps) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const fallAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const wobbleAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startFallingAnimation();
      startWobbleAnimation();
    }, config.delay);

    return () => {
      clearTimeout(timeout);
      fallAnimRef.current?.stop();
      wobbleAnimRef.current?.stop();
      fallAnim.stopAnimation();
      wobbleAnim.stopAnimation();
    };
  }, []);

  const startFallingAnimation = () => {
    fallAnim.setValue(0);
    fallAnimRef.current = Animated.loop(
      Animated.timing(fallAnim, {
        toValue: 1,
        duration: config.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    fallAnimRef.current.start();
  };

  const startWobbleAnimation = () => {
    wobbleAnim.setValue(0);
    wobbleAnimRef.current = Animated.loop(
      Animated.timing(wobbleAnim, {
        toValue: 1,
        duration: 3000, 
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    wobbleAnimRef.current.start();
  };

  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-config.size - 20, SCREEN_HEIGHT + config.size + 20],
  });

  const translateX = wobbleAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      0,
      WOBBLE_AMPLITUDE * Math.sin(config.wobbleOffset),
      0,
      -WOBBLE_AMPLITUDE * Math.sin(config.wobbleOffset + Math.PI / 2),
      0,
    ],
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
}

const MemoizedSnowflake = React.memo(Snowflake);

export function SnowOverlay() {
  const { isSnowEnabled } = useSnow();

  const snowflakes = useMemo(() => {
    return Array.from({ length: SNOWFLAKE_COUNT }, (_, index) =>
      generateSnowflakeConfig(index)
    );
  }, []);

  if (!isSnowEnabled) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {snowflakes.map((config) => (
        <MemoizedSnowflake key={config.id} config={config} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  snowflake: {
    position: "absolute",
    top: 0,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default SnowOverlay;
