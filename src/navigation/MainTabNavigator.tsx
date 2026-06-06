import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import BottomTabBar from '../components/Navigation/BottomTabBar';
import Home from '../screens/Home';
import InTripCompanion from '../screens/InTripCompanion';
import MyTrips from '../screens/MyTrips';
import Profile from '../screens/Profile';

import type { RootStackParamList } from './RootNavigator';

const SCREENS: Record<string, React.ComponentType> = {
  home: Home,
  mytrips: MyTrips,
  today: InTripCompanion,
  profile: Profile,
};

export default function MainTabNavigator() {
  const [activeTab, setActiveTab] = useState('home');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleTabPress = useCallback(
    (key: string) => {
      if (key === 'plan') {
        navigation.navigate('PlanModal');
        return;
      }
      setActiveTab(key);
    },
    [navigation],
  );

  const ActiveScreen = SCREENS[activeTab] ?? Home;

  return (
    <View style={styles.container}>
      <ActiveScreen />
      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
