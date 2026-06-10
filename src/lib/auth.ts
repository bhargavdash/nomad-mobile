import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

import { supabase } from './supabase';

/**
 * OAuth/deep-link callback URL derived from the app scheme in app.json
 * ("nomad-mobile"). Must be listed in Supabase → Auth → URL Configuration →
 * Redirect URLs. Never hardcode the scheme — Android resolves callbacks via
 * the manifest intent filter, so a mismatched scheme dead-ends silently.
 */
export const authRedirectUrl = Linking.createURL('auth/callback');

/**
 * Parses key=value pairs from a URL fragment (#...).
 * Linking.parse only handles query params, not fragments.
 */
function parseFragment(url: string): Record<string, string> {
  const hash = url.split('#')[1];
  if (!hash) return {};
  return Object.fromEntries(
    hash.split('&').map((pair) => {
      const eq = pair.indexOf('=');
      return eq === -1 ? [pair, ''] : [pair.slice(0, eq), decodeURIComponent(pair.slice(eq + 1))];
    }),
  );
}

/**
 * Handles the OAuth redirect URL returned by WebBrowser.openAuthSessionAsync
 * or received as a deep link. Supports both:
 *   - PKCE flow: ?code= in query params → exchangeCodeForSession
 *   - Implicit flow: #access_token= & #refresh_token= in fragment → setSession
 *
 * Returns true if a session was established, false otherwise.
 */
export async function handleOAuthRedirect(url: string): Promise<boolean> {
  // PKCE code flow
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code as string | undefined;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) Alert.alert('Sign in failed', error.message);
    return !error;
  }

  // Implicit flow — tokens arrive in the URL fragment
  const fragment = parseFragment(url);
  if (fragment.access_token && fragment.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: fragment.access_token,
      refresh_token: fragment.refresh_token,
    });
    if (error) Alert.alert('Sign in failed', error.message);
    return !error;
  }

  return false;
}
