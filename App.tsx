/**
 * Archivo de prueba simple para verificar que React Native funciona
 * Si este archivo funciona, el problema está en la navegación
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importar las pantallas
import HomeScreen from './src/screens/HomeScreen';
import DetectionScreen from './src/screens/DetectionScreen';

// Definir tipos de rutas
export type RootStackParamList = {
  Home: undefined;
  Detection: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // Ocultamos la barra superior por defecto
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Detection" component={DetectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;