import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

export default function Landing({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/login_bg.avif')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Top logo */}
      <View style={[styles.logoRow, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.logoText}>Nomad</Text>
        <View style={styles.logoDot} />
      </View>

      {/* Bottom content block */}
      <View style={[styles.bottomBlock, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.heading}>
          {'Your journey\n'}
          <Text style={styles.headingItalic}>begins</Text>
          {' here'}
        </Text>

        <Text style={styles.subtitle}>
          Curating the world&apos;s most breathtaking escapes for the intentional traveler. Escape
          the ordinary and rediscover the art of discovery.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2B4B',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.white,
    letterSpacing: -0.3,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ember,
    marginLeft: 4,
    marginTop: 2,
  },
  bottomBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_800ExtraBold',
    fontSize: 38,
    lineHeight: 46,
    color: colors.white,
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  headingItalic: {
    fontFamily: 'PlayfairDisplay_800ExtraBold',
    fontSize: 38,
    lineHeight: 46,
    color: colors.ember,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 28,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberDim,
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
    marginBottom: 8,
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: colors.white,
  },
  ctaArrow: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 18,
    color: colors.white,
  },
});
