import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authRedirectUrl, handleOAuthRedirect } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../theme/colors';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUp({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignUp() {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    // No emailRedirectTo — confirmation is done in-app via 6-digit OTP code
    // ({{ .Token }} in the Supabase email template), not a magic link.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else if (!data.session) {
      // Confirmation pending — verify via OTP code. If Supabase ever has
      // confirmation disabled, a session exists and the RootNavigator
      // auth listener navigates on its own.
      navigation.navigate('VerifyEmail', { email });
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const redirectTo = authRedirectUrl;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      setGoogleLoading(false);
      Alert.alert('Google sign in failed', error?.message ?? 'Could not start sign in');
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    setGoogleLoading(false);
    if (result.type === 'success') {
      await handleOAuthRedirect(result.url);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 36 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>nomad</Text>
          <Text style={styles.tagline}>Your AI travel companion</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start planning your next adventure</Text>

          {/* Google OAuth — primary CTA for new users */}
          <Pressable
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Alex Wanderer"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center', gap: 6 },
  wordmark: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.navy,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: colors.muted,
  },
  form: { gap: 20 },
  title: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: colors.ink,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: colors.muted,
    marginBottom: 8,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.ember,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: colors.muted,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
  },
  googleIcon: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: colors.muted,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: colors.ember,
  },
});
