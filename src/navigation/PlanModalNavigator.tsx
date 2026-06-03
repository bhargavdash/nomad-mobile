import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ItineraryReveal from '@screens/ItineraryReveal';
import PlanTrip from '@screens/PlanTrip';
import ResearchTicker from '@screens/ResearchTicker';

/** Prefill payload when the user taps a trending destination on Home. */
export type TrendingPick = {
  name: string;
  country: string;
  duration: string;
  blurb: string;
  vibes: string[];
};

export type PlanModalParamList = {
  PlanTrip: { trendingPick?: TrendingPick } | undefined;
  ResearchTicker: { tripId: string };
  ItineraryReveal: { tripId: string };
};

const Stack = createNativeStackNavigator<PlanModalParamList>();

export default function PlanModalNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlanTrip" component={PlanTrip} />
      <Stack.Screen name="ResearchTicker" component={ResearchTicker} />
      <Stack.Screen name="ItineraryReveal" component={ItineraryReveal} />
    </Stack.Navigator>
  );
}
