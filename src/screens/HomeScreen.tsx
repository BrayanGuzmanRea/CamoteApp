import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// Definimos los tipos para la navegación (TypeScript)
// Esto ayuda a que VS Code te sugiera los nombres de las pantallas
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Asumimos que tus rutas se llaman 'Home' y 'Detection'
type RootStackParamList = {
  Home: undefined;
  Detection: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {

  const handleStart = () => {
    // Navegar a la pantalla de detección (que crearemos luego)
    // Por ahora, si presionas el botón dará error hasta que configuremos la ruta
    navigation.navigate('Detection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />
      
      {/* 1. Encabezado / Título */}
      <View style={styles.header}>
        <Text style={styles.uniText}>Universidad Señor de Sipán</Text>
        <Text style={styles.title}>Detección de Gusano Minador</Text>
        <Text style={styles.subtitle}>Cultivo de Camote</Text>
      </View>

      {/* 2. Área Central (Imagen o Icono representativo) */}
      <View style={styles.centerContent}>
        {/* Aquí podrías poner el logo de la USS o un ícono de una hoja */}
        {/* Por ahora usaremos un contenedor visual simple */}
        <View style={styles.iconPlaceholder}>
          <Text style={styles.iconText}>🍠</Text>
        </View>
        
        <Text style={styles.instructionsTitle}>Instrucciones:</Text>
        <View style={styles.instructionItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.instructionText}>Mantén el celular a 45cm de la hoja.</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.instructionText}>Asegúrate de tener buena iluminación.</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.instructionText}>Enfoca directamente el daño visible.</Text>
        </View>
      </View>

      {/* 3. Botón de Acción */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>INICIAR ESCANEO</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Versión Tesis 1.0.0 (Offline)</Text>
      </View>
    </SafeAreaView>
  );
};

// Estilos (Diseño visual)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Gris muy claro de fondo
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  uniText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#15803d', // Verde agrícola
    fontWeight: '500',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconPlaceholder: {
    alignSelf: 'center',
    backgroundColor: '#dcfce7', // Verde muy suave
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#15803d',
  },
  iconText: {
    fontSize: 50,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 18,
    color: '#15803d',
    marginRight: 8,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#15803d', // Verde principal
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  versionText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 12,
  },
});

export default HomeScreen;