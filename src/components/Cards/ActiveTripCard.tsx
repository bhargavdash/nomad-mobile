import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import RemoteImage from '@components/media/RemoteImage';
import { colors, darkText, statusBadge } from '@theme/colors';
import { radius } from '@theme/radius';
import { shadows } from '@theme/shadows';
import { spacing } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActiveTripCardProps {
  destination: string;
  dateFrom: string;
  dateTo: string;
  duration: number;
  heroImageUrl?: string | null;
  onPress?: () => void;
}

export default function ActiveTripCard({
  destination,
  dateFrom,
  dateTo,
  duration,
  heroImageUrl,
  onPress,
}: ActiveTripCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, shadows.activeTripCard, animStyle]}
      onPressIn={() => {
        scale.value = withTiming(0.985, { duration: 200 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 200 });
      }}
      onPress={onPress}
    >
      {/* Hero photo — full-bleed background */}
      <RemoteImage
        src={heroImageUrl}
        fallbackQuery={destination}
        style={StyleSheet.absoluteFill}
        priority="high"
      />
      {/* Subtle scrim — transparent top, light navy at bottom for text legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(27,43,75,0.35)', 'rgba(27,43,75,0.65)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Status badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>● Active trip</Text>
        </View>

        {/* Trip title */}
        <Text style={styles.title}>{destination}</Text>

        {/* Meta */}
        <Text style={styles.meta}>
          {dateFrom} – {dateTo} · {duration} days
        </Text>

        {/* Inner CTA */}
        <View style={styles.cta}>
          <Text style={styles.ctaText}>View full itinerary</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: radius.activeTripCard,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 260,
    justifyContent: 'flex-end',
  },
  content: {
    padding: spacing.lg,
    position: 'relative',
  },
  badge: {
    backgroundColor: statusBadge.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 10,
    color: statusBadge.text,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: 18,
    color: darkText.primary,
  },
  meta: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: darkText.meta,
    marginTop: 3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: spacing.md,
  },
  ctaText: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    color: darkText.primary,
  },
  ctaArrow: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});
