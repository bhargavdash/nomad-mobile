import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TripCard from '@components/Cards/TripCard';
import { api } from '@lib/api';
import type { RootStackParamList } from '@navigation/RootNavigator';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing, layout } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

import type { TripSummary } from '../types/trip';

type TripFilter = 'all' | 'upcoming' | 'past';

const FILTERS: { key: TripFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

const STAGGER_DELAYS = [0, 50, 120, 190, 260, 330];

function useStaggeredEntry(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = STAGGER_DELAYS[index] ?? 330;
    opacity.value = withDelay(delay, withTiming(1, { duration: 550, easing: Easing.ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 550, easing: Easing.ease }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

function AnimatedRow({ index, children }: { index: number; children: React.ReactNode }) {
  const style = useStaggeredEntry(index);
  return <Animated.View style={[styles.rowSpacing, style]}>{children}</Animated.View>;
}

export default function MyTrips() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<TripFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async (isActive: () => boolean, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(false);
    try {
      const res = await api.get<{ trips: TripSummary[] }>('/trips');
      if (isActive()) setTrips(res.data.trips);
    } catch {
      if (isActive()) setError(true);
    } finally {
      if (isActive() && !opts?.silent) setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips(() => true, { silent: true });
    setRefreshing(false);
  }, [loadTrips]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadTrips(() => active);
      return () => {
        active = false;
      };
    }, [loadTrips]),
  );

  const counts = useMemo(
    () => ({
      all: trips.length,
      upcoming: trips.filter((t) => tripBucket(t) === 'upcoming').length,
      past: trips.filter((t) => tripBucket(t) === 'past').length,
    }),
    [trips],
  );

  const visibleTrips = useMemo(() => {
    if (filter === 'all') return trips;
    return trips.filter((t) => tripBucket(t) === filter);
  }, [trips, filter]);

  const openTrip = useCallback(
    (trip: TripSummary) => {
      if (trip.status === 'researching') {
        navigation.navigate('PlanModal', { screen: 'ResearchTicker', params: { tripId: trip.id } });
      } else {
        navigation.navigate('PlanModal', {
          screen: 'ItineraryReveal',
          params: { tripId: trip.id },
        });
      }
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.ember}
            colors={[colors.ember]}
          />
        }
      >
        <AnimatedRow index={0}>
          <Text style={styles.eyebrow}>Your travels</Text>
          <Text style={styles.title}>My Trips</Text>
          <Text style={styles.subtitle}>Every adventure you&apos;ve planned, newest first.</Text>
        </AnimatedRow>

        <AnimatedRow index={1}>
          <View style={styles.tabs}>
            {FILTERS.map((f) => {
              const isActive = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                    ]}
                  >
                    {f.label} {counts[f.key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </AnimatedRow>

        <TripsBody
          loading={loading}
          error={error}
          trips={trips}
          visibleTrips={visibleTrips}
          filter={filter}
          onRetry={() => loadTrips(() => true)}
          onOpenTrip={openTrip}
        />
      </ScrollView>
    </View>
  );
}

interface TripsBodyProps {
  loading: boolean;
  error: boolean;
  trips: TripSummary[];
  visibleTrips: TripSummary[];
  filter: TripFilter;
  onRetry: () => void;
  onOpenTrip: (trip: TripSummary) => void;
}

function TripsBody({
  loading,
  error,
  trips,
  visibleTrips,
  filter,
  onRetry,
  onOpenTrip,
}: TripsBodyProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateTitle}>Couldn&apos;t load your trips</Text>
        <Text style={styles.stateBody}>Check your connection and try again.</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View style={styles.stateBox}>
        <Feather name="compass" size={36} color={colors.muted} style={styles.stateIcon} />
        <Text style={styles.stateTitle}>No trips yet</Text>
        <Text style={styles.stateBody}>Plan your first adventure and it&apos;ll show up here.</Text>
      </View>
    );
  }

  if (visibleTrips.length === 0) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateTitle}>No {filter} trips</Text>
        <Text style={styles.stateBody}>Nothing here yet — try a different filter.</Text>
      </View>
    );
  }

  return (
    <>
      {visibleTrips.map((trip, i) => (
        <AnimatedRow key={trip.id} index={Math.min(i + 2, 5)}>
          <TripCard trip={trip} onPress={() => onOpenTrip(trip)} />
        </AnimatedRow>
      ))}
    </>
  );
}

function tripBucket(trip: TripSummary): 'upcoming' | 'past' | 'undated' {
  const iso = trip.dateTo ?? trip.dateFrom;
  if (!iso) return 'undated';
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return 'undated';
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return end < todayStart ? 'past' : 'upcoming';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xxl,
  },
  rowSpacing: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 11,
    color: colors.ember,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: 30,
    color: colors.ink,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tab: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.ink,
  },
  tabInactive: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabLabel: {
    fontSize: 13,
  },
  tabLabelActive: {
    fontFamily: fontFamily.labelStrong,
    color: colors.cream,
  },
  tabLabelInactive: {
    fontFamily: fontFamily.label,
    color: colors.muted,
  },
  centered: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  stateBox: {
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  stateIcon: {
    marginBottom: spacing.sm,
  },
  stateTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    color: colors.ink,
  },
  stateBody: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryText: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 13,
    color: colors.cream,
  },
});
