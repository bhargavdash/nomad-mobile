import { NativeStackScreenProps } from '@react-navigation/native-stack';
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

import { supabase } from '../../lib/supabase';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export default function VerifyEmail({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (code.length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    setLoading(false);
    if (error) {
      Alert.alert('Verification failed', error.message);
    }
    // On success verifyOtp returns a session — the auth listener in
    // RootNavigator picks it up and navigates into the app.
  }

  async function handleResend() {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) {
      Alert.alert('Could not resend', error.message);
    } else {
      Alert.alert('Code sent', `We emailed a new code to ${email}.`);
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
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Verification code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.muted}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>

          <Pressable style={styles.resend} onPress={handleResend} disabled={resending}>
            {resending ? (
              <ActivityIndicator color={colors.ember} size="small" />
            ) : (
              <Text style={styles.resendText}>Resend code</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Wrong email? </Text>
          <Pressable onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>Sign up again</Text>
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
    lineHeight: 22,
    marginBottom: 8,
  },
  emailText: {
    fontFamily: 'DMSans_600SemiBold',
    color: colors.ink,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: colors.ink,
  },
  codeInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontFamily: 'DMMono_500Medium',
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: 8,
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
  resend: { alignItems: 'center', paddingVertical: 4 },
  resendText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: colors.ember,
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
