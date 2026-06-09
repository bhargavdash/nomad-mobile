import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@theme/colors';
import { shadows } from '@theme/shadows';
import { spacing, layout } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

import type { RootStackParamList } from '../navigation/RootNavigator';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function InTripCompanion() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Today</Text>
      </View>

      <View style={styles.emptyState}>
        <View style={styles.iconRing}>
          <Feather name="map-pin" size={28} color={colors.ember} />
        </View>

        <Text style={styles.emptyTitle}>No active trip</Text>
        <Text style={styles.emptyBody}>
          {"Once you're on a trip, your daily stops,"}
          {'\n'}
          timings, and highlights appear here.
        </Text>

        <AnimatedPressable
          style={[styles.ctaButton, shadows.cardResting, animStyle]}
          onPressIn={() => {
            scale.value = withTiming(0.98, { duration: 150 });
          }}
          onPressOut={() => {
            scale.value = withTiming(1, { duration: 150 });
          }}
          onPress={() => navigation.navigate('PlanModal')}
        >
          <Feather name="plus" size={16} color={colors.cream} />
          <Text style={styles.ctaLabel}>Plan a trip</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    color: colors.ink,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 60,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.emberLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xxl,
    borderRadius: 100,
  },
  ctaLabel: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 15,
    color: colors.cream,
  },
});
