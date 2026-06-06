import React, { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import UserAvatar from '@components/Misc/UserAvatar';
import { useAuthStore } from '@store/authStore';
import { colors } from '@theme/colors';
import { layout } from '@theme/spacing';
import { fontFamily } from '@theme/typography';

function getInitial(fullName?: string, email?: string): string {
  if (fullName) return fullName.trim()[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

export default function HomeHeader() {
  const { user, profile, signOut } = useAuthStore();
  const avatarUrl: string | null = profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? null;
  const initial = getInitial(profile?.displayName ?? user?.user_metadata?.full_name, user?.email);

  const avatarRef = useRef<View>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [menuVisible, setMenuVisible] = useState(false);

  function openMenu() {
    avatarRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setMenuPos({
        top: pageY + height + 8,
        right: layout.screenPadding,
      });
      setMenuVisible(true);
    });
  }

  function handleSignOut() {
    setMenuVisible(false);
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={styles.row}>
      <Text style={styles.greeting}>
        Greetings <Text style={styles.nomad}>nomad</Text>
      </Text>

      <Pressable onPress={openMenu} hitSlop={10}>
        <View ref={avatarRef}>
          <UserAvatar uri={avatarUrl} initial={initial} />
        </View>
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { top: menuPos.top, right: menuPos.right }]}>
            <Pressable style={styles.menuItem} onPress={handleSignOut}>
              <Text style={styles.menuItemText}>Sign out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  greeting: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    color: colors.ink,
  },
  nomad: {
    color: colors.ember,
    fontStyle: 'italic',
  },
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.warmWhite,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    minWidth: 140,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: fontFamily.label,
    fontSize: 15,
    color: colors.ember,
  },
});
