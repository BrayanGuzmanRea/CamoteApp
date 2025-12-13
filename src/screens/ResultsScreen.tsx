import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { analyzeImage, Detection } from '../utils/YoloService';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

const ResultsScreen = ({ route, navigation }: Props) => {
  console.log('🟢 [ResultsScreen] Componente iniciado');
  const { photos, modelName } = route.params;
  console.log(`🟢 [ResultsScreen] Parámetros recibidos - Photos: ${photos.length}, Model: ${modelName}`);

  const [results, setResults] = useState<{ uri: string; detections: Detection[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🟡 [ResultsScreen] useEffect ejecutado - Iniciando análisis');
    const run = async () => {
      try {
        console.log('🟡 [ResultsScreen] Función run() iniciada');
        const res = [];

        for (let i = 0; i < photos.length; i++) {
          const uri = photos[i];
          console.log(`🔵 [ResultsScreen] Analizando foto ${i + 1}/${photos.length}: ${uri}`);

          const dets = await analyzeImage(uri, modelName);
          console.log(`✅ [ResultsScreen] Foto ${i + 1} analizada - Detecciones: ${dets.length}`);

          res.push({ uri, detections: dets });
        }

        console.log('✅ [ResultsScreen] Todas las fotos analizadas, actualizando estado');
        setResults(res);
        setLoading(false);
        console.log('✅ [ResultsScreen] Estado actualizado, loading=false');
      } catch (error) {
        console.error('❌ [ResultsScreen] ERROR en run():', error);
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#15803d" />
      <Text style={styles.loadingTxt}>Procesando con {modelName.toUpperCase()}...</Text>
      <Text>Recortando y ejecutando TFLite</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc', padding: 15 }}>
      <Text style={styles.title}>Resultados</Text>
      
      {results.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.imgBox}>
            <Image source={{ uri: item.uri }} style={styles.img} />
            {item.detections.map((d, i) => (
              <View key={i} style={[styles.box, {
                  left: d.box.x / 4, top: d.box.y / 4, width: d.box.width / 4, height: d.box.height / 4
                }]} 
              />
            ))}
          </View>
          <Text style={{ marginTop: 10 }}>Plagas: <Text style={{ fontWeight: 'bold', color: 'red' }}>{item.detections.length}</Text></Text>
        </View>
      ))}

      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.btn}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>FINALIZAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#15803d' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0f172a' },
  card: { backgroundColor: 'white', padding: 10, borderRadius: 15, marginBottom: 20, elevation: 3 },
  imgBox: { height: 300, width: '100%', borderRadius: 10, overflow: 'hidden', position: 'relative' },
  img: { width: '100%', height: '100%', resizeMode: 'contain' },
  box: { position: 'absolute', borderWidth: 2, borderColor: 'red', backgroundColor: 'rgba(255,0,0,0.2)' },
  btn: { backgroundColor: '#15803d', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 40 }
});

export default ResultsScreen;