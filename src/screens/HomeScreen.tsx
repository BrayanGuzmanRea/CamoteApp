import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Modal, FlatList, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'yolov8' | 'yolov11'>('yolov11');

  const handleOpenGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 0, quality: 1 });
    if (result.assets && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri).filter((u): u is string => !!u);
      setSelectedPhotos(uris);
      setShowModal(true);
    }
  };

  const removePhoto = (uri: string) => {
    const list = selectedPhotos.filter(p => p !== uri);
    setSelectedPhotos(list);
    if (list.length === 0) setShowModal(false);
  };

  const handleAnalyzeGallery = () => {
    setShowModal(false);
    navigation.navigate('Results', { photos: selectedPhotos, modelName: selectedModel });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Detección de Gusano Minador</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>Offline v0.0.2</Text></View>
        </View>

        {/* Selector de Modelo */}
        <View style={styles.section}>
          <Text style={styles.label}>Motor de Inteligencia Artificial:</Text>
          <View style={styles.row}>
            {['yolov8', 'yolov11'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modelBtn, selectedModel === m && styles.modelBtnActive]}
                onPress={() => setSelectedModel(m as any)}
              >
                <Text style={[styles.modelTxt, selectedModel === m && styles.modelTxtActive]}>
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botones */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.card, { borderLeftColor: '#15803d' }]}
            onPress={() => navigation.navigate('Detection', { modelName: selectedModel })}
          >
            <Text style={styles.emoji}>📷</Text>
            <View>
              <Text style={styles.cardTitle}>Nueva Captura</Text>
              <Text style={styles.cardSub}>Usar cámara con {selectedModel.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, { borderLeftColor: '#3b82f6' }]}
            onPress={handleOpenGallery}
          >
            <Text style={styles.emoji}>🖼️</Text>
            <View>
              <Text style={styles.cardTitle}>Cargar Fotos</Text>
              <Text style={styles.cardSub}>Desde galería con {selectedModel.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Galería */}
      <Modal visible={showModal} animationType="slide">
        <View style={styles.modalBg}>
          <Text style={styles.modalTitle}>Galería ({selectedPhotos.length})</Text>
          <FlatList 
            data={selectedPhotos}
            numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <Image source={{ uri: item }} style={{ flex: 1 }} />
                <TouchableOpacity style={styles.delBtn} onPress={() => removePhoto(item)}><Text>✕</Text></TouchableOpacity>
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