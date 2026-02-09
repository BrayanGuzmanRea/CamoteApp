import Slider from '@react-native-community/slider';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { PhotoAsset, RootStackParamList } from '../../App';

const DetectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Detection'>>();
  const { modelName } = route.params;

  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [threshold, setThreshold] = useState(0.5);

  const takePhoto = async () => {
    const result: ImagePickerResponse = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      saveToPhotos: true,
      quality: 1,
      includeBase64: false,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert(
        'Error',
        result.errorMessage || 'No se pudo capturar la foto',
      );
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.uri && asset.width && asset.height) {
        setPhotos([
          ...photos,
          {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
          },
        ]);
      }
    }
  };

  const selectFromGallery = async () => {
    const result: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 10,
      quality: 1,
      includeBase64: false,
    });

    if (result.didCancel || !result.assets) {
      return;
    }

    const newPhotos: PhotoAsset[] = result.assets
      .filter(
        (
          asset,
        ): asset is Asset & { uri: string; width: number; height: number } =>
          !!asset.uri && !!asset.width && !!asset.height,
      )
      .map(asset => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      }));

    setPhotos([...photos, ...newPhotos]);
  };

  const analyze = async () => {
    setShowGallery(false);
    navigation.navigate('Results', { photos, modelName, threshold });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View style={styles.ui}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnSmall}
        >
          <Text style={styles.txt}>← Salir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowGallery(true)}
          style={styles.btnSmall}
        >
          <Text style={styles.txt}>{photos.length} 📸</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.title}>Captura de Hojas</Text>
        <Text style={styles.subtitle}>Modelo: {modelName.toUpperCase()}</Text>

        {/* Slider de threshold */}
        <View style={{ marginVertical: 20, paddingHorizontal: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#64748b', fontSize: 12 }}>Bajo</Text>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {(threshold * 100).toFixed(0)}%
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Alto</Text>
          </View>
          <Slider
            minimumValue={0.2}
            maximumValue={0.9}
            step={0.05}
            value={threshold}
            onValueChange={setThreshold}
            minimumTrackTintColor="#15803d"
            maximumTrackTintColor="#cbd5e1"
            thumbTintColor="#15803d"
          />
          <Text
            style={{
              color: '#94a3b8',
              fontSize: 11,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Umbral de Confianza
          </Text>
        </View>

        <TouchableOpacity onPress={takePhoto} style={styles.cameraBtn}>
          <Text style={styles.cameraBtnText}>📷 TOMAR FOTO</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={selectFromGallery} style={styles.galleryBtn}>
          <Text style={styles.galleryBtnText}>🖼️ SELECCIONAR DE GALERÍA</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showGallery} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#111' }}>
          <FlatList
            data={photos}
            numColumns={2}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.uri }}
                style={{ flex: 1, height: 200, margin: 5 }}
              />
            )}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
          />
          <TouchableOpacity onPress={analyze} style={styles.bigBtn}>
            <Text style={styles.txt}>✓ CONFIRMAR Y ANALIZAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowGallery(false)}
            style={[styles.bigBtn, { backgroundColor: 'red' }]}
          >
            <Text style={styles.txt}>← VOLVER</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  ui: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 40,
  },
  cameraBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    minWidth: 250,
    alignItems: 'center',
  },
  cameraBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  galleryBtn: {
    backgroundColor: '#1e40af',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 250,
    alignItems: 'center',
  },
  galleryBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnSmall: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  txt: {
    color: 'white',
    fontWeight: 'bold',
  },
  analyzeBtn: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#15803d',
    padding: 15,
    borderRadius: 30,
  },
  bigBtn: {
    padding: 20,
    backgroundColor: '#15803d',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
  },
});

export default DetectionScreen;
