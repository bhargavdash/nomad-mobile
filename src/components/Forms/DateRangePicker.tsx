import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { DateRange } from '@store/tripPlanStore';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

import CalendarBottomSheet from './CalendarBottomSheet';

interface DateRangePickerProps {
  dates: DateRange;
  setDates: (dates: DateRange) => void;
}

type OpenMode = 'from' | 'to';

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs((b.getTime() - a.getTime()) / 86_400_000));
}

function formatShortDate(value: string | null): string | null {
  const date = parseDateOnly(value);
  if (!date) return null;
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function TriggerBox({
  label,
  value,
  isActive,
  onPress,
}: {
  label: string;
  value: string | null;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.box,
        isActive && styles.boxActive,
        value !== null && !isActive && styles.boxHasValue,
      ]}
      onPress={onPress}
    >
      <Text style={styles.boxLabel}>{label}</Text>
      <Text style={[styles.boxValue, value === null && styles.boxValuePlaceholder]}>
        {value ?? 'Tap to set'}
      </Text>
    </Pressable>
  );
}

export default function DateRangePicker({ dates, setDates }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openMode, setOpenMode] = useState<OpenMode>('from');
  const durationOpacity = useSharedValue(dates.from && dates.to ? 1 : 0);

  useEffect(() => {
    durationOpacity.value = withTiming(dates.from && dates.to ? 1 : 0, {
      duration: 300,
    });
  }, [dates.from, dates.to, durationOpacity]);

  const durationStyle = useAnimatedStyle(() => ({
    opacity: durationOpacity.value,
  }));

  const fromDisplay = formatShortDate(dates.from);
  const toDisplay = formatShortDate(dates.to);

  const durationDays =
    dates.from && dates.to
      ? daysBetween(parseDateOnly(dates.from)!, parseDateOnly(dates.to)!)
      : null;

  return (
    <View>
      <View style={styles.grid}>
        <TriggerBox
          label="From"
          value={fromDisplay}
          isActive={isOpen && openMode === 'from'}
          onPress={() => {
            setOpenMode('from');
            setIsOpen(true);
          }}
        />
        <TriggerBox
          label="To"
          value={toDisplay}
          isActive={isOpen && openMode === 'to'}
          onPress={() => {
            setOpenMode('to');
            setIsOpen(true);
          }}
        />
      </View>

      {durationDays !== null ? (
        <Animated.View style={[styles.durationPill, durationStyle]}>
          <Text style={styles.durationText}>
            {durationDays} day{durationDays !== 1 ? 's' : ''}
          </Text>
        </Animated.View>
      ) : null}

      <CalendarBottomSheet
        visible={isOpen}
        initialMode={openMode}
        dates={dates}
        onConfirm={setDates}
        onClear={() => setDates({ from: null, to: null })}
        onClose={() => setIsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.datePicker,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  boxActive: {
    borderColor: colors.ember,
    shadowColor: colors.ember,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 2,
  },
  boxHasValue: {
    borderColor: colors.ember,
  },
  boxLabel: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
  },
  boxValue: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  boxValuePlaceholder: {
    color: colors.border,
    fontFamily: fontFamily.body,
  },
  durationPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.emberLight,
  },
  durationText: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 12,
    lineHeight: 16,
    color: colors.ember,
  },
});
