import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UserAvatar from '@components/Misc/UserAvatar';
import { useAuthStore } from '@store/authStore';
import { colors } from '@theme/colors';
import { layout, spacing } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, profile, loading, fetchProfile, updateDisplayName, signOut } = useAuthStore();

  const [editVisible, setEditVisible] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Prefer API profile data, fall back to Supabase JWT metadata
  const avatarUrl: string | null = profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? null;
  const displayName: string =
    profile?.displayName ?? user?.user_metadata?.full_name ?? user?.email ?? 'Traveller';
  const email: string = profile?.email ?? user?.email ?? '';
  const initial: string = displayName[0]?.toUpperCase() ?? '?';

  function openEdit() {
    setEditValue(displayName);
    setEditVisible(true);
  }

  async function handleSave() {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await updateDisplayName(trimmed);
    } catch {
      Alert.alert('Error', 'Could not update name. Please try again.');
    } finally {
      setSaving(false);
      setEditVisible(false);
    }
  }

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Screen title */}
      <Text style={styles.screenTitle}>Profile</Text>

      {/* Profile card */}
      <View style={styles.card}>
        <UserAvatar uri={avatarUrl} initial={initial} size={72} />

        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{displayName}</Text>
          <Pressable onPress={openEdit} style={styles.editButton} hitSlop={8}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        {email ? <Text style={styles.cardEmail}>{email}</Text> : null}
      </View>

      {/* Sign out — bottom of screen */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
          onPress={confirmSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.ember} size="small" />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
      </View>

      {/* Edit name modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setEditVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit name</Text>

            <TextInput
              style={styles.input}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Your display name"
              placeholderTextColor={colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <View style={styles.sheetActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setEditVisible(false)}
                hitSlop={8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: layout.screenPadding,
  },
  screenTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 28,
  },

  // Profile card
  card: {
    backgroundColor: colors.warmWhite,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardName: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    color: colors.ink,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  editButtonText: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    color: colors.muted,
  },
  cardEmail: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.muted,
  },

  // Footer / Sign out
  footer: {
    position: 'absolute',
    bottom: 0,
    left: layout.screenPadding,
    right: layout.screenPadding,
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
  },
  signOutPressed: {
    backgroundColor: colors.emberLight,
    borderColor: colors.ember,
  },
  signOutText: {
    fontFamily: fontFamily.label,
    fontSize: 15,
    color: colors.ember,
  },

  // Edit modal / bottom sheet
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,37,32,0.35)',
  },
  sheet: {
    backgroundColor: colors.warmWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 100,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    color: colors.ink,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: fontFamily.label,
    fontSize: 15,
    color: colors.muted,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 100,
    backgroundColor: colors.navy,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontFamily: fontFamily.label,
    fontSize: 15,
    color: colors.white,
  },
});
