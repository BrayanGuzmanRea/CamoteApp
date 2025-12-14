import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Modal, FlatList, Image, Platform, PermissionsAndroid, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { RootStackParamList, PhotoAsset } from '../../App'; // Importamos PhotoAsset

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  // CAMBIO: Estado guarda objetos PhotoAsset
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoAsset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'yolov8' | 'yolov11'>('yolov11');

  const checkGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  const handleOpenGallery = async () => {
    const hasPermission = await checkGalleryPermission();
    if (!hasPermission) {
      Alert.alert("Permiso Requerido", "Habilita 'Permitir Todo' en configuración.", [{ text: "Configurar", onPress: () => Linking.openSettings() }, { text: "Cancelar" }]);
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed', // Ver todo (50MP)
        selectionLimit: 0,
        quality: 1,
        includeExtra: true,
      });

      if (result.assets && result.assets.length > 0) {
        // Mapeamos a PhotoAsset con dimensiones
        const validAssets: PhotoAsset[] = result.assets
          .filter(a => a.uri && a.width && a.height)
          .map(a => ({
            uri: a.uri!,
            width: a.width!,
            height: a.height!
          }));
        
        setSelectedPhotos(validAssets);
        setShowModal(true);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const removePhoto = (uri: string) => {
    const list = selectedPhotos.filter(p => p.uri !== uri);
    setSelectedPhotos(list);
    if (list.length === 0) setShowModal(false);
  };

  const handleAnalyzeGallery = () => {
    console.log('🟢 [HomeScreen] Botón ANALIZAR presionado');
    console.log(`🟢 [HomeScreen] Fotos a analizar: ${selectedPhotos.length}`);
    console.log(`🟢 [HomeScreen] Modelo seleccionado: ${selectedModel}`);
    console.log('🟢 [HomeScreen] Datos de fotos:', JSON.stringify(selectedPhotos));

    setShowModal(false);
    console.log('🟢 [HomeScreen] Navegando a ResultsScreen...');
    navigation.navigate('Results', { photos: selectedPhotos, modelName: selectedModel });
    console.log('🟢 [HomeScreen] Navegación iniciada');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Detección de Gusano Minador</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>Offline v0.0.4</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Modelo IA:</Text>
          <View style={styles.row}>
            {['yolov8', 'yolov11'].map((m) => (
              <TouchableOpacity key={m} style={[styles.modelBtn, selectedModel === m && styles.modelBtnActive]} onPress={() => setSelectedModel(m as any)}>
                <Text style={[styles.modelTxt, selectedModel === m && styles.modelTxtActive]}>{m.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.card, { borderLeftColor: '#15803d' }]} onPress={() => navigation.navigate('Detection', { modelName: selectedModel })}>
            <Text style={styles.emoji}>📷</Text>
            <View><Text style={styles.cardTitle}>Nueva Captura</Text><Text style={styles.cardSub}>Usar cámara</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { borderLeftColor: '#3b82f6' }]} onPress={handleOpenGallery}>
            <Text style={styles.emoji}>🖼️</Text>
            <View><Text style={styles.cardTitle}>Cargar Fotos</Text><Text style={styles.cardSub}>Galería (50MP)</Text></View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide">
        <View style={styles.modalBg}>
          <Text style={styles.modalTitle}>Galería ({selectedPhotos.length})</Text>
          <FlatList 
            data={selectedPhotos} numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <Image source={{ uri: item.uri }} style={{ flex: 1 }} />
                <TouchableOpacity style={styles.delBtn} onPress={() => removePhoto(item.uri)}><Text>✕</Text></TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity style={styles.confirmBtn} onPress={handleAnalyzeGallery}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>ANALIZAR AHORA</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, alignItems: 'center', backgroundColor: 'white' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  badge: { backgroundColor: '#dcfce7', padding: 4, borderRadius: 8, marginTop: 5 },
  badgeText: { color: '#166534', fontWeight: 'bold', fontSize: 10 },
  section: { padding: 20 },
  label: { marginBottom: 10, fontWeight: 'bold', color: '#64748b' },
  row: { flexDirection: 'row', gap: 10 },
  modelBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, alignItems: 'center', backgroundColor: 'white' },
  modelBtnActive: { borderColor: '#15803d', backgroundColor: '#f0fdf4' },
  modelTxt: { fontWeight: '600', color: '#64748b' },
  modelTxtActive: { color: '#15803d', fontWeight: 'bold' },
  card: { flexDirection: 'row', padding: 20, backgroundColor: 'white', borderRadius: 15, marginBottom: 15, elevation: 3, borderLeftWidth: 5, alignItems: 'center', gap: 15 },
  emoji: { fontSize: 30 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  cardSub: { color: '#64748b' },
  modalBg: { flex: 1, backgroundColor: '#111827', padding: 20 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  gridItem: { flex: 1, height: 200, margin: 5, borderRadius: 10, overflow: 'hidden' },
  delBtn: { position: 'absolute', right: 5, top: 5, backgroundColor: 'red', width: 25, height: 25, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { backgroundColor: '#15803d', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 }
});

export default HomeScreen;