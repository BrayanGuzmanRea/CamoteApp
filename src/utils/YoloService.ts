import { Alert } from 'react-native';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { ImageTile, processImageTiling } from './ImageProcessor';
import { imageRegionToTensor, parseYoloOutput } from './TensorConverter';

export interface Detection {
  classIndex: number;
  score: number;
  box: { x: number; y: number; width: number; height: number };
}

export interface AnalysisResult {
  detections: Detection[];
  tiles: ImageTile[];
}

// Umbral de confianza: solo mostrar detecciones con score >= 0.5 (50%)
// Este threshold elimina detecciones débiles y se alinea con el comportamiento de Python/YOLOv8
const CONFIDENCE_THRESHOLD = 0.5;

let loadedModel: TensorflowModel | null = null;
let currentModelName: string = '';

export const loadYoloModel = async (modelName: 'yolov8' | 'yolov11') => {
  try {
    console.log(`🔵 [YoloService] loadYoloModel() iniciado para: ${modelName}`);

    if (loadedModel && currentModelName === modelName) {
      console.log(`✅ [YoloService] Modelo ${modelName} ya está en caché`);
      return loadedModel;
    }

    console.log(`🔄 [YoloService] Cargando ${modelName}...`);
    // ⚠️ IMPORTANTE: react-native-fast-tflite busca en res/raw/ sin extensión
    const resourceName = modelName; // 'yolov8' o 'yolov11' (SIN .tflite)
    console.log(`📂 [YoloService] Nombre de recurso: ${resourceName}`);

    // 🚀 INTENTO DE CARGA REAL DE TFLITE
    try {
      console.log(
        `🔵 [YoloService] Intentando cargar TFLite REAL desde res/raw...`,
      );
      console.log(
        `🔵 [YoloService] Ruta: android/app/src/main/res/raw/${resourceName}.tflite`,
      );

      loadedModel = await loadTensorflowModel({ url: resourceName });
      currentModelName = modelName;

      console.log('✅ [YoloService] ¡Modelo TFLite cargado exitosamente!');
      console.log(`✅ [YoloService] Modelo activo: ${currentModelName}`);
      return loadedModel;
    } catch (error: any) {
      console.error('❌ [YoloService] ERROR CRÍTICO al cargar TFLite:', error);
      console.error('❌ [YoloService] Mensaje de error:', error.message);
      console.error('❌ [YoloService] Stack trace:', error.stack);
      console.error('❌ [YoloService] Tipo de error:', typeof error);
      console.error(
        '❌ [YoloService] Error completo:',
        JSON.stringify(error, null, 2),
      );

      Alert.alert(
        '⚠️ Error TensorFlow Lite',
        `No se pudo cargar el modelo ${modelName}:\n\n` +
          `Error: ${error.message}\n\n` +
          `Recurso: ${resourceName}\n\n` +
          `La app continuará en modo simulación.`,
        [
          {
            text: 'Ver Logs',
            onPress: () => console.log('📋 Revisa los logs en la consola'),
          },
          { text: 'Continuar', style: 'cancel' },
        ],
      );

      // FALLBACK: Retornar mock si falla
      console.log('⚠️ [YoloService] Activando MODO SIMULACIÓN como fallback');
      loadedModel = { run: async () => [] } as any;
      currentModelName = modelName;
      return loadedModel;
    }
  } catch (error) {
    console.error('❌ [YoloService] ERROR cargando modelo:', error);
    console.error('❌ [YoloService] Stack trace:', (error as Error).stack);
    Alert.alert('Error', `No se encontró ${modelName} en assets.`);
    return null;
  }
};

