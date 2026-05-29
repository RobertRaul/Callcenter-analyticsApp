import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Call } from '../services/callsApi';
import CallsListScreen from '../screens/calls/CallsListScreen';
import CallDetailScreen from '../screens/calls/CallDetailScreen';

export type CallsStackParamList = {
  CallsList:  undefined;
  CallDetail: { call: Call };
};

const Stack = createNativeStackNavigator<CallsStackParamList>();

export default function CallsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CallsList"   component={CallsListScreen} />
      <Stack.Screen name="CallDetail"  component={CallDetailScreen} />
    </Stack.Navigator>
  );
}
