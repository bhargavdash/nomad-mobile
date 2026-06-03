import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import RemoteImage from '@components/media/RemoteImage';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { shadows } from '@theme/shadows';
import { spacing } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

import type { TripStatus, TripSummary } from '../../types/trip';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_META: Record<TripStatus, { label: string; bg: string; text: string }> = {
  ready: { label: 'Ready', bg: colors.sageLight, text: colors.sage },
  active: { label: 'Active', bg: colors.skyLight, text: colors.sky },
  completed: { label: 'Completed', bg: colors.cream2, text: colors.muted },
  archived: { label: 'Archived', bg: colors.cream2, text: colors.muted },
  researching: { label: 'Researching', bg: colors.emberLight, text: colors.ember },
};

interface TripCardProps {
  trip: TripSummary;
  onPress: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const status = STATUS_META[trip.status];

  return (
    <AnimatedPressable
      style={[styles.card, shadows.cardResting, animStyle]}
      onPressIn={() => {
        scale.value = withTiming(0.985, { duration: 200 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 200 });
      }}
      onPress={onPress}
    >
      <RemoteImage src={trip.heroImageUrl} fallbackQuery={trip.destination} style={styles.thumb} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {trip.destination}
          </Text>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {formatDateRange(trip.dateFrom, trip.dateTo)}
          {trip.durationDays ? ` · ${trip.durationDays} days` : ''}
        </Text>

        <Text style={styles.stats}>
          {trip.statsPlaces} places · {trip.statsTips} tips · {trip.statsPhotoStops} photo stops
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function formatDateRange(from: string | null, to: string | null): string {
  if (!from && !to) return 'Dates not set';
  const fmt = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const left = fmt(from);
  const right = fmt(to);
  if (left && right) return `${left} – ${right}`;
  return left || right;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.iconBox,
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.display,
    fontSize: 17,
    color: colors.ink,
    marginRight: spacing.sm,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  meta: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  stats: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
  },
});
