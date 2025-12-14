import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, PhotoAsset } from '../../App';

const DetectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Detection'>>();
  const { modelName } = route.params;

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showGallery, setShowGallery] = useState(false);

  if (!hasPermission) requestPermission();
  if (!device) return <Text>Cargando Cámara...</Text>;

  const takePhoto = async () => {
    if (camera.current) {
      const p = await camera.current.takePhoto({ flash: 'off', enableShutterSound: true });
      setPhotos([...photos, `file://${p.path}`]);
    }
  };

  const analyze = async () => {
    setShowGallery(false);
    
    // Convertimos URIs a PhotoAssets calculando dimensiones
    // Esto es rápido porque son pocas fotos
    const assetsPromises = photos.map(uri => new Promise<PhotoAsset | null>((resolve) => {
        Image.getSize(uri, (width, height) => {
            resolve({ uri, width, height });
        }, () => resolve(null));
    }));

    const validAssets = (await Promise.all(assetsPromises)).filter((a): a is PhotoAsset => a !== null);

    navigation.navigate('Results', { photos: validAssets, modelName });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={!showGallery} photo={true} />
      
      <View style={styles.ui}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnSmall}><Text style={styles.txt}>Salir</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setShowGallery(true)} style={styles.btnSmall}><Text style={styles.txt}>{photos.length} 📸</Text></TouchableOpacity>
      </View>

      <TouchableOpacity onPress={takePhoto} style={styles.shutter} />
      
      {photos.length > 0 && !showGallery && (
        <TouchableOpacity onPress={analyze} style={styles.analyzeBtn}>
          <Text style={styles.txt}>ANALIZAR ({modelName.toUpperCase()})</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showGallery} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#111' }}>
          <FlatList 
            data={photos} numColumns={2} 
            renderItem={({item}) => <Image source={{uri: item}} style={{flex: 1, height: 200, margin: 5}} />}
          />
          <TouchableOpacity onPress={analyze} style={styles.bigBtn}><Text style={styles.txt}>CONFIRMAR</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowGallery(false)} style={[styles.bigBtn, {backgroundColor: 'red'}]}><Text style={styles.txt}>VOLVER</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  ui: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  btnSmall: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },
  txt: { color: 'white', fontWeight: 'bold' },
  shutter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', position: 'absolute', bottom: 40, alignSelf: 'center', borderWidth: 5, borderColor: '#ccc' },
  analyzeBtn: { position: 'absolute', bottom: 40, right: 20, backgroundColor: '#15803d', padding: 15, borderRadius: 30 },
  bigBtn: { padding: 20, backgroundColor: '#15803d', alignItems: 'center', margin: 10, borderRadius: 10 }
});

export default DetectionScreen;