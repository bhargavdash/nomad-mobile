import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  StatusBar,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActiveTripCard from '@components/Cards/ActiveTripCard';
import DestinationCard from '@components/Cards/DestinationCard';
import HeroCard from '@components/Cards/HeroCard';
import HomeHeader from '@components/Misc/HomeHeader';
import { api } from '@lib/api';
import type { TrendingPick } from '@navigation/PlanModalNavigator';
import type { RootStackParamList } from '@navigation/RootNavigator';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing, layout } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

import type { TripSummary, TrendingDest, TrendingResponse } from '../types/trip';

const STAGGER_DELAYS = [0, 50, 120, 190, 260, 330];

const EMPTY_TRENDING: TrendingResponse = {
  season: 'bootstrap',
  seasonKey: null,
  refreshedAt: null,
  india: [],
  international: [],
};

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

function renderHeroSlot(
  loading: boolean,
  trip: TripSummary | null,
  onPlan: () => void,
  onTrip: (id: string) => void,
): React.ReactNode {
  if (loading) return <Skeleton style={styles.heroSkeleton} />;
  if (trip) {
    return (
      <ActiveTripCard
        destination={trip.destination}
        dateFrom={fmtShort(trip.dateFrom)}
        dateTo={fmtShort(trip.dateTo)}
        duration={trip.durationDays ?? 0}
        stats={{
          places: trip.statsPlaces,
          tips: trip.statsTips,
          photoStops: trip.statsPhotoStops,
        }}
        onPress={() => onTrip(trip.id)}
      />
    );
  }
  return <HeroCard onPress={onPlan} />;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTrip, setActiveTrip] = useState<TripSummary | null>(null);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState(false);
  const [trending, setTrending] = useState<TrendingResponse | null>(null);

  const headerAnim = useStaggeredEntry(0);
  const heroAnim = useStaggeredEntry(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ trips: TripSummary[] }>('/trips');
        if (cancelled) return;
        const active = res.data.trips.find((t) => t.status === 'active' || t.status === 'ready');
        setActiveTrip(active ?? null);
      } catch (err) {
        if (!cancelled) {
          const status = (err as AxiosError)?.response?.status;
          // 429: server is busy — don't silently show the "plan a trip" hero.
          // Any non-network error besides 401 is surfaced so user understands
          // why their active trip isn't visible.
          if (status && status !== 401) setTripsError(true);
        }
      } finally {
        if (!cancelled) setTripsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<TrendingResponse>('/trending');
        if (cancelled) return;
        setTrending(res.data);
      } catch {
        // Fall back to empty rows rather than spinning skeletons forever.
        if (!cancelled) setTrending(EMPTY_TRENDING);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPlan = () => navigation.navigate('PlanModal');

  const openItinerary = (tripId: string) =>
    navigation.navigate('PlanModal', { screen: 'ItineraryReveal', params: { tripId } });

  const handleTrendingPick = (dest: TrendingDest) => {
    const trendingPick: TrendingPick = {
      name: dest.name,
      country: dest.country,
      duration: dest.duration,
      blurb: dest.blurb,
      vibes: dest.vibe_tags,
    };
    navigation.navigate('PlanModal', { screen: 'PlanTrip', params: { trendingPick } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header + intro ── */}
        <Animated.View style={[styles.header, headerAnim]}>
          <HomeHeader />
          <Text style={styles.introEyebrow}>{getTimeOfDay()}</Text>
          <Text style={styles.introText}>
            What kind of trip are you in the mood for? Tell us a vibe — we&apos;ll dig through the
            real internet so you don&apos;t have to.
          </Text>
        </Animated.View>

        {/* ── Fetch error notice (rate limit or network) ── */}
        {tripsError && (
          <View style={styles.fetchErrorBanner}>
            <Text style={styles.fetchErrorText}>Couldn&apos;t load your trips — tap to retry.</Text>
          </View>
        )}

        {/* ── Hero slot — active trip or plan CTA ── */}
        <Animated.View style={[styles.heroWrapper, heroAnim]}>
          {renderHeroSlot(tripsLoading, activeTrip, openPlan, openItinerary)}
        </Animated.View>

        {/* ── Trending — two LLM-driven rows: India + International ── */}
        <TrendingRow
          index={2}
          eyebrow="Where Indians are heading"
          title="Trending in"
          accent="India"
          destinations={trending?.india ?? null}
          onPick={handleTrendingPick}
        />
        <TrendingRow
          index={3}
          eyebrow="Indian passport · easy entry"
          title="Trending"
          accent="internationally"
          destinations={trending?.international ?? null}
          onPick={handleTrendingPick}
        />
      </ScrollView>
    </View>
  );
}

// ── Trending row ──────────────────────────────────────────────────────────

interface TrendingRowProps {
  index: number;
  eyebrow: string;
  title: string;
  accent: string;
  destinations: TrendingDest[] | null;
  onPick: (dest: TrendingDest) => void;
}

function TrendingRowContent({
  destinations,
  onPick,
}: {
  destinations: TrendingDest[] | null;
  onPick: (dest: TrendingDest) => void;
}): React.ReactNode {
  if (destinations === null) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} style={[styles.cardSkeleton, i > 0 && { marginLeft: spacing.md }]} />
        ))}
      </ScrollView>
    );
  }
  if (destinations.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          Refreshing trending picks for this season — check back in a minute.
        </Text>
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={destinations}
      keyExtractor={(item, i) => `${item.name}-${i}`}
      renderItem={({ item }) => (
        <DestinationCard
          name={item.name}
          country={item.country}
          duration={item.duration}
          signal={signalFromVibe(item.vibe_tags)}
          imageUrl={item.imageUrl ?? null}
          fallbackQuery={`${item.name} ${item.country}`}
          onPress={() => onPick(item)}
        />
      )}
      contentContainerStyle={styles.list}
      showsHorizontalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
    />
  );
}

