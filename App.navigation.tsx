/**
 * App con React Navigation
 * Versión con manejo de errores mejorado
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';

// Importamos la pantalla
import HomeScreen from './src/screens/HomeScreen';

// Definimos las rutas
export type RootStackParamList = {
  Home: undefined;
  Detection: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Pantalla de error de navegación
const NavigationErrorScreen = () => (
  <SafeAreaView style={errorStyles.container}>
    <View style={errorStyles.content}>
      <Text style={errorStyles.title}>⚠️ Error de Navegación</Text>
      <Text style={errorStyles.text}>
        No se puede navegar a "Detection" porque esa pantalla aún no existe.
      </Text>
      <Text style={errorStyles.text}>
        Esta pantalla se implementará próximamente.
      </Text>
    </View>
  </SafeAreaView>
);

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
});

function App(): React.JSX.Element {
  return (
    <NavigationContainer
      onStateChange={(state) => {
        // Log para debugging
        console.log('Navigation state changed:', state);
      }}
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando navegación...</Text>
        </View>
      }
    >
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Pantalla de Inicio */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        {/* Pantalla temporal de error para Detection */}
        <Stack.Screen
          name="Detection"
          component={NavigationErrorScreen}
          options={{ headerShown: true, title: 'Detección (Próximamente)' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
