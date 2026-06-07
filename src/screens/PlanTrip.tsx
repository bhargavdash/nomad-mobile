import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AxiosError } from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Image,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@components/buttons/PrimaryButton';
import KeywordChip from '@components/chips/KeywordChip';
import DateRangePicker from '@components/Forms/DateRangePicker';
import LocationSearchInput from '@components/Forms/LocationSearchInput';
import {
  VIBE_CATEGORIES,
  ACCOMMODATION_OPTIONS,
  PACE_OPTIONS,
  BUDGET_TIERS,
  TRAVELER_OPTIONS,
} from '@data/placeholders';
import { api } from '@lib/api';
import type { PlanModalParamList } from '@navigation/PlanModalNavigator';
import {
  useTripPlanStore,
  type AccommodationType,
  type PaceType,
  type BudgetTier,
  type TravelerCount,
} from '@store/tripPlanStore';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing, layout } from '@theme/spacing';
import { fontFamily, typography } from '@theme/typography';

// --- Staggered entry animation (same pattern as Home.tsx) ---

const STAGGER_DELAYS = [0, 50, 120, 190, 260, 330, 400, 470];

function useStaggeredEntry(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = STAGGER_DELAYS[index] ?? index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 550, easing: Easing.ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 550, easing: Easing.ease }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// --- Accommodation Card (local component) ---

interface AccommodationCardProps {
  icon: string;
  label: string;
  desc: string;
  active: boolean;
  onPress: () => void;
}

function AccommodationCard({ icon, label, desc, active, onPress }: AccommodationCardProps) {
  return (
    <Pressable
      style={[
        styles.accommodationCard,
        active ? styles.accommodationCardActive : styles.accommodationCardInactive,
      ]}
      onPress={onPress}
    >
      <Text style={styles.accommodationIcon}>{icon}</Text>
      <Text style={[styles.accommodationLabel, active && styles.accommodationLabelActive]}>
        {label}
      </Text>
      <Text style={[styles.accommodationDesc, active && styles.accommodationDescActive]}>
        {desc}
      </Text>
    </Pressable>
  );
}

// --- Main Screen ---

