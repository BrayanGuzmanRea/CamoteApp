import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import ViewShot from 'react-native-view-shot';
import { RootStackParamList } from '../../App';
import { ImageTile } from '../utils/ImageProcessor';
import { analyzeImage, Detection } from '../utils/YoloService';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

const ResultsScreen = ({ route, navigation }: Props) => {
  console.log('🟢 [ResultsScreen] Componente iniciado');
  const { photos, modelName, threshold } = route.params; // photos ahora es PhotoAsset[]
  console.log(
    `🟢 [ResultsScreen] Parámetros recibidos - Photos: ${photos.length}, Model: ${modelName}, Threshold: ${threshold}`,
  );
  console.log('🟢 [ResultsScreen] Datos de fotos:', JSON.stringify(photos));

  const [results, setResults] = useState<
    {
      uri: string;
      detections: Detection[];
      width: number;
      height: number;
      tiles: ImageTile[];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<{
    uri: string;
    tileDetections: Detection[];
    tile: ImageTile;
    photoWidth: number;
    photoHeight: number;
  } | null>(null);
  const [selectedMainImage, setSelectedMainImage] = useState<{
    uri: string;
    detections: Detection[];
    width: number;
    height: number;
  } | null>(null);
  const viewShotRefs = useRef<(ViewShot | null)[]>([]);

  // Función para capturar imagen con cuadros dibujados
  const handleImagePress = async (item: any, index: number) => {
    try {
      const viewShotRef = viewShotRefs.current[index];
      if (viewShotRef) {
        console.log(
          `📸 [ResultsScreen] Capturando imagen ${index} con cuadros...`,
        );
        const uri = await viewShotRef.capture?.();
        if (uri) {
          console.log(`✅ [ResultsScreen] Imagen capturada: ${uri}`);
          setSelectedMainImage({
            uri,
            detections: item.detections,
            width: item.width,
            height: item.height,
          });
        }
      }
    } catch (error) {
      console.error('❌ [ResultsScreen] Error capturando imagen:', error);
      // Fallback: usar imagen original sin cuadros
      setSelectedMainImage({
        uri: item.uri,
        detections: item.detections,
        width: item.width,
        height: item.height,
      });
    }
  };

  useEffect(() => {
    console.log('🟡 [ResultsScreen] useEffect ejecutado - Iniciando análisis');
    const run = async () => {
      try {
        console.log('🟡 [ResultsScreen] Función run() iniciada');
        const res = [];

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          console.log(
            `🔵 [ResultsScreen] Analizando foto ${i + 1}/${photos.length}`,
          );
          console.log(`🔵 [ResultsScreen] URI: ${photo.uri}`);
          console.log(
            `🔵 [ResultsScreen] Dimensiones: ${photo.width}x${photo.height}`,
          );

          // Pasamos width y height explícitamente + threshold
          console.log(
            `🔵 [ResultsScreen] Llamando a analyzeImage() con threshold ${threshold}...`,
          );
          const result = await analyzeImage(
            photo.uri,
            photo.width,
            photo.height,
            modelName,
            threshold,
          );
          console.log(
            `✅ [ResultsScreen] Foto ${i + 1} analizada - Detecciones: ${
              result.detections.length
            }, Tiles: ${result.tiles.length}`,
          );

          res.push({
            uri: photo.uri,
            detections: result.detections,
            width: photo.width,
            height: photo.height,
            tiles: result.tiles,
          });
        }

        console.log(
          '✅ [ResultsScreen] Todas las fotos analizadas, actualizando estado',
        );
        setResults(res);
        setLoading(false);
        console.log('✅ [ResultsScreen] Estado actualizado, análisis completo');
      } catch (error) {
        console.error('❌ [ResultsScreen] ERROR CRÍTICO en run():', error);
        console.error(
          '❌ [ResultsScreen] Stack trace:',
          (error as Error).stack,
        );
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
        <Text style={styles.loadingTxt}>
          Procesando con {modelName.toUpperCase()}...
        </Text>
        <Text>Recortando y ejecutando TFLite</Text>
      </View>
    );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc', padding: 15 }}>
      <Text style={styles.title}>Resultados</Text>

      {results.map((item, idx) => {
        // Para resizeMode: 'contain', debemos calcular el tamaño real de renderizado
        const containerWidth = 350; // Ancho del card - padding (se ajustará dinámicamente)
        const containerHeight = 300; // Alto del imgBox

        const imageAspect = item.width / item.height;
        const containerAspect = containerWidth / containerHeight;

        // Calcular dimensiones reales de la imagen renderizada dentro del contenedor
        let renderedWidth, renderedHeight, offsetX, offsetY;

        if (imageAspect > containerAspect) {
          // Imagen más ancha - se ajusta al ancho del contenedor
          renderedWidth = containerWidth;
          renderedHeight = containerWidth / imageAspect;
          offsetX = 0;
          offsetY = (containerHeight - renderedHeight) / 2;
        } else {
          // Imagen más alta - se ajusta al alto del contenedor
          renderedHeight = containerHeight;
          renderedWidth = containerHeight * imageAspect;
          offsetX = (containerWidth - renderedWidth) / 2;
          offsetY = 0;
        }

        // Factor de escala de coordenadas originales a renderizadas
        const scale = renderedWidth / item.width;

        console.log(`📊 [ResultsScreen] Imagen ${idx + 1}:`);
        console.log(`   Original: ${item.width}x${item.height}`);
        console.log(
          `   Renderizada: ${renderedWidth.toFixed(1)}x${renderedHeight.toFixed(
            1,
          )}`,
        );
        console.log(
          `   Offset: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`,
        );
        console.log(`   Escala: ${scale.toFixed(4)}`);

        return (
          <View key={idx} style={styles.card}>
            {/* Imagen principal - Click para ampliar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleImagePress(item, idx)}
            >
              <ViewShot
                ref={ref => (viewShotRefs.current[idx] = ref)}
                options={{ format: 'png', quality: 1.0 }}
              >
                <View style={styles.imgBox}>
                  <Image source={{ uri: item.uri }} style={styles.img} />
                  {item.detections.map((d, i) => {
                    const boxStyle = {
                      left: offsetX + d.box.x * scale,
                      top: offsetY + d.box.y * scale,
                      width: d.box.width * scale,
                      height: d.box.height * scale,
                    };
                    console.log(`📦 [ResultsScreen] Box ${i + 1}:`);
                    console.log(
                      `   Original: (${d.box.x}, ${d.box.y}, ${d.box.width}x${d.box.height})`,
                    );
                    console.log(
                      `   Renderizado: (${boxStyle.left.toFixed(
                        1,
                      )}, ${boxStyle.top.toFixed(1)}, ${boxStyle.width.toFixed(
                        1,
                      )}x${boxStyle.height.toFixed(1)})`,
                    );
                    return <View key={i} style={[styles.box, boxStyle]} />;
                  })}
                </View>
              </ViewShot>
            </TouchableOpacity>
            <Text
              style={{
                marginTop: 10,
                textAlign: 'center',
                color: '#64748b',
                fontSize: 12,
              }}
            >
              👆 Toca para ampliar
            </Text>
            <Text style={{ marginTop: 5 }}>
              Plagas:{' '}
              <Text style={{ fontWeight: 'bold', color: 'red' }}>
                {item.detections.length}
              </Text>
            </Text>

            {/* Carrusel de Tiles con recorte visual */}
            <View style={{ marginTop: 15 }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  marginBottom: 10,
                  color: '#64748b',
                }}
              >
                Análisis por Región ({item.tiles.length} tiles)
              </Text>
              <FlatList
                horizontal
                data={item.tiles}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(tile, i) => `tile-${idx}-${i}`}
                renderItem={({ item: tile, index: tileIdx }) => {
                  // Filtrar detecciones que caen dentro de este tile
                  const tileDetections = item.detections.filter(d => {
                    const detCenterX = d.box.x + d.box.width / 2;
                    const detCenterY = d.box.y + d.box.height / 2;
                    return (
                      detCenterX >= tile.x &&
                      detCenterX < tile.x + tile.width &&
                      detCenterY >= tile.y &&
                      detCenterY < tile.y + tile.height
                    );
                  });

                  const hasDetections = tileDetections.length > 0;

                  // Calcular escala para mostrar el tile en 150x150
                  const tileDisplaySize = 150;
                  const tileScale = tileDisplaySize / tile.width;

                  // Logging detallado para debugging
                  console.log(`\n🔍 [Tile ${tileIdx + 1}] Debugging:`);
                  console.log(
                    `   Región del tile: (${tile.x}, ${tile.y}) - ${tile.width}x${tile.height}`,
                  );
                  console.log(
                    `   Detecciones en este tile: ${tileDetections.length}`,
                  );

                  tileDetections.forEach((d, detIdx) => {
                    console.log(`   📍 Detección ${detIdx + 1}:`);
                    console.log(
                      `      Coordenadas ABSOLUTAS: (${d.box.x}, ${d.box.y}, ${d.box.width}x${d.box.height})`,
                    );
                    console.log(
                      `      Coordenadas RELATIVAS al tile: (${
                        d.box.x - tile.x
                      }, ${d.box.y - tile.y})`,
                    );
                    const relLeft = (d.box.x - tile.x) * tileScale;
                    const relTop = (d.box.y - tile.y) * tileScale;
                    console.log(
                      `      Coordenadas ESCALADAS para display: (${relLeft.toFixed(
                        1,
                      )}, ${relTop.toFixed(1)})`,
                    );

                    // Verificar si la caja está completamente dentro del tile
                    const isFullyInside =
                      d.box.x >= tile.x &&
                      d.box.y >= tile.y &&
                      d.box.x + d.box.width <= tile.x + tile.width &&
                      d.box.y + d.box.height <= tile.y + tile.height;
                    console.log(
                      `      ✓ Caja completamente dentro del tile: ${
                        isFullyInside ? 'SÍ' : 'NO (parcial)'
                      }`,
                    );
                  });

                  return (
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedTile({
                          uri: tile.uri,
                          tileDetections,
                          tile,
                          photoWidth: item.width,
                          photoHeight: item.height,
                        })
                      }
                      style={[
                        styles.tileCard,
                        hasDetections && {
                          borderColor: '#15803d',
                          borderWidth: 3,
                        },
                      ]}
                    >
                      <View style={styles.tileImageContainer}>
                        {/* Usar ImageBackground para recortar visualmente */}
                        <ImageBackground
                          source={{ uri: tile.uri }}
                          style={styles.tileImage}
                          imageStyle={{
                            // Desplazar la imagen para mostrar solo la región del tile
                            marginLeft: -tile.x * tileScale,
                            marginTop: -tile.y * tileScale,
                            width: item.width * tileScale,
                            height: item.height * tileScale,
                          }}
                        >
                          {/* Marco del tile para referencia visual */}
                          <View
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderWidth: 1,
                              borderColor: 'blue',
                              borderStyle: 'dashed',
                            }}
                          />

                          {/* Dibujar detecciones relativas al tile */}
                          {tileDetections.map((d, i) => {
                            const relativeBox = {
                              left: (d.box.x - tile.x) * tileScale,
                              top: (d.box.y - tile.y) * tileScale,
                              width: d.box.width * tileScale,
                              height: d.box.height * tileScale,
                            };
                            return (
                              <View key={i} style={[styles.box, relativeBox]}>
                                {/* Número de detección para identificar */}
                                <Text
                                  style={{
                                    position: 'absolute',
                                    top: 2,
                                    left: 2,
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    backgroundColor: 'red',
                                    paddingHorizontal: 4,
                                    borderRadius: 3,
                                  }}
                                >
                                  {i + 1}
                                </Text>
                              </View>
                            );
                          })}
                        </ImageBackground>
                      </View>
                      <Text style={styles.tileLabel}>Tile {tileIdx + 1}</Text>
                      <Text style={styles.tileCoords}>
                        ({tile.x},{tile.y})
                      </Text>
                      <Text
                        style={[
                          styles.tileDetCount,
                          hasDetections && {
                            color: '#15803d',
                            fontWeight: 'bold',
                          },
                        ]}
                      >
                        {tileDetections.length > 0
                          ? `🎯 ${tileDetections.length}`
                          : '—'}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        );
      })}

      {/* Modal fullscreen para imagen principal CON ZOOM */}
      <Modal
        visible={selectedMainImage !== null}
        transparent={true}
        animationType="fade"
      >
        {selectedMainImage && (
          <ImageViewer
            imageUrls={[{ url: selectedMainImage.uri }]}
            enableSwipeDown={true}
            onSwipeDown={() => setSelectedMainImage(null)}
            onClick={() => setSelectedMainImage(null)}
            renderHeader={() => (
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedMainImage(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            )}
            renderIndicator={() => null}
            backgroundColor="rgba(0, 0, 0, 0.95)"
            saveToLocalByLongPress={false}
            renderFooter={() => (
              <View
                style={{
                  position: 'absolute',
                  bottom: 50,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <Text style={styles.modalHint}>
                  🔍 Haz pinch para hacer zoom • Desliza hacia abajo para cerrar
                </Text>
              </View>
            )}
          />
        )}
      </Modal>

      {/* Modal fullscreen para ver tile en grande CON ZOOM */}
      <Modal
        visible={selectedTile !== null}
        transparent={true}
        animationType="fade"
      >
        {selectedTile && (
          <ImageViewer
            imageUrls={[{ url: selectedTile.uri }]}
            enableSwipeDown={true}
            onSwipeDown={() => setSelectedTile(null)}
            onClick={() => setSelectedTile(null)}
            renderHeader={() => (
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedTile(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            )}
            renderIndicator={() => null}
            backgroundColor="rgba(0, 0, 0, 0.95)"
            saveToLocalByLongPress={false}
            renderFooter={() => (
              <View
                style={{
                  position: 'absolute',
                  bottom: 50,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <Text style={styles.modalHint}>
                  🔍 Haz pinch para hacer zoom • Desliza hacia abajo para cerrar
                </Text>
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 12,
                    marginTop: 5,
                    opacity: 0.7,
                  }}
                >
                  {selectedTile.tileDetections.length} detección
                  {selectedTile.tileDetections.length !== 1 ? 'es' : ''} en esta
                  región
                </Text>
              </View>
            )}
          />
        )}
      </Modal>

      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={styles.btn}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>FINALIZAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f172a',
  },
  card: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
  },
  imgBox: {
    height: 300,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%', resizeMode: 'contain' },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  btn: {
    backgroundColor: '#15803d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },

  // Estilos para carrusel de tiles
  tileCard: {
    marginRight: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  tileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  tileImage: {
    width: 150,
    height: 150,
    position: 'relative',
  },
  tileLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tileDetCount: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  tileCoords: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Estilos para modal fullscreen con zoom
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalHint: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
  },
});

export default ResultsScreen;
