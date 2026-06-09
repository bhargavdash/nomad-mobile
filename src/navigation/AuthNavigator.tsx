import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import Landing from '../screens/auth/Landing';
import SignIn from '../screens/auth/SignIn';
import SignUp from '../screens/auth/SignUp';

export type AuthStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={Landing} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
  );
}
