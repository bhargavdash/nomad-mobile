import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Modal,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import RemoteImage from '@components/media/RemoteImage';
import { SOURCE_BADGE_COLORS } from '@data/placeholders';
import { api } from '@lib/api';
import type { PlanModalParamList } from '@navigation/PlanModalNavigator';
import { colors, darkText } from '@theme/colors';
import { radius } from '@theme/radius';
import { shadows } from '@theme/shadows';
import { spacing, layout } from '@theme/spacing';
import { typography, fontFamily } from '@theme/typography';

import type { TripFullResponse, TripStop } from '../types/trip';

// --- Top-level helpers (extracted to keep setState callbacks ≤ 4 nesting levels) ---

function applyStopUpdate(
  prev: TripFullResponse | null,
  stopId: string,
  fn: (s: TripStop) => TripStop,
): TripFullResponse | null {
  if (!prev) return prev;
  return {
    ...prev,
    days: prev.days.map((d) => ({
      ...d,
      stops: d.stops?.map((s) => (s.id === stopId ? fn(s) : s)),
    })),
  };
}

function removeStopFromData(
  prev: TripFullResponse | null,
  stopId: string,
): TripFullResponse | null {
  if (!prev) return prev;
  return {
    ...prev,
    days: prev.days.map((d) => ({
      ...d,
      stops: d.stops?.filter((s) => s.id !== stopId),
    })),
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HERO_HEIGHT = 320;
const DANGER = '#E5484D';
const SPACE_BETWEEN = 'space-between' as const;
const OVERLAY_5 = 'rgba(255,255,255,0.05)';
const OVERLAY_8 = 'rgba(255,255,255,0.08)';
const OVERLAY_10 = 'rgba(255,255,255,0.10)';
const OVERLAY_15 = 'rgba(255,255,255,0.15)';

type SourceKey = keyof typeof SOURCE_BADGE_COLORS;

// Strip leading emoji from AI-generated tags (old trips may have emoji prefixes).
function cleanTag(t: string): string {
  return t.replace(/^[^\p{L}\p{N}\s]+\s*/u, '').trim();
}

function isSourceKey(source: string | null): source is SourceKey {
  return source != null && source in SOURCE_BADGE_COLORS;
}

// --- Source badge -----------------------------------------------------------

function SourceBadge({ source }: { source: SourceKey }) {
  const meta = SOURCE_BADGE_COLORS[source];
  return (
    <View style={[styles.sourceBadge, { backgroundColor: meta.bg }]}>
      <Text style={styles.sourceBadgeText}>{meta.label}</Text>
    </View>
  );
}

// --- Trip overview card (Tier 2) --------------------------------------------

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.overviewCard}>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={styles.overviewValue}>{value}</Text>
    </View>
  );
}

// --- Postcard card ----------------------------------------------------------

interface PostcardCardProps {
  stop: TripStop;
  index: number;
  exiting: boolean;
  onLockToggle: () => void;
  onRemove: () => void;
}

