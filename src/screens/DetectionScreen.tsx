import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
} from 'react-native-vision-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DetectionScreen = () => {
  const navigation = useNavigation();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const camera = useRef<Camera>(null);

  // --- ESTADOS ---
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [showGallery, setShowGallery] = useState(false); // <--- NUEVO: Controla el Modal

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // --- FUNCIÓN: TOMAR CAPTURA ---
  const handleTakePhoto = useCallback(async () => {
    if (!camera.current || isTakingPhoto) return;

    try {
      setIsTakingPhoto(true);
      const photo: PhotoFile = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: true,
      });

      const photoPath = `file://${photo.path}`;
      setCapturedPhotos((prevPhotos) => [...prevPhotos, photoPath]);

    } catch (error) {
      Alert.alert('Error', 'No se pudo capturar la imagen.');
      console.error(error);
    } finally {
      setIsTakingPhoto(false);
    }
  }, [isTakingPhoto]);

  // --- FUNCIÓN: ELIMINAR FOTO DE LA LISTA ---
  const removePhoto = (pathToRemove: string) => {
    setCapturedPhotos(current => current.filter(p => p !== pathToRemove));
  };

  // --- FUNCIÓN: ANALIZAR ---
  const handleAnalyzeBatch = () => {
    setShowGallery(false); // Cerrar galería si está abierta
    if (capturedPhotos.length === 0) return;

    Alert.alert(
      'Listo para Procesar',
      `Se enviará un grupo de ${capturedPhotos.length} fotos para recorte (Tiling) y detección.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
            text: "PROCESAR", 
            onPress: () => console.log("Enviando a procesar:", capturedPhotos) 
            // Aquí llamaremos a la lógica de IA más adelante
        }
      ]
    );
  };

  if (!hasPermission) return <LoadingView message="Solicitando permisos..." />;
  if (device == null) return <LoadingView message="Iniciando cámara..." />;

  // --- RENDERIZADO DE CADA FOTO EN LA GALERÍA ---
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
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* --- CÁMARA --- */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && !showGallery} // Pausar cámara si vemos la galería
        photo={true}
      />

      {/* --- BARRA SUPERIOR --- */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Text style={styles.iconText}>← Salir</Text>
        </TouchableOpacity>
        
        {/* CONTADOR CLICKLEABLE (Abre la galería) */}
        <TouchableOpacity 
            style={styles.counterBadge} 
            onPress={() => setShowGallery(true)}
        >
            <Text style={styles.counterText}>{capturedPhotos.length} fotos 📸</Text>
        </TouchableOpacity>
      </View>

      {/* --- CONTROLES INFERIORES --- */}
      <View style={styles.bottomControls}>
        <View style={{flex: 1}} />
        
        {/* BOTÓN DISPARADOR */}
        <TouchableOpacity
            style={[styles.shutterButtonOuter, isTakingPhoto && styles.disabledButton]}
            onPress={handleTakePhoto}
            disabled={isTakingPhoto}
        >
            <View style={styles.shutterButtonInner} />
        </TouchableOpacity>

        {/* BOTÓN ANALIZAR */}
        <View style={{flex: 1, alignItems: 'flex-end'}}>
            {capturedPhotos.length > 0 && (
                <TouchableOpacity 
                    style={styles.analyzeButton}
                    onPress={handleAnalyzeBatch}
                >
                    <Text style={styles.analyzeText}>ANALIZAR 🚀</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>

      {/* --- MODAL: VISTA DE GALERÍA --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showGallery}
        onRequestClose={() => setShowGallery(false)}
      >
        <View style={styles.galleryContainer}>
            {/* Cabecera del Modal */}
            <View style={styles.galleryHeader}>
                <Text style={styles.galleryTitle}>Fotos Capturadas ({capturedPhotos.length})</Text>
                <TouchableOpacity onPress={() => setShowGallery(false)} style={styles.closeButton}>
                    <Text style={styles.closeText}>Cerrar</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de Fotos */}
            {capturedPhotos.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No has tomado fotos aún.</Text>
                </View>
            ) : (
                <FlatList
                    data={capturedPhotos}
                    renderItem={renderGalleryItem}
                    keyExtractor={(item) => item}
                    numColumns={2} // Dos columnas
                    contentContainerStyle={{ padding: 10 }}
                />
            )}

            {/* Botón de Acción en Galería */}
            {capturedPhotos.length > 0 && (
                <View style={styles.galleryFooter}>
                    <TouchableOpacity style={styles.fullWidthButton} onPress={handleAnalyzeBatch}>
                        <Text style={styles.fullWidthButtonText}>CONFIRMAR Y ANALIZAR</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
      </Modal>

    </View>
  );
};

// Componente de carga
const LoadingView = ({ message }: { message: string }) => (
  <View style={[styles.container, {backgroundColor: 'black'}]}>
    <ActivityIndicator size="large" color="#15803d" />
    <Text style={{ color: 'white', marginTop: 20 }}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  topBar: {
    position: 'absolute',
    top: 40, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 10,
  },
  iconButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },
  iconText: { color: 'white', fontWeight: 'bold' },
  counterBadge: {
    backgroundColor: '#15803d', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#4ade80',
  },
  counterText: { color: 'white', fontWeight: 'bold' },
  
  bottomControls: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  shutterButtonOuter: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'white',
  },
  shutterButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  disabledButton: { opacity: 0.5 },
  analyzeButton: {
    backgroundColor: '#15803d', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, elevation: 5,
  },
  analyzeText: { color: 'white', fontWeight: 'bold' },

  // --- ESTILOS DE LA GALERÍA ---
  galleryContainer: { flex: 1, backgroundColor: '#111827' },
  galleryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  galleryTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 8 },
  closeText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  
  gridItem: {
    flex: 1, margin: 5, height: 200, borderRadius: 10, overflow: 'hidden', position: 'relative',
  },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  deleteButton: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 16 },
  
  galleryFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#1f2937' },
  fullWidthButton: {
    backgroundColor: '#15803d', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  fullWidthButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});

export default DetectionScreen;