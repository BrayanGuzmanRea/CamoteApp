import { Alert } from 'react-native';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { ImageTile, processImageTiling } from './ImageProcessor';
import { getMemoryUsage } from './PerformanceMonitor';
import { imageRegionToTensor, parseYoloOutput } from './TensorConverter';

export interface Detection {
  classIndex: number;
  score: number;
  box: { x: number; y: number; width: number; height: number };
}

export interface AnalysisMetrics {
  preprocessingTime: number; // ms
  tileInferenceTimes: number[]; // ms por cada tile
  totalInferenceTime: number; // ms total
  totalAnalysisTime: number; // ms desde inicio
  memoryInitial: number; // MB
  memoryPeak: number; // MB
  memoryFinal: number; // MB
}

export interface AnalysisResult {
  detections: Detection[];
  tiles: ImageTile[];
  metrics: AnalysisMetrics;
}

// Umbral de confianza por defecto (puede ser sobrescrito al llamar analyzeImage)
// Este threshold elimina detecciones débiles y se alinea con el comportamiento de Python/YOLOv8
const DEFAULT_CONFIDENCE_THRESHOLD = 0.5;

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

// MODIFICADO: Recibe width y height, retorna detecciones, tiles Y MÉTRICAS
export const analyzeImage = async (
  imageUri: string,
  width: number,
  height: number,
  modelName: 'yolov8' | 'yolov11',
  confidenceThreshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
): Promise<AnalysisResult> => {
  // ⏱️ INICIO: Timer total del análisis
  const analysisStartTime = performance.now();

  // 💾 INICIO: Capturar memoria inicial
  const memoryInitial = await getMemoryUsage();
  let memoryPeak = memoryInitial;

  try {
    console.log(`🔵 [YoloService] analyzeImage() iniciado`);
    console.log(`🔵 [YoloService] URI: ${imageUri}`);
    console.log(`🔵 [YoloService] Dimensiones: ${width}x${height}`);
    console.log(`🔵 [YoloService] Modelo: ${modelName}`);
    console.log(`🔵 [YoloService] Threshold: ${confidenceThreshold}`);
    console.log(
      `📊 [YoloService] Memoria inicial: ${memoryInitial.toFixed(1)} MB`,
    );

    console.log(`🔵 [YoloService] Paso 1: Cargando modelo...`);
    const model = await loadYoloModel(modelName);
    if (!model) {
      console.error('❌ [YoloService] El modelo no se cargó correctamente');
      return {
        detections: [],
        tiles: [],
        metrics: {
          preprocessingTime: 0,
          tileInferenceTimes: [],
          totalInferenceTime: 0,
          totalAnalysisTime: 0,
          memoryInitial: 0,
          memoryPeak: 0,
          memoryFinal: 0,
        },
      };
    }
    console.log('✅ [YoloService] Modelo cargado exitosamente');

    // ⏱️ Timer preprocesamiento
    const preprocessingStartTime = performance.now();

    // Pasamos dimensiones explícitas (Evita crash de memoria)
    console.log(`🔵 [YoloService] Paso 2: Procesando tiling de imagen...`);
    console.log(
      `🔵 [YoloService] Llamando a processImageTiling(${imageUri}, ${width}, ${height})...`,
    );
    const tiles = await processImageTiling(imageUri, width, height);

    const preprocessingTime = performance.now() - preprocessingStartTime;
    console.log(
      `✅ [YoloService] Tiling completado - ${
        tiles.length
      } tiles generados (${preprocessingTime.toFixed(0)} ms)`,
    );

    const allDetections: Detection[] = [];
    const tileInferenceTimes: number[] = [];
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
        let tensorInput: Float32Array | null = await imageRegionToTensor(
          tile.uri,
          tile.x,
          tile.y,
          tile.width,
          tile.height,
        );
        console.log(
          `✅ [YoloService] Tensor generado: ${tensorInput.length} elementos`,
        );

        // ⏱️ Timer inferencia de este tile
        const tileStartTime = performance.now();

        console.log(
          `🔵 [YoloService] Ejecutando inferencia en tile ${i + 1}...`,
        );
        const output = await model.run([tensorInput]);

        // 🧹 CRÍTICO: Limpiar tensor inmediatamente después de inferencia
        tensorInput = null;

        const tileInferenceTime = performance.now() - tileStartTime;
        tileInferenceTimes.push(tileInferenceTime);

        console.log(
          `✅ [YoloService] Tile ${
            i + 1
          } procesado (${tileInferenceTime.toFixed(0)} ms)`,
        );
        console.log(`📊 [YoloService] Output shape:`, output?.length || 'N/A');

        // 💾 Actualizar memoria pico
        const currentMemory = await getMemoryUsage();
        if (currentMemory > memoryPeak) {
          memoryPeak = currentMemory;
        }

        // ✅ PARSEAR OUTPUT REAL DE YOLO
        if (output && output.length > 0) {
          console.log(
            `🔵 [YoloService] Parseando detecciones del output con threshold ${confidenceThreshold}...`,
          );
          const tileDetections = parseYoloOutput(
            output,
            tile.width,
            tile.height,
            confidenceThreshold,
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
      d => d.score >= confidenceThreshold,
    );
    console.log(
      `🎯 [YoloService] Detecciones filtradas (score >= ${confidenceThreshold}): ${filteredDetections.length}`,
    );

    // ⏱️ FIN: Tiempo total de análisis
    const totalAnalysisTime = performance.now() - analysisStartTime;
    const totalInferenceTime = tileInferenceTimes.reduce((a, b) => a + b, 0);

    // 💾 FIN: Memoria final
    const memoryFinal = await getMemoryUsage();

    // 📊 Construir métricas
    const metrics: AnalysisMetrics = {
      preprocessingTime: Math.round(preprocessingTime * 100) / 100,
      tileInferenceTimes: tileInferenceTimes.map(
        t => Math.round(t * 100) / 100,
      ),
      totalInferenceTime: Math.round(totalInferenceTime * 100) / 100,
      totalAnalysisTime: Math.round(totalAnalysisTime * 100) / 100,
      memoryInitial: Math.round(memoryInitial * 100) / 100,
      memoryPeak: Math.round(memoryPeak * 100) / 100,
      memoryFinal: Math.round(memoryFinal * 100) / 100,
    };

    console.log('📊 [YoloService] MÉTRICAS DE RENDIMIENTO:');
    console.log(`   ⏱️ Preprocesamiento: ${metrics.preprocessingTime} ms`);
    console.log(`   ⏱️ Inferencia total: ${metrics.totalInferenceTime} ms`);
    console.log(`   ⏱️ Análisis total: ${metrics.totalAnalysisTime} ms`);
    console.log(`   💾 Memoria inicial: ${metrics.memoryInitial} MB`);
    console.log(`   💾 Memoria pico: ${metrics.memoryPeak} MB`);
    console.log(`   💾 Memoria final: ${metrics.memoryFinal} MB`);
    console.log(
      `   💾 Delta memoria: ${(
        metrics.memoryPeak - metrics.memoryInitial
      ).toFixed(1)} MB`,
    );

    // 🧹 SUGERENCIA: Forzar garbage collection (solo en desarrollo)
    if (__DEV__ && global.gc) {
      global.gc();
      console.log('🧹 [YoloService] Garbage collection ejecutado');
    }

    return { detections: filteredDetections, tiles, metrics };
  } catch (error) {
    console.error('❌ [YoloService] ERROR CRÍTICO en analyzeImage():', error);
    console.error('❌ [YoloService] Stack trace:', (error as Error).stack);
    return {
      detections: [],
      tiles: [],
      metrics: {
        preprocessingTime: 0,
        tileInferenceTimes: [],
        totalInferenceTime: 0,
        totalAnalysisTime: 0,
        memoryInitial: 0,
        memoryPeak: 0,
        memoryFinal: 0,
      },
    };
  }
};
