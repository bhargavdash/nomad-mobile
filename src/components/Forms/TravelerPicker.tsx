import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TRAVELER_OPTIONS } from '@data/placeholders';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

interface TravelerPickerProps {
  travelers: string | null;
  setTravelers: (value: string) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_ANIMATION_MS = 350;

function labelFor(value: string | null): string | null {
  if (!value) return null;
  const match = TRAVELER_OPTIONS.find((opt) => opt.value === value);
  // Legacy trips may carry non-numeric values ("3+", "large") — show as-is.
  return match ? match.label : value;
}

export default function TravelerPicker({ travelers, setTravelers }: TravelerPickerProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const close = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 300 });
    sheetTranslateY.value = withTiming(SCREEN_HEIGHT, {
      duration: SHEET_ANIMATION_MS,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
    setTimeout(() => {
      setMounted(false);
      setIsOpen(false);
    }, SHEET_ANIMATION_MS);
  }, [overlayOpacity, sheetTranslateY]);

  useEffect(() => {
    if (!isOpen) return;
    setMounted(true);
    overlayOpacity.value = 0;
    sheetTranslateY.value = SCREEN_HEIGHT;
    overlayOpacity.value = withTiming(1, { duration: 300 });
    sheetTranslateY.value = withTiming(0, {
      duration: SHEET_ANIMATION_MS,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
  }, [isOpen, overlayOpacity, sheetTranslateY]);

  const handleSelect = useCallback(
    (value: string) => {
      setTravelers(value);
      close();
    },
    [close, setTravelers],
  );

  const selectedLabel = labelFor(travelers);

  return (
    <View>
      <Pressable
        style={[styles.trigger, travelers !== null && styles.triggerHasValue]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.triggerValue, travelers === null && styles.triggerValuePlaceholder]}>
          {selectedLabel ?? 'How many travelers?'}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      {mounted ? (
        <Modal
          visible={mounted}
          transparent
          statusBarTranslucent
          animationType="none"
          onRequestClose={close}
        >
          <View style={styles.modalRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close}>
              <Animated.View style={[styles.overlay, overlayStyle]}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.overlayTint} />
              </Animated.View>
            </Pressable>

            <Animated.View
              style={[
                styles.sheet,
                { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
                sheetStyle,
              ]}
            >
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.title}>How many travelers?</Text>
                  <Text style={styles.subtitle}>Pick the exact number in your group</Text>
                </View>
                <Pressable style={styles.closeButton} onPress={close}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {TRAVELER_OPTIONS.map((opt) => {
                  const active = travelers === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.option, active && styles.optionActive]}
                      onPress={() => handleSelect(opt.value)}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {opt.label}
                      </Text>
                      {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.datePicker,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  triggerHasValue: {
    borderColor: colors.ember,
  },
  triggerValue: {
    flex: 1,
    fontFamily: fontFamily.labelStrong,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  triggerValuePlaceholder: {
    color: colors.muted,
    fontFamily: fontFamily.body,
  },
  chevron: {
    fontFamily: fontFamily.label,
    fontSize: 16,
    color: colors.muted,
    marginLeft: 8,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,43,75,0.35)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 24,
    color: colors.navy,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  closeButtonText: {
    fontFamily: fontFamily.label,
    fontSize: 14,
    lineHeight: 18,
    color: colors.muted,
  },
  list: {
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionActive: {
    borderColor: colors.ember,
    backgroundColor: colors.emberLight,
  },
  optionText: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  optionTextActive: {
    color: colors.ember,
  },
  optionCheck: {
    fontFamily: fontFamily.labelStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ember,
  },
});