function TrendingRow({ index, eyebrow, title, accent, destinations, onPick }: TrendingRowProps) {
  const anim = useStaggeredEntry(index);

  return (
    <Animated.View style={[styles.section, anim]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>
        {title} <Text style={styles.accent}>{accent}</Text>
      </Text>
      <TrendingRowContent destinations={destinations} onPick={onPick} />
    </Animated.View>
  );
}

// ── Pulsing skeleton ──────────────────────────────────────────────────────

function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.ease }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.skeletonBase, style, animStyle]} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const VIBE_BADGE: Record<string, string> = {
  beach: '🏖 Beach',
  mountains: '🏔 Mountains',
  heritage: '🏛 Heritage',
  food: '🍜 Foodie',
  nightlife: '🌃 Nightlife',
  adventure: '🧗 Adventure',
  spiritual: '🕉 Spiritual',
  luxury: '✨ Luxury',
  offbeat: '✦ Offbeat',
  family: '👨‍👩‍👧 Family',
  romance: '💞 Romance',
  wellness: '🧘 Wellness',
  wildlife: '🐅 Wildlife',
  nature: '🌿 Nature',
  culture: '🎭 Culture',
  coastal: '🌊 Coastal',
  diving: '🤿 Diving',
};

function signalFromVibe(tags: string[] | undefined): string {
  const first = tags?.[0]?.toLowerCase();
  if (first && VIBE_BADGE[first]) return VIBE_BADGE[first];
  if (first) return `✦ ${first[0].toUpperCase()}${first.slice(1)}`;
  return '✦ Trending';
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function fmtShort(iso: string | null): string {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    paddingBottom: layout.bottomNavHeight + spacing.xxl,
  },

  // Fetch error
  fetchErrorBanner: {
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.md,
    backgroundColor: 'rgba(196,98,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196,98,58,0.25)',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  fetchErrorText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ember,
    textAlign: 'center',
  },

  // Header + intro
  header: {
    marginTop: spacing.lg,
  },
  introEyebrow: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: colors.ember,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing.lg,
  },
  introText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing.sm,
  },

  // Hero slot
  heroWrapper: {
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing.xl,
  },
  heroSkeleton: {
    height: 220,
    borderRadius: radius.activeTripCard,
  },

  // Sections
  section: {
    marginTop: spacing.xxl,
  },
  eyebrow: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: colors.ember,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: layout.screenPadding,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  accent: {
    color: colors.ember,
    fontStyle: 'italic',
  },
  list: {
    paddingHorizontal: layout.screenPadding,
  },

  // Skeletons
  skeletonBase: {
    backgroundColor: colors.cream2,
  },
  cardSkeleton: {
    width: 140,
    height: 180,
    borderRadius: radius.trendingCard,
  },

  // Empty state
  emptyCard: {
    marginHorizontal: layout.screenPadding,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.warmWhite,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
});
