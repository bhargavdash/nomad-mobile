import type { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useInitializeAuth } from '../hooks/useInitializeAuth';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import PlanModalNavigator, { type PlanModalParamList } from './PlanModalNavigator';

export type RootStackParamList = {
  Main: undefined;
  PlanModal: NavigatorScreenParams<PlanModalParamList> | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, initialized } = useAuthStore();

  useInitializeAuth();

  // Splash — wait for session restore before deciding which stack to show
  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.cream,
        }}
      >
        <ActivityIndicator color={colors.ember} size="large" />
      </View>
    );
  }

  // Not logged in → Auth screens
  if (!session) {
    return <AuthNavigator />;
  }

  // Logged in → Main app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="PlanModal" component={PlanModalNavigator} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
