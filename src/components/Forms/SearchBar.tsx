import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';

import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { fontFamily } from '@theme/typography';

interface SearchBarProps {
  onPress?: () => void;
}

export default function SearchBar({ onPress }: SearchBarProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Feather name="search" size={16} color={colors.muted} style={styles.icon} />
      <Text style={styles.placeholder}>Where do you want to go?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  placeholder: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.muted,
  },
});