function PostcardCard({ stop, index, exiting, onLockToggle, onRemove }: PostcardCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);
  const lockP = useSharedValue(stop.locked ? 1 : 0);

  // Staggered entrance.
  useEffect(() => {
    const delay = Math.min(index, 5) * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 550, easing: Easing.ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 550, easing: Easing.ease }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Exit animation when the parent flags this stop as being removed.
  useEffect(() => {
    if (exiting) {
      opacity.value = withTiming(0, { duration: 300, easing: Easing.ease });
      translateY.value = withTiming(10, { duration: 300, easing: Easing.ease });
    }
  }, [exiting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock toggle colour tween (border + lock button bg).
  useEffect(() => {
    lockP.value = withTiming(stop.locked ? 1 : 0, { duration: 200, easing: Easing.ease });
  }, [stop.locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(lockP.value, [0, 1], ['rgba(0,0,0,0)', colors.ember]),
  }));
  const lockBtnStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(lockP.value, [0, 1], [OVERLAY_8, colors.ember]),
  }));

  const showMeta = isSourceKey(stop.source) || !!stop.duration;

  return (
    <Animated.View style={[styles.postcard, entryStyle, borderStyle]}>
      <View style={styles.postcardHeader}>
        <View style={styles.postcardHeadLeft}>
          {showMeta && (
            <View style={styles.metaRow}>
              {isSourceKey(stop.source) && <SourceBadge source={stop.source} />}
              {!!stop.duration && <Text style={styles.durationMeta}>{stop.duration}</Text>}
            </View>
          )}
          <Text style={styles.stopName}>{stop.name}</Text>
        </View>

        <View style={styles.postcardActions}>
          <AnimatedPressable
            style={[styles.iconBtn, lockBtnStyle]}
            onPress={onLockToggle}
            hitSlop={8}
            accessibilityLabel={stop.locked ? 'Unlock stop' : 'Lock stop'}
          >
            <Feather
              name={stop.locked ? 'lock' : 'unlock'}
              size={14}
              color="rgba(255,255,255,0.8)"
            />
          </AnimatedPressable>
          <Pressable
            style={styles.iconBtnPlain}
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
            accessibilityLabel="Stop options"
          >
            <Feather name="more-horizontal" size={18} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>
      </View>

      {!!stop.description && <Text style={styles.stopDesc}>{stop.description}</Text>}

      {stop.tags.length > 0 &&
        (() => {
          const cleanedTags = [...new Set(stop.tags.map(cleanTag).filter(Boolean))];
          return cleanedTags.length > 0 ? (
            <View style={styles.tagsRow}>
              {cleanedTags.map((t) => (
                <View key={t} style={[styles.tag, stop.locked && styles.tagLocked]}>
                  <Text style={[styles.tagText, stop.locked && styles.tagTextLocked]}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null;
        })()}

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onLockToggle();
              }}
            >
              <Text style={styles.menuItemText}>{stop.locked ? 'Unlock' : 'Lock this stop'}</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onRemove();
              }}
            >
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Remove</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

// --- Main screen ------------------------------------------------------------

export default function ItineraryReveal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<{
    key: string;
    name: 'ItineraryReveal';
    params: PlanModalParamList['ItineraryReveal'];
  }>();
  const { tripId } = route.params;

  const [data, setData] = useState<TripFullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const scrollRef = useRef<ScrollView>(null);
  const dayOffsets = useRef<Record<string, number>>({});
  const tabBarHeight = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<TripFullResponse>(`/trips/${tripId}/full`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        if (res.data.days.length > 0) setActiveDayId(res.data.days[0].id);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[ItineraryReveal] fetch failed:', err);
        setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const handleBack = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  const updateStop = useCallback((stopId: string, fn: (s: TripStop) => TripStop) => {
    setData((prev) => applyStopUpdate(prev, stopId, fn));
  }, []);

  const handleLockToggle = useCallback(
    async (stop: TripStop) => {
      const next = !stop.locked;
      updateStop(stop.id, (s) => ({ ...s, locked: next })); // optimistic
      try {
        await api.patch(`/trips/${tripId}/stops/${stop.id}`, { locked: next });
      } catch (err) {
        console.error('[ItineraryReveal] lock toggle failed:', err);
        updateStop(stop.id, (s) => ({ ...s, locked: stop.locked })); // revert
      }
    },
    [tripId, updateStop],
  );

  const handleRemove = useCallback(
    async (stop: TripStop) => {
      setRemoving((prev) => new Set(prev).add(stop.id));
      try {
        await api.delete(`/trips/${tripId}/stops/${stop.id}`);
        setTimeout(() => {
          setData((prev) => removeStopFromData(prev, stop.id));
          setRemoving((prev) => {
            const nextSet = new Set(prev);
            nextSet.delete(stop.id);
            return nextSet;
          });
        }, 300);
      } catch (err) {
        console.error('[ItineraryReveal] remove failed:', err);
        setRemoving((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(stop.id);
          return nextSet;
        });
      }
    },
    [tripId],
  );

  // Show a city banner once per unique city, skipping the destination itself
  // (the hero already covers it) and any repeated cities.
  const cityBannerDays = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!data) return map;
    const dest = data.trip.destination.trim().toLowerCase();
    const seen = new Set<string>();
    data.days.forEach((day) => {
      const key = (day.city ?? '').trim().toLowerCase();
      if (key && key !== dest && !seen.has(key)) {
        seen.add(key);
        map[day.id] = true;
      }
    });
    return map;
  }, [data]);

  const scrollToDay = useCallback((dayId: string) => {
    const off = dayOffsets.current[dayId];
    if (off != null) {
      scrollRef.current?.scrollTo({
        y: Math.max(off - tabBarHeight.current - spacing.lg, 0),
        animated: true,
      });
    }
    setActiveDayId(dayId);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!data) return;
      const probe = e.nativeEvent.contentOffset.y + tabBarHeight.current + spacing.xxl;
      let current = data.days[0]?.id ?? null;
      for (const d of data.days) {
        const off = dayOffsets.current[d.id];
        if (off != null && off <= probe) current = d.id;
      }
      if (current) setActiveDayId(current);
    },
    [data],
  );

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="large" color={colors.ember} />
      </View>
    );
  }

  if (fetchError || !data) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.errorTitle}>Couldn&apos;t load this trip</Text>
        <Text style={styles.errorText}>Something went wrong. Please go back and try again.</Text>
        <Pressable onPress={handleBack} style={styles.errorBackButton}>
          <Text style={styles.errorBackLabel}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { trip, days } = data;
  const hasOverview =
    !!trip.routeSummary ||
    !!trip.transportStrategy ||
    !!trip.budgetEstimate ||
    trip.seasonalTips.length > 0 ||
    (!!trip.stayByCity && Object.keys(trip.stayByCity).length > 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {/* [0] Hero + Tier-2 overview (scroll away together) */}
        <View>
          <View style={styles.hero}>
            <RemoteImage
              src={trip.heroImageUrl}
              fallbackQuery={trip.destination}
              style={StyleSheet.absoluteFill}
              priority="high"
            />
            <LinearGradient
              colors={['transparent', 'rgba(17,24,32,0.55)', colors.navy3]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={[styles.heroTopRow, { paddingTop: insets.top + spacing.sm }]}>
              <Pressable onPress={handleBack} style={styles.heroPill} hitSlop={8}>
                <Text style={styles.heroPillText}>← Back</Text>
              </Pressable>
            </View>
            <View style={styles.heroBottom}>
              <Text style={styles.heroEyebrow}>AI-GENERATED ITINERARY</Text>
              <Text style={styles.heroTitle}>{trip.destination}</Text>
              <View style={styles.heroMetaRow}>
                {trip.durationDays != null && (
                  <Text style={styles.heroMeta}>{trip.durationDays} days</Text>
                )}
                <Text style={styles.heroMeta}>· {trip.statsPlaces} places</Text>
                <Text style={styles.heroMeta}>· {trip.statsTips} tips</Text>
                <Text style={styles.heroMeta}>· {trip.statsPhotoStops} photos</Text>
              </View>
            </View>
          </View>

          {hasOverview && (
            <View style={styles.overviewSection}>
              {!!trip.routeSummary && <OverviewCard label="ROUTE" value={trip.routeSummary} />}
              {!!trip.transportStrategy && (
                <OverviewCard label="GETTING AROUND" value={trip.transportStrategy} />
              )}
              {!!trip.budgetEstimate && (
                <OverviewCard label="ROUGH BUDGET" value={trip.budgetEstimate} />
              )}
              {trip.seasonalTips.length > 0 && (
                <OverviewCard label="GOOD TO KNOW" value={trip.seasonalTips.join(' · ')} />
              )}
              {!!trip.stayByCity && Object.keys(trip.stayByCity).length > 0 && (
                <View style={styles.stayBlock}>
                  <Text style={styles.stayHeading}>WHERE TO STAY</Text>
                  {Object.entries(trip.stayByCity).map(([city, stay]) => (
                    <Text key={city} style={styles.stayRow}>
                      <Text style={styles.stayCity}>{city}: </Text>
                      {stay}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* [1] Sticky day tabs */}
        <View
          style={[styles.dayTabBar, { paddingTop: insets.top + spacing.sm }]}
          onLayout={(e: LayoutChangeEvent) => {
            tabBarHeight.current = e.nativeEvent.layout.height;
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabScroll}
          >
            {days.map((d) => {
              const active = d.id === activeDayId;
              return (
                <Pressable key={d.id} style={styles.dayTab} onPress={() => scrollToDay(d.id)}>
                  <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>
                    Day {d.dayNumber} · {d.city}
                  </Text>
                  {active && <View style={styles.dayTabUnderline} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* [2+] Day sections */}
        {days.map((day) => (
          <View
            key={day.id}
            style={styles.daySection}
            onLayout={(e: LayoutChangeEvent) => {
              dayOffsets.current[day.id] = e.nativeEvent.layout.y;
            }}
          >
            {cityBannerDays[day.id] ? (
              <View style={styles.cityBanner}>
                <RemoteImage
                  src={day.imageUrl}
                  fallbackQuery={day.city}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.cityBannerContent}>
                  <Text style={styles.dayEyebrowPeach}>
                    DAY {day.dayNumber} — {day.city}
                  </Text>
                  <Text style={styles.dayTitleBanner}>{day.title}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.dayHeaderPlain}>
                <Text style={styles.dayEyebrow}>
                  DAY {day.dayNumber} — {day.city}
                </Text>
                <Text style={styles.dayTitle}>{day.title}</Text>
              </View>
            )}

            {!!day.description && <Text style={styles.dayDesc}>{day.description}</Text>}

            {day.stops && day.stops.length > 0 ? (
              <View style={styles.stopsList}>
                {day.stops.map((stop, i) => (
                  <View key={stop.id} style={styles.stopRow}>
                    <View style={styles.timeCol}>
                      <Text style={styles.timeValue}>{stop.time}</Text>
                      <Text style={styles.timeAmpm}>{stop.ampm}</Text>
                    </View>
                    <View style={styles.stopCardWrap}>
                      <PostcardCard
                        stop={stop}
                        index={i}
                        exiting={removing.has(stop.id)}
                        onLockToggle={() => handleLockToggle(stop)}
                        onRemove={() => handleRemove(stop)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>
                  {day.stopCount} stops planned · details syncing
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy3,
  },
  scrollContent: {
    paddingBottom: spacing.huge + spacing.xxl,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.navy3,
    paddingHorizontal: layout.screenPadding,
  },
  errorTitle: {
    ...typography.displayS,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.bodyM,
    color: darkText.body,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  errorBackButton: {
    backgroundColor: colors.ember,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
  errorBackLabel: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: SPACE_BETWEEN,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: SPACE_BETWEEN,
    paddingHorizontal: layout.screenPadding,
  },
  heroPill: {
    backgroundColor: OVERLAY_15,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  heroPillText: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    color: colors.white,
  },
  heroBottom: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
  },
  heroEyebrow: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    color: colors.ember,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.displayXL,
    color: colors.white,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.md,
    columnGap: spacing.sm,
  },
  heroMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 16,
    color: darkText.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Overview (Tier 2)
  overviewSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  overviewCard: {
    backgroundColor: OVERLAY_5,
    borderWidth: 1,
    borderColor: OVERLAY_8,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  overviewLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    color: colors.ember,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  overviewValue: {
    ...typography.bodyS,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
  },
  stayBlock: {
    marginTop: spacing.xs,
  },
  stayHeading: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    color: colors.ember,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  stayRow: {
    ...typography.bodyS,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 22,
  },
  stayCity: {
    fontFamily: fontFamily.labelStrong,
    color: colors.white,
  },

  // Day tab bar (sticky)
  dayTabBar: {
    backgroundColor: colors.navy3,
    borderBottomWidth: 1,
    borderBottomColor: OVERLAY_8,
  },
  dayTabScroll: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  dayTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dayTabText: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    lineHeight: 18,
    color: darkText.body,
  },
  dayTabTextActive: {
    fontFamily: fontFamily.labelStrong,
    color: colors.ember,
  },
  dayTabUnderline: {
    marginTop: 6,
    height: 2,
    width: 24,
    borderRadius: 2,
    backgroundColor: colors.ember,
  },

  // Day section
  daySection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
  },
  cityBanner: {
    height: 180,
    borderRadius: radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
    ...shadows.postcard,
  },
  cityBannerContent: {
    padding: spacing.lg,
  },
  dayHeaderPlain: {
    marginBottom: spacing.sm,
  },
  dayEyebrow: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    color: colors.ember,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  dayEyebrowPeach: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    color: colors.peach,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  dayTitle: {
    ...typography.displayM,
    color: colors.white,
  },
  dayTitleBanner: {
    ...typography.displayM,
    color: colors.white,
  },
  dayDesc: {
    ...typography.bodyS,
    color: darkText.body,
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  // Stops list
  stopsList: {
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  stopRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeCol: {
    width: 54,
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
  },
  timeValue: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 22,
    color: colors.white,
  },
  timeAmpm: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    lineHeight: 14,
    color: darkText.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  stopCardWrap: {
    flex: 1,
    minWidth: 0,
  },

  // Postcard card
  postcard: {
    backgroundColor: colors.cardDark,
    borderRadius: radius.postcard,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.postcard,
  },
  postcardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: SPACE_BETWEEN,
    gap: spacing.md,
  },
  postcardHeadLeft: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  durationMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 16,
    color: darkText.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sourceBadge: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  sourceBadgeText: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stopName: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    lineHeight: 23,
    color: colors.white,
  },
  postcardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnPlain: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: OVERLAY_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopDesc: {
    ...typography.bodyS,
    color: darkText.body,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tag: {
    backgroundColor: OVERLAY_10,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagLocked: {
    backgroundColor: 'rgba(196,98,58,0.20)',
  },
  tagText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tagTextLocked: {
    color: colors.peach,
  },

  // Context menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  menu: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: colors.navy,
    borderRadius: radius.contextMenu,
    paddingVertical: spacing.xs,
    ...shadows.contextMenu,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemText: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
  },
  menuItemDanger: {
    color: DANGER,
  },
  menuDivider: {
    height: 1,
    backgroundColor: OVERLAY_8,
    marginHorizontal: spacing.lg,
  },

  // Empty day
  emptyDay: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: OVERLAY_8,
    backgroundColor: OVERLAY_5,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyDayText: {
    ...typography.bodyS,
    color: darkText.body,
  },
});