// MODIFICADO: Recibe width y height, retorna detecciones y tiles
export const analyzeImage = async (
  imageUri: string,
  width: number,
  height: number,
  modelName: 'yolov8' | 'yolov11',
): Promise<AnalysisResult> => {
  try {
    console.log(`🔵 [YoloService] analyzeImage() iniciado`);
    console.log(`🔵 [YoloService] URI: ${imageUri}`);
    console.log(`🔵 [YoloService] Dimensiones: ${width}x${height}`);
    console.log(`🔵 [YoloService] Modelo: ${modelName}`);

    console.log(`🔵 [YoloService] Paso 1: Cargando modelo...`);
    const model = await loadYoloModel(modelName);
    if (!model) {
      console.error('❌ [YoloService] El modelo no se cargó correctamente');
      return { detections: [], tiles: [] };
    }
    console.log('✅ [YoloService] Modelo cargado exitosamente');

    // Pasamos dimensiones explícitas (Evita crash de memoria)
    console.log(`🔵 [YoloService] Paso 2: Procesando tiling de imagen...`);
    console.log(
      `🔵 [YoloService] Llamando a processImageTiling(${imageUri}, ${width}, ${height})...`,
    );
    const tiles = await processImageTiling(imageUri, width, height);
    console.log(
      `✅ [YoloService] Tiling completado - ${tiles.length} tiles generados`,
    );

    const allDetections: Detection[] = [];
    console.log(
      `🚀 [YoloService] Paso 3: Analizando ${tiles.length} tiles con ${modelName}...`,
    );

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      try {
        console.log(
          `🔵 [YoloService] Procesando tile ${i + 1}/${tiles.length}`,
        );
        console.log(
          `🔵 [YoloService] Tile posición: (${tile.x}, ${tile.y}), tamaño: ${tile.width}x${tile.height}`,
        );

        // ✅ NUEVA IMPLEMENTACIÓN: Convertir región de imagen a tensor
        console.log(
          `🔵 [YoloService] Convirtiendo región de imagen a tensor...`,
        );
        const tensorInput = await imageRegionToTensor(
          tile.uri,
          tile.x,
          tile.y,
          tile.width,
          tile.height,
        );
        console.log(
          `✅ [YoloService] Tensor generado: ${tensorInput.length} elementos`,
        );

        console.log(
          `🔵 [YoloService] Ejecutando inferencia en tile ${i + 1}...`,
        );
        const output = await model.run([tensorInput]);
        console.log(`✅ [YoloService] Tile ${i + 1} procesado`);
        console.log(`📊 [YoloService] Output shape:`, output?.length || 'N/A');

        // ✅ PARSEAR OUTPUT REAL DE YOLO
        if (output && output.length > 0) {
          console.log(`🔵 [YoloService] Parseando detecciones del output...`);
          const tileDetections = parseYoloOutput(
            output,
            tile.width,
            tile.height,
            CONFIDENCE_THRESHOLD,
          );

          console.log(
            `✅ [YoloService] Detecciones en tile ${i + 1}: ${
              tileDetections.length
            }`,
          );

          // Convertir coordenadas locales del tile a coordenadas globales de la imagen
          tileDetections.forEach(detection => {
            const globalDetection: Detection = {
              classIndex: detection.classIndex,
              score: detection.score,
              box: {
                x: tile.x + detection.box.x,
                y: tile.y + detection.box.y,
                width: detection.box.width,
                height: detection.box.height,
              },
            };
            allDetections.push(globalDetection);
            console.log(
              `🎯 [YoloService] Detección agregada - Score: ${detection.score.toFixed(
                2,
              )}, Box: (${globalDetection.box.x.toFixed(
                0,
              )}, ${globalDetection.box.y.toFixed(0)})`,
            );
          });
        }
      } catch (err) {
        console.error(`❌ [YoloService] Error en tile ${i + 1}:`, err);
        console.error(`❌ [YoloService] Stack trace:`, (err as Error).stack);
      }
    }

    console.log(
      `✅ [YoloService] Análisis completado - Total detecciones sin filtrar: ${allDetections.length}`,
    );

    // Filtrar detecciones por umbral de confianza
    const filteredDetections = allDetections.filter(
      d => d.score >= CONFIDENCE_THRESHOLD,
    );
    console.log(
      `🎯 [YoloService] Detecciones filtradas (score >= ${CONFIDENCE_THRESHOLD}): ${filteredDetections.length}`,
    );

    return { detections: filteredDetections, tiles };
  } catch (error) {
    console.error('❌ [YoloService] ERROR CRÍTICO en analyzeImage():', error);
    console.error('❌ [YoloService] Stack trace:', (error as Error).stack);
    return { detections: [], tiles: [] };
  }
};