export default function PlanTrip() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<PlanModalParamList>>();
  const route = useRoute<RouteProp<PlanModalParamList, 'PlanTrip'>>();
  const trendingPick = route.params?.trendingPick ?? null;

  // Zustand store
  const destination = useTripPlanStore((s) => s.destination);
  const dates = useTripPlanStore((s) => s.dates);
  const travelers = useTripPlanStore((s) => s.travelers);
  const selectedVibes = useTripPlanStore((s) => s.selectedVibes);
  const accommodation = useTripPlanStore((s) => s.accommodation);
  const pace = useTripPlanStore((s) => s.pace);
  const budget = useTripPlanStore((s) => s.budget);
  const preferences = useTripPlanStore((s) => s.preferences);

  const setDestination = useTripPlanStore((s) => s.setDestination);
  const setDates = useTripPlanStore((s) => s.setDates);
  const setTravelers = useTripPlanStore((s) => s.setTravelers);
  const toggleVibe = useTripPlanStore((s) => s.toggleVibe);
  const setAccommodation = useTripPlanStore((s) => s.setAccommodation);
  const setPace = useTripPlanStore((s) => s.setPace);
  const setBudget = useTripPlanStore((s) => s.setBudget);
  const setPreferences = useTripPlanStore((s) => s.setPreferences);
  const setCurrentTripId = useTripPlanStore((s) => s.setCurrentTripId);
  const reset = useTripPlanStore((s) => s.reset);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteDismissed, setNoteDismissed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Web parity: a trip needs a destination, a traveler count, and a date range.
  const missingFields: string[] = [];
  if (!destination.trim()) missingFields.push('destination');
  if (!travelers) missingFields.push('traveler count');
  if (!dates.from || !dates.to) missingFields.push('travel dates');
  const isValid = missingFields.length === 0;

  // Reset store when modal is dismissed
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      reset();
    });
    return unsubscribe;
  }, [navigation, reset]);

  // Prefill the destination from a trending deep-link (web parity: destination
  // only, and only when empty so we never clobber what the user has typed).
  useEffect(() => {
    if (!trendingPick) return;
    if (destination.trim()) return;
    setDestination(`${trendingPick.name}, ${trendingPick.country}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendingPick]);

  // Staggered animations
  const headerAnim = useStaggeredEntry(0);
  const essentialsAnim = useStaggeredEntry(1);
  const vibesAnim = useStaggeredEntry(2);
  const accommodationAnim = useStaggeredEntry(3);
  const paceAnim = useStaggeredEntry(4);
  const budgetAnim = useStaggeredEntry(5);
  const preferencesAnim = useStaggeredEntry(6);

  const scrollRef = useRef<ScrollView>(null);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePlanTrip = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const durationDays =
        dates.from && dates.to
          ? Math.max(
              1,
              Math.round(
                (new Date(dates.to).getTime() - new Date(dates.from).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : null;

      const res = await api.post('/trips', {
        destination: destination.trim(),
        date_from: dates.from,
        date_to: dates.to,
        duration_days: durationDays,
        travelers,
        vibes: selectedVibes,
        accommodation,
        pace,
        budget,
        preferences: preferences.trim() || undefined,
      });

      const { trip } = res.data as { trip: { id: string }; research_job: unknown };
      setCurrentTripId(trip.id);
      navigation.navigate('ResearchTicker', { tripId: trip.id });
    } catch (err) {
      console.error('[PlanTrip] POST /trips failed:', err);
      const status = (err as AxiosError)?.response?.status;
      if (status === 429) {
        const retryAfter = (err as AxiosError)?.response?.headers?.['retry-after'];
        const waitMin = retryAfter ? Math.ceil(parseInt(retryAfter as string, 10) / 60) : 60;
        setSubmitError(
          `Trip limit reached — you've planned 10 trips this hour. Try again in about ${waitMin} minute${waitMin === 1 ? '' : 's'}.`,
        );
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    dates,
    destination,
    travelers,
    selectedVibes,
    accommodation,
    pace,
    budget,
    preferences,
    setCurrentTripId,
    navigation,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <Animated.View style={[styles.header, headerAnim]}>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Plan Your Trip</Text>
          </Animated.View>

          {/* ── Hero Image ── */}
          <View style={styles.heroContainer}>
            <Image
              source={require('../assets/plan_your_trip_hero_icon.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Where to next?</Text>
              <Text style={styles.heroSubtitle}>{"Let's curate your perfect escape."}</Text>
            </View>
          </View>

          {/* ── Trending pick note (Home deep-link) ── */}
          {trendingPick && !noteDismissed && (
            <View style={styles.trendingNote}>
              <View style={styles.trendingNoteHead}>
                <View style={styles.trendingNoteEyebrowChip}>
                  <Text style={styles.trendingNoteEyebrow}>✦ From the trending picks</Text>
                </View>
                <Pressable onPress={() => setNoteDismissed(true)} hitSlop={10}>
                  <Text style={styles.trendingNoteDismiss}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.trendingNoteTitle}>
                {trendingPick.name}
                {trendingPick.country && trendingPick.country !== trendingPick.name ? (
                  <Text style={styles.trendingNoteCountry}> · {trendingPick.country}</Text>
                ) : null}
              </Text>
              <Text style={styles.trendingNoteMeta}>
                {trendingPick.duration} · pre-filled below
              </Text>
              {trendingPick.blurb ? (
                <Text style={styles.trendingNoteBlurb}>{`"${trendingPick.blurb}"`}</Text>
              ) : null}
              {trendingPick.vibes.length > 0 && (
                <View style={styles.trendingNoteVibes}>
                  {trendingPick.vibes.map((v) => (
                    <View key={v} style={styles.trendingNoteVibe}>
                      <Text style={styles.trendingNoteVibeText}>{v}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── The Essentials ── */}
          <Animated.View style={essentialsAnim}>
            <Text style={styles.sectionLabel}>The Essentials</Text>

            {/* Destination */}
            <LocationSearchInput
              value={destination}
              onSelect={setDestination}
              placeholder="Where do you want to go?"
              scrollViewRef={scrollRef}
            />

            {/* Dates */}
            <Text style={styles.fieldLabel}>Travel dates</Text>
            <DateRangePicker dates={dates} setDates={setDates} />

            {/* Travelers */}
            <Text style={styles.fieldLabel}>Travelers</Text>
            <View style={styles.chipRow}>
              {TRAVELER_OPTIONS.map((opt) => (
                <KeywordChip
                  key={opt.value}
                  label={opt.label}
                  active={travelers === opt.value}
                  onPress={() => setTravelers(opt.value as TravelerCount)}
                />
              ))}
            </View>
          </Animated.View>

          {/* ── What's your vibe? ── */}
          <Animated.View style={vibesAnim}>
            <Text style={styles.sectionLabel}>{"What's your vibe?"}</Text>
            {VIBE_CATEGORIES.map((category) => (
              <View key={category.label} style={styles.vibeCategory}>
                <Text style={styles.vibeCategoryLabel}>{category.label}</Text>
                <View style={styles.chipRow}>
                  {category.vibes.map((vibe) => (
                    <KeywordChip
                      key={vibe}
                      label={vibe}
                      active={selectedVibes.includes(vibe)}
                      onPress={() => toggleVibe(vibe)}
                      variant="terracotta"
                    />
                  ))}
                </View>
              </View>
            ))}
          </Animated.View>

          {/* ── Accommodation ── */}
          <Animated.View style={accommodationAnim}>
            <Text style={styles.sectionLabel}>Accommodation</Text>
            <View style={styles.accommodationGrid}>
              {ACCOMMODATION_OPTIONS.map((opt) => (
                <AccommodationCard
                  key={opt.label}
                  icon={opt.icon}
                  label={opt.label}
                  desc={opt.desc}
                  active={accommodation === opt.label}
                  onPress={() => setAccommodation(opt.label as AccommodationType)}
                />
              ))}
            </View>
          </Animated.View>

          {/* ── The Pace ── */}
          <Animated.View style={paceAnim}>
            <Text style={styles.sectionLabel}>The Pace</Text>
            <View style={styles.chipRow}>
              {PACE_OPTIONS.map((opt) => (
                <KeywordChip
                  key={opt}
                  label={opt}
                  active={pace === opt}
                  onPress={() => setPace(opt as PaceType)}
                />
              ))}
            </View>
          </Animated.View>

          {/* ── The Budget ── */}
          <Animated.View style={budgetAnim}>
            <Text style={styles.sectionLabel}>The Budget</Text>
            <View style={styles.chipRow}>
              {BUDGET_TIERS.map((tier) => (
                <KeywordChip
                  key={tier}
                  label={tier}
                  active={budget === tier}
                  onPress={() => setBudget(tier as BudgetTier)}
                />
              ))}
            </View>
          </Animated.View>

          {/* ── Any other preferences? ── */}
          <Animated.View style={preferencesAnim}>
            <Text style={styles.preferencesSectionLabel}>Any other preferences?</Text>
            <View style={styles.preferencesContainer}>
              <TextInput
                style={styles.preferencesInput}
                value={preferences}
                onChangeText={setPreferences}
                placeholder={
                  'E.g. High chairs for dinner, early check-in,\nstroller-friendly paths...'
                }
                placeholderTextColor="rgba(66,71,80,0.4)"
                multiline
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          {/* Bottom spacer for CTA overlap */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Sticky CTA ── */}
        <View style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <PrimaryButton
            label={isSubmitting ? 'Planning…' : 'Plan My Trip'}
            onPress={handlePlanTrip}
            disabled={!isValid || isSubmitting}
          />
          {submitError && (
            <View style={styles.submitErrorBanner}>
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          )}
          {!isValid && !submitError && (
            <Text style={styles.ctaHint}>Add {missingFields.join(', ')} to continue</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF5',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 100,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.ink,
    fontFamily: fontFamily.label,
  },
  title: {
    ...typography.displayL,
    color: colors.ink,
  },

  // Sections
  sectionLabel: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Chip rows
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  // Date picker placeholder
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  dateField: {
    flex: 1,
    height: 50,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.datePicker,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  dateFieldLabel: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateFieldValue: {
    fontFamily: fontFamily.label,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 2,
  },

  // Vibes
  vibeCategory: {
    marginBottom: spacing.lg,
  },
  vibeCategoryLabel: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    marginBottom: spacing.sm,
  },

  // Accommodation grid
  accommodationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accommodationCard: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: radius.card,
    borderWidth: 1.5,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  accommodationCardInactive: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  accommodationCardActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  accommodationIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  accommodationLabel: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  accommodationLabelActive: {
    color: colors.white,
  },
  accommodationDesc: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  accommodationDescActive: {
    color: 'rgba(255,255,255,0.55)',
  },

  // Sticky CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(250,250,245,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Hero image
  heroContainer: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    gap: 4,
  },
  heroTitle: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
  },

  // Any other preferences
  preferencesSectionLabel: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    lineHeight: 30,
    color: '#004B87',
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  preferencesContainer: {
    backgroundColor: '#F4F4EF',
    borderRadius: 32,
    padding: 24,
  },
  preferencesInput: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#424750',
    minHeight: 160,
    textAlignVertical: 'top',
  },

  // Trending pick note (Home deep-link)
  trendingNote: {
    backgroundColor: colors.emberLight,
    borderWidth: 1.5,
    borderColor: 'rgba(196,98,58,0.3)',
    borderRadius: radius.card,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  trendingNoteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendingNoteEyebrowChip: {
    backgroundColor: 'rgba(196,98,58,0.15)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  trendingNoteEyebrow: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ember,
  },
  trendingNoteDismiss: {
    fontSize: 15,
    color: colors.muted,
  },
  trendingNoteTitle: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    marginTop: spacing.md,
  },
  trendingNoteCountry: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    color: colors.muted,
  },
  trendingNoteMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing.xs,
  },
  trendingNoteBlurb: {
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(196,98,58,0.4)',
    paddingLeft: spacing.md,
    marginTop: spacing.md,
  },
  trendingNoteVibes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },
  trendingNoteVibe: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendingNoteVibeText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  ctaHint: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  submitErrorBanner: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(196,98,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196,98,58,0.3)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  submitErrorText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ember,
    textAlign: 'center',
  },
});
