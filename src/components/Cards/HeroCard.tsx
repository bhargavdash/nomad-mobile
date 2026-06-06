import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { shadows } from '@theme/shadows';
import { spacing } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

interface HeroCTACardProps {
  /** Opens the plan modal. */
  onPress: () => void;
}

/** Shown on Home when the user has no active trip — invites them to plan one. */
export default function HeroCard({ onPress }: HeroCTACardProps) {
  return (
    <View style={[styles.card, shadows.cardResting]}>
      <Text style={styles.headline}>
        Your next <Text style={styles.accent}>adventure</Text> begins here.
      </Text>
      <Text style={styles.body}>
        Tell us a vibe — we&apos;ll dig through the YouTube vlogs, Reddit threads, and the blogs
        nobody finds, then write you a day-by-day itinerary.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>Plan a trip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  headline: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
    paddingBottom: 10,
  },
  accent: {
    color: colors.ember,
    fontStyle: 'italic',
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: 18,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ember,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonPressed: {
    backgroundColor: colors.emberDim,
  },
  buttonText: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 14,
    color: colors.white,
  },
});
