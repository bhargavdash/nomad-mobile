import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import RemoteImage from '@components/media/RemoteImage';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { shadows } from '@theme/shadows';
import { spacing } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DestinationCardProps {
  name: string;
  country: string;
  duration: string;
  /** Emoji + label badge derived from the destination's first vibe tag. */
  signal: string;
  /** Server-resolved place image. Null → deterministic Unsplash fallback. */
  imageUrl?: string | null;
  /** Drives the fallback image when imageUrl is null or errors. */
  fallbackQuery: string;
  onPress?: () => void;
}

export default function DestinationCard({
  name,
  country,
  duration,
  signal,
  imageUrl,
  fallbackQuery,
  onPress,
}: DestinationCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, shadows.cardResting, animStyle]}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 150 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      onPress={onPress}
    >
      {/* Photo area — real resolved image with a dark bottom overlay */}
      <RemoteImage src={imageUrl} fallbackQuery={fallbackQuery} style={styles.photoArea}>
        <LinearGradient colors={['transparent', 'rgba(28,25,23,0.85)']} style={styles.overlay} />
      </RemoteImage>

      {/* Card content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.country} numberOfLines={1}>
          {country}
        </Text>
        <Text style={styles.duration}>{duration}</Text>
        <Text style={styles.signal} numberOfLines={1}>
          {signal}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: colors.navy2,
    borderRadius: radius.trendingCard,
    overflow: 'hidden',
  },
  photoArea: {
    height: 110,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    color: colors.white,
  },
  country: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  duration: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: spacing.xs,
  },
  signal: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    color: colors.peach,
    marginTop: spacing.xs,
  },
});
