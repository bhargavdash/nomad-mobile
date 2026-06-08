import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RESEARCH_SOURCES } from '@data/placeholders';
import { useResearchTicker } from '@hooks/useResearchTicker';
import type { PlanModalParamList } from '@navigation/PlanModalNavigator';
import { useTripPlanStore } from '@store/tripPlanStore';
import { colors } from '@theme/colors';
import { spacing, layout } from '@theme/spacing';
import { typography, fontFamily } from '@theme/typography';

// --- Stagger entry animation (same pattern as Home.tsx / PlanTrip.tsx) ---
const STAGGER_DELAYS = [0, 50, 120, 190, 260, 330];

function useStaggeredEntry(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = STAGGER_DELAYS[index] ?? index * 60;
    opacity.value = withTiming(1, { duration: 550, easing: Easing.ease });
    translateY.value = withTiming(0, { duration: 550, easing: Easing.ease });
    // Apply delay by starting from current values and using withDelay equivalent
    const id = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 550, easing: Easing.ease });
      translateY.value = withTiming(0, { duration: 550, easing: Easing.ease });
    }, delay);

    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// --- Sub-components ---

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const SOURCE_PHASE_MAP: Record<string, number> = {
  youtube: 0,
  reddit: 1,
  google: 2,
  blog: 3,
};

function SourceRow({
  label,
  color,
  sourceKey,
  activeSource,
  currentPhase,
}: {
  label: string;
  color: string;
  sourceKey: string;
  activeSource: string;
  currentPhase: number;
}) {
  const phaseIndex = SOURCE_PHASE_MAP[sourceKey] ?? 0;
  const isActive = activeSource === sourceKey;
  const isComplete = currentPhase > phaseIndex;

  return (
    <View style={styles.sourceRow}>
      <View style={[styles.sourceDot, { backgroundColor: color }]} />
      <Text style={[styles.sourceLabel, isComplete && styles.sourceLabelComplete]}>{label}</Text>
      <View style={styles.sourceSpacer} />
      {isActive && (
        <View style={[styles.scanningBadge, { backgroundColor: color }]}>
          <Text style={styles.scanningText}>SCANNING</Text>
        </View>
      )}
      {isComplete && <Text style={styles.sourceCheck}>✓</Text>}
    </View>
  );
}

// --- Main screen ---

