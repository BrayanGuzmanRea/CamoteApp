/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importamos la pantalla que acabamos de crear
import HomeScreen from './src/screens/HomeScreen';

// Aquí importaremos DetectionScreen en el futuro
// import DetectionScreen from './src/screens/DetectionScreen';

// Definimos las rutas
export type RootStackParamList = {
  Home: undefined;
  Detection: undefined; // Ruta futura
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        
        {/* Pantalla de Inicio */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} // Ocultamos la barra de navegación por defecto
        />

        {/* Aquí agregaremos la pantalla de detección más adelante:
          <Stack.Screen name="Detection" component={DetectionScreen} /> 
        */}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;