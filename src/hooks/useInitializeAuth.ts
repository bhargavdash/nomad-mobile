import * as Linking from 'expo-linking';
import { useEffect } from 'react';

import { api } from '../lib/api';
import { handleOAuthRedirect } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

async function handleAuthDeepLink(url: string) {
  const parsed = Linking.parse(url);
  if (parsed.path !== 'auth/callback') return;
  await handleOAuthRedirect(url);
}

export function useInitializeAuth() {
  const { setSession, setInitialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        api.post('/auth/sync').catch(() => {});
      }
    });

    const linkSub = Linking.addEventListener('url', (event: { url: string }) =>
      handleAuthDeepLink(event.url),
    );

    Linking.getInitialURL().then((url: string | null) => {
      if (url) handleAuthDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);
}
