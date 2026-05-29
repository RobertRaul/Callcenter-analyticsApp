import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RealtimeAgent } from '../services/agentsApi';
import AgentsListScreen  from '../screens/agents/AgentsListScreen';
import AgentDetailScreen from '../screens/agents/AgentDetailScreen';

export type AgentsStackParamList = {
  AgentsList:  undefined;
  AgentDetail: { agent: RealtimeAgent };
};

const Stack = createNativeStackNavigator<AgentsStackParamList>();

export default function AgentsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgentsList"  component={AgentsListScreen}  />
      <Stack.Screen name="AgentDetail" component={AgentDetailScreen} />
    </Stack.Navigator>
  );
}
