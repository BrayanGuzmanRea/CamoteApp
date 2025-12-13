import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import DetectionScreen from './src/screens/DetectionScreen';
import ResultsScreen from './src/screens/ResultsScreen';

export type RootStackParamList = {
  Home: undefined;
  Detection: { modelName: 'yolov8' | 'yolov11' };
  Results: { photos: string[]; modelName: 'yolov8' | 'yolov11' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Detection" component={DetectionScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;