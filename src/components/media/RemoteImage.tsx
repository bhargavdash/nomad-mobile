import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { unsplashByQuery } from '@lib/unsplash';
import { colors } from '@theme/colors';

type ContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

interface RemoteImageProps {
  /** Server-resolved image URL. Null/undefined → deterministic Unsplash fallback. */
  src?: string | null;
  /** Drives the deterministic themed fallback (place name, city, or tag). */
  fallbackQuery: string;
  /** Sizes the image box — pass dimensions + radius, or StyleSheet.absoluteFill. */
  style?: StyleProp<ViewStyle>;
  contentFit?: ContentFit;
  priority?: 'low' | 'normal' | 'high';
  /** Cross-fade duration in ms when the image resolves. */
  transition?: number;
  /** Overlaid on top of the image inside the same clipped box (gradient, badges). */
  children?: React.ReactNode;
}

/**
 * Renders an already-resolved image URL with a calm gradient placeholder
 * behind it. Does NOT fetch — callers pass a URL the server resolved (or null).
 *
 * Fallback ladder (never gets stuck on a broken image):
 *   0 = resolved `src`, or themed Unsplash when `src` is null
 *   1 = themed Unsplash (after `src` errors)
 *   2 = give up → gradient placeholder only
 */
export default function RemoteImage({
  src,
  fallbackQuery,
  style,
  contentFit = 'cover',
  priority = 'normal',
  transition = 400,
  children,
}: RemoteImageProps) {
  const [failCount, setFailCount] = React.useState(0);

  // Reset the ladder when the resolved URL changes (e.g. a late-arriving
  // heroImageUrl) so the new source gets its own chance to load.
  React.useEffect(() => {
    setFailCount(0);
  }, [src]);

  let display: string | null;
  if (failCount === 0) {
    display = src ?? unsplashByQuery(fallbackQuery);
  } else if (failCount === 1) {
    display = unsplashByQuery(fallbackQuery);
  } else {
    display = null;
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.navy2, colors.navy3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {display && (
        <Image
          key={display}
          source={{ uri: display }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          priority={priority}
          transition={transition}
          onError={() => setFailCount((count) => Math.min(count + 1, 2))}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.navy3,
  },
});
