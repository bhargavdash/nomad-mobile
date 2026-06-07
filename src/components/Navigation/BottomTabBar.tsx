import { Feather } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@theme/colors';
import { shadows } from '@theme/shadows';
import { spacing, layout } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface Tab {
  key: string;
  label: string;
  icon: FeatherName;
}

const TABS: Tab[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'mytrips', label: 'My Trips', icon: 'map' },
  { key: 'plan', label: 'Plan', icon: 'plus' },
  { key: 'today', label: 'Today', icon: 'navigation' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (key: string) => void;
}

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        if (tab.key === 'plan') {
          return <FABButton key={tab.key} onPress={() => onTabPress(tab.key)} />;
        }

        const isActive = activeTab === tab.key;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)}>
            <Feather name={tab.icon} size={20} color={isActive ? colors.ember : colors.muted} />
            <Text
              style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FABButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.fabWrapper}>
      <AnimatedPressable
        style={[styles.fab, shadows.fab, animStyle]}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: 150 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}
        onPress={onPress}
      >
        <Feather name="plus" size={24} color={colors.white} />
      </AnimatedPressable>
      <Text style={styles.tabLabelInactive}>Plan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: layout.bottomNavHeight,
    backgroundColor: 'rgba(245,240,232,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: layout.safeAreaBottom,
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
  },
  tabLabelActive: {
    fontFamily: fontFamily.labelStrong,
    color: colors.ember,
  },
  tabLabelInactive: {
    fontFamily: fontFamily.label,
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.ember,
    borderWidth: 3,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
