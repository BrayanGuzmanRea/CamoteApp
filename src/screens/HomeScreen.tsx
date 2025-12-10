import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

type RootStackParamList = {
  Home: undefined;
  Detection: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  
  // --- ESTADOS ---
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  // --- FUNCIÓN: ABRIR GALERÍA ---
  const handleOpenGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 0, // 0 = Múltiples fotos
        quality: 1,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        // Extraemos solo las URIs (rutas) de las fotos
        // Filtramos para asegurar que no haya nulos
        const uris = result.assets
          .map(asset => asset.uri)
          .filter((uri): uri is string => !!uri);
        
        setSelectedPhotos(uris);
        setShowModal(true); // <--- ABRIMOS EL RESUMEN
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  // --- FUNCIÓN: ELIMINAR FOTO DEL RESUMEN ---
  const removePhoto = (uriToRemove: string) => {
    const updatedList = selectedPhotos.filter(uri => uri !== uriToRemove);
    setSelectedPhotos(updatedList);
    // Si borra todas, cerramos el modal automáticamente
    if (updatedList.length === 0) setShowModal(false);
  };

  // --- FUNCIÓN: PROCESAR (Mandar a IA) ---
  const handleAnalyzeGallery = () => {
    setShowModal(false);
    console.log("Enviando fotos de galería a procesar:", selectedPhotos);
    Alert.alert("Procesando", `Analizando ${selectedPhotos.length} imágenes...`);
    // AQUÍ CONECTAREMOS CON LA LÓGICA DE RECORTE (TILING) EN LA FASE 3
  };

  // --- RENDER ITEM (CADA FOTO EN EL MODAL) ---
  const renderGalleryItem = ({ item }: { item: string }) => (
    <View style={styles.gridItem}>
      <Image source={{ uri: item }} style={styles.gridImage} />
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => removePhoto(item)}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.uniText}>Universidad Señor de Sipán</Text>
          <Text style={styles.thesisTitle}>Detección de Gusano Minador</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Offline v0.0.1</Text>
          </View>
        </View>

        {/* Bienvenida */}
        <View style={styles.introSection}>
          <Text style={styles.welcomeText}>Hola, Agricultor 👋</Text>
          <Text style={styles.subText}>Selecciona una opción para comenzar el diagnóstico.</Text>
        </View>

        {/* Botones Principales */}
        <View style={styles.actionsContainer}>
          {/* CÁMARA */}
          <TouchableOpacity 
            style={[styles.cardButton, styles.cameraCard]}
            onPress={() => navigation.navigate('Detection')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.emoji}>📷</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Nueva Captura</Text>
              <Text style={styles.cardDesc}>Usar la cámara en campo.</Text>
            </View>
          </TouchableOpacity>

          {/* GALERÍA */}
          <TouchableOpacity 
            style={[styles.cardButton, styles.galleryCard]}
            onPress={handleOpenGallery}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, styles.galleryIcon]}>
              <Text style={styles.emoji}>🖼️</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Cargar Fotos</Text>
              <Text style={styles.cardDesc}>Seleccionar de la galería.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Recuerda:</Text>
          <Text style={styles.infoText}>Asegúrate de que las fotos estén bien enfocadas y a 45cm de distancia.</Text>
        </View>

      </ScrollView>

      {/* --- MODAL DE RESUMEN (Igual al de la Cámara) --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Cabecera Modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Galería Seleccionada ({selectedPhotos.length})</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Fotos */}
          <FlatList
            data={selectedPhotos}
            renderItem={renderGalleryItem}
            keyExtractor={(item, index) => item + index}
            numColumns={2}
            contentContainerStyle={{ padding: 10 }}
          />

          {/* Botón de Acción */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.fullWidthButton} onPress={handleAnalyzeGallery}>
              <Text style={styles.fullWidthButtonText}>CONFIRMAR Y ANALIZAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- ESTILOS PRINCIPALES ---
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 30 },
  header: {
    backgroundColor: '#ffffff', padding: 24, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center',
  },
  uniText: { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  thesisTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: '#166534', fontSize: 10, fontWeight: '700' },
  introSection: { padding: 24 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  subText: { fontSize: 16, color: '#64748b', lineHeight: 24 },
  actionsContainer: { paddingHorizontal: 20 },
  
  // Tarjetas
  cardButton: {
    flexDirection: 'row', backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 16, alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  cameraCard: { borderLeftWidth: 6, borderLeftColor: '#15803d' },
  galleryCard: { borderLeftWidth: 6, borderLeftColor: '#3b82f6' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  galleryIcon: { backgroundColor: '#dbeafe' },
  emoji: { fontSize: 28 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  
  infoBox: {
    margin: 20, padding: 16, backgroundColor: '#fffbeb', borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d',
  },
  infoTitle: { fontWeight: 'bold', color: '#b45309', marginBottom: 4 },
  infoText: { color: '#b45309', fontSize: 13 },

  // --- ESTILOS DEL MODAL (Igual a DetectionScreen) ---
  modalContainer: { flex: 1, backgroundColor: '#111827' }, // Fondo oscuro
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#374151', backgroundColor: '#1f2937',
  },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 8 },
  closeText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  
  gridItem: {
    flex: 1, margin: 5, height: 200, borderRadius: 10, overflow: 'hidden', position: 'relative', backgroundColor: '#374151'
  },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  deleteButton: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#1f2937' },
  fullWidthButton: {
    backgroundColor: '#3b82f6', // Azul para diferenciar de la cámara (o usa verde #15803d)
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  fullWidthButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});

export default HomeScreen;