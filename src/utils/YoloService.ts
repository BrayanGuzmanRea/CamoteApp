import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Alert } from 'react-native';
import { ImageTile, processImageTiling } from './ImageProcessor';

export interface Detection {
  classIndex: number;
  score: number;
  box: { x: number; y: number; width: number; height: number };
}

export interface AnalysisResult {
  detections: Detection[];
  tiles: ImageTile[];
}

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
    const fileName = modelName === 'yolov8' ? 'yolov8.tflite' : 'yolov11.tflite';
    console.log(`📂 [YoloService] Nombre de archivo: ${fileName}`);

    // TEMPORAL: Simulación para debugging - comentar cuando TFLite funcione
    console.log('⚠️ [YoloService] MODO SIMULACIÓN ACTIVO - No se carga TFLite real');
    loadedModel = { run: async () => [] } as any; // Mock model
    currentModelName = modelName;
    console.log("✅ [YoloService] Modelo simulado cargado exitosamente.");
    return loadedModel;

    // DESCOMENTAR CUANDO SOLUCIONES EL CRASH DE TFLITE:
    // console.log(`🔵 [YoloService] Llamando a loadTensorflowModel()...`);
    // loadedModel = await loadTensorflowModel({ url: fileName });
    // currentModelName = modelName;
    // console.log("✅ [YoloService] Modelo cargado exitosamente.");
    // return loadedModel;
  } catch (error) {
    console.error("❌ [YoloService] ERROR cargando modelo:", error);
    console.error("❌ [YoloService] Stack trace:", (error as Error).stack);
    Alert.alert("Error", `No se encontró ${modelName} en assets.`);
    return null;
  }
};

// MODIFICADO: Recibe width y height, retorna detecciones y tiles
export const analyzeImage = async (
  imageUri: string,
  width: number,
  height: number,
  modelName: 'yolov8' | 'yolov11'
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
    console.log(`🔵 [YoloService] Llamando a processImageTiling(${imageUri}, ${width}, ${height})...`);
    const tiles = await processImageTiling(imageUri, width, height);
    console.log(`✅ [YoloService] Tiling completado - ${tiles.length} tiles generados`);

    const allDetections: Detection[] = [];
    console.log(`🚀 [YoloService] Paso 3: Analizando ${tiles.length} tiles con ${modelName}...`);

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      try {
        console.log(`🔵 [YoloService] Procesando tile ${i + 1}/${tiles.length}`);
        console.log(`🔵 [YoloService] Tile posición: (${tile.x}, ${tile.y}), tamaño: ${tile.width}x${tile.height}`);

        // Simulación de Tensor (Placeholder para flujo visual)
        console.log(`🔵 [YoloService] Creando dummy input tensor...`);
        const dummyInput = new Float32Array(1 * 1280 * 1280 * 3).fill(0.5);
        console.log(`🔵 [YoloService] Ejecutando modelo en tile ${i + 1}...`);
        const output = await model.run([dummyInput]);
        console.log(`✅ [YoloService] Tile ${i + 1} procesado`);

        // Simulación de detección para UI
        if (Math.random() > 0.6) {
          console.log(`🎯 [YoloService] Detección encontrada en tile ${i + 1}`);
          allDetections.push({
            classIndex: 0,
            score: 0.85,
            box: {
              x: tile.x + 100,
              y: tile.y + 100,
              width: 300,
              height: 300
            }
          });
        }
      } catch (err) {
        console.error(`❌ [YoloService] Error en tile ${i + 1}:`, err);
        console.error(`❌ [YoloService] Stack trace:`, (err as Error).stack);
      }
    }

    console.log(`✅ [YoloService] Análisis completado - Total detecciones: ${allDetections.length}`);
    return { detections: allDetections, tiles };
  } catch (error) {
    console.error('❌ [YoloService] ERROR CRÍTICO en analyzeImage():', error);
    console.error('❌ [YoloService] Stack trace:', (error as Error).stack);
    return { detections: [], tiles: [] };
  }
};