export default function ResearchTicker() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<PlanModalParamList>>();
  const route = useRoute<{ key: string; name: 'ResearchTicker'; params: { tripId: string } }>();
  const destination = useTripPlanStore((s) => s.destination);
  const { tripId } = route.params;

  const onComplete = useCallback(() => {
    navigation.replace('ItineraryReveal', { tripId });
  }, [navigation, tripId]);

  const {
    currentPhase,
    progress,
    progressLabel,
    displayProgress,
    stats,
    activeSource,
    currentDiscovery,
    discoveryOpacity,
    hasError,
    isRateLimited,
    retryAfterMs,
    retry,
  } = useResearchTicker(tripId, onComplete);

  // --- Orb animations (must be declared before any conditional return) ---
  const orbScale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (hasError) return;
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    ringScale.value = withRepeat(
      withTiming(1.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
  }, [hasError]); // eslint-disable-line react-hooks/exhaustive-deps

  const orbCoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const orbRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  // --- Progress bar ---
  const [trackWidth, setTrackWidth] = React.useState(0);

  const progressFillStyle = useAnimatedStyle(() => ({
    width: trackWidth > 0 ? (progress.value / 100) * trackWidth : 0,
  }));

  // --- Discovery card ---
  const discoveryStyle = useAnimatedStyle(() => ({
    opacity: discoveryOpacity.value,
  }));

  // --- Staggered section entrance ---
  const titleAnim = useStaggeredEntry(0);
  const orbAnim = useStaggeredEntry(1);
  const progressAnim = useStaggeredEntry(2);
  const statsAnim = useStaggeredEntry(3);
  const discoveryAnim = useStaggeredEntry(4);
  const sourcesAnim = useStaggeredEntry(5);

  const displayName = destination || 'your trip';

  if (isRateLimited) {
    const waitMin = retryAfterMs ? Math.ceil(retryAfterMs / 60_000) : 1;
    return (
      <View
        style={[styles.container, styles.errorContainer, { paddingTop: insets.top + spacing.lg }]}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
        <Text style={styles.rateLimitIcon}>⏱</Text>
        <Text style={styles.errorTitle}>Server is busy</Text>
        <Text style={styles.errorBody}>
          {`Too many requests in a short window. Your trip is saved — wait about ${waitMin} minute${waitMin === 1 ? '' : 's'} and tap retry.`}
        </Text>
        <Pressable onPress={retry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (hasError) {
    return (
      <View
        style={[styles.container, styles.errorContainer, { paddingTop: insets.top + spacing.lg }]}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
        <Text style={styles.rateLimitIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>We couldn&apos;t finish this trip</Text>
        <Text style={styles.errorBody}>
          {
            "The research run didn't complete — this is usually temporary. Your trip details are saved, so you can start a fresh plan or come back to it later."
          }
        </Text>
        <Pressable onPress={() => navigation.navigate('PlanTrip')} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Start a new plan</Text>
        </Pressable>
        <Pressable onPress={() => navigation.getParent()?.goBack()} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>Back to my trips</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* Title */}
      <Animated.View style={[styles.titleSection, titleAnim]}>
        <Text style={styles.title}>Researching {displayName}</Text>
        <Text style={styles.subtitle}>Our AI&apos;s curating your perfect escape</Text>
      </Animated.View>

      {/* Pulsing Orb */}
      <Animated.View style={[styles.orbContainer, orbAnim]}>
        <Animated.View style={[styles.orbRing, orbRingStyle]} />
        <Animated.View style={[styles.orbCore, orbCoreStyle]} />
      </Animated.View>

      {/* Progress Bar */}
      <Animated.View style={[styles.progressSection, progressAnim]}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressMessage} numberOfLines={1}>
            {progressLabel}
          </Text>
          <Text style={styles.progressPercent}>{displayProgress}%</Text>
        </View>
        <View
          style={styles.progressTrack}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
      </Animated.View>

      {/* Stats Row */}
      <Animated.View style={[styles.statsRow, statsAnim]}>
        <StatBox label="PLACES" value={stats.places} />
        <View style={styles.statDivider} />
        <StatBox label="TIPS" value={stats.tips} />
        <View style={styles.statDivider} />
        <StatBox label="PHOTO STOPS" value={stats.photoStops} />
      </Animated.View>

      {/* Live Discovery Card */}
      <Animated.View style={[styles.discoverySection, discoveryAnim]}>
        <Animated.View style={[styles.discoveryCard, discoveryStyle]}>
          <Text style={styles.discoveryLabel}>LIVE DISCOVERY</Text>
          <Text style={styles.discoveryTitle}>{currentDiscovery.title}</Text>
          <Text style={styles.discoveryBody}>{currentDiscovery.body}</Text>
          {(() => {
            const cleanedTags = [
              ...new Set(
                currentDiscovery.tags
                  .map((t) => t.replace(/^[^\p{L}\p{N}\s]+\s*/u, '').trim())
                  .filter(Boolean),
              ),
            ];
            return cleanedTags.length > 0 ? (
              <View style={styles.chipRow}>
                {cleanedTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null;
          })()}
        </Animated.View>
      </Animated.View>

      {/* Scanning Sources */}
      <Animated.View style={[styles.sourcesSection, sourcesAnim]}>
        <Text style={styles.sourcesLabel}>SCANNING SOURCES</Text>
        {RESEARCH_SOURCES.map((src) => (
          <SourceRow
            key={src.key}
            label={src.label}
            color={src.color}
            sourceKey={src.key}
            activeSource={activeSource}
            currentPhase={currentPhase}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const ORB_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: layout.screenPadding,
  },

  // Title
  titleSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displayL,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyM,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Orb
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: ORB_SIZE + 60,
    marginBottom: spacing.xl,
  },
  orbCore: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: colors.navy,
    position: 'absolute',
  },
  orbRing: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.navy,
    position: 'absolute',
  },

  // Progress
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressMessage: {
    ...typography.monoS,
    color: colors.muted,
    flex: 1,
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.navy,
    borderRadius: 3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.displayM,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },

  // Discovery
  discoverySection: {
    marginBottom: spacing.xl,
  },
  discoveryCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  discoveryLabel: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.ember,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  discoveryTitle: {
    ...typography.cardTitle,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  discoveryBody: {
    ...typography.bodyS,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tagChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.cream,
    borderRadius: 100,
  },
  tagChipText: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },

  // Sources
  sourcesSection: {
    marginBottom: spacing.huge,
  },
  sourcesLabel: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  sourceLabel: {
    ...typography.bodyM,
    color: colors.ink,
  },
  sourceLabelComplete: {
    color: colors.muted,
  },
  sourceSpacer: {
    flex: 1,
  },
  scanningBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  scanningText: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 9,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceCheck: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 14,
    color: colors.sage,
  },

  // Error state
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateLimitIcon: {
    fontSize: 48,
    marginBottom: spacing.xl,
  },
  errorTitle: {
    ...typography.displayM,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorBody: {
    ...typography.bodyM,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  retryButton: {
    backgroundColor: colors.navy,
    borderRadius: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
  retryLabel: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
  },
  secondaryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  secondaryLabel: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
});
