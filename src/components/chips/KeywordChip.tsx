import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors } from '@theme/colors';
import { fontFamily } from '@theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface KeywordChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  variant?: 'default' | 'terracotta';
}

export default function KeywordChip({
  label,
  active,
  onPress,
  variant = 'default',
}: KeywordChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.98, { duration: 150 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  const getChipStyle = useCallback(() => {
    if (variant === 'terracotta') {
      return active ? styles.chipTerracottaActive : styles.chipTerracottaInactive;
    }
    return active ? styles.chipActive : styles.chipInactive;
  }, [variant, active]);

  const getLabelStyle = useCallback(() => {
    if (variant === 'terracotta') {
      return active ? styles.labelTerracottaActive : styles.labelTerracottaInactive;
    }
    return active ? styles.labelActive : styles.labelInactive;
  }, [variant, active]);

  return (
    <AnimatedPressable
      style={[styles.chip, getChipStyle(), animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[styles.label, getLabelStyle()]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipTerracottaInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  chipTerracottaActive: {
    backgroundColor: colors.ember,
    borderColor: colors.ember,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  labelInactive: {
    color: colors.ink,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelTerracottaInactive: {
    color: colors.ink,
  },
  labelTerracottaActive: {
    color: '#FFFFFF',
  },
});
