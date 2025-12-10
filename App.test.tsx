/**
 * Archivo de prueba simple para verificar que React Native funciona
 * Si este archivo funciona, el problema está en la navegación
 */

import React from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';

function AppTest(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />
      <View style={styles.content}>
        <Text style={styles.title}>🍠 CamoteApp</Text>
        <Text style={styles.subtitle}>Prueba Simple</Text>
        <Text style={styles.text}>
          Si ves esta pantalla, React Native funciona correctamente.
        </Text>
        <Text style={styles.text}>
          El problema podría estar en React Navigation.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#15803d',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
});

export default AppTest;
