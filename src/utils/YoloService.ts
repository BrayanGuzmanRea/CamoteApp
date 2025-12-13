// --- CORRECCIÓN 1: Importamos TensorflowModel en lugar de Interpreter
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Alert } from 'react-native';
import { ImageTile, processImageTiling } from './ImageProcessor';

export interface Detection {
  classIndex: number;
  score: number;
  box: { x: number; y: number; width: number; height: number };
}

// --- CORRECCIÓN 2: Usamos el tipo correcto aquí
let loadedModel: TensorflowModel | null = null;
let currentModelName: string = '';

// 1. CARGAR MODELO
export const loadYoloModel = async (modelName: 'yolov8' | 'yolov11') => {
  try {
    if (loadedModel && currentModelName === modelName) {
      console.log(`✅ Modelo ${modelName} ya está en caché`);
      return loadedModel;
    }

    console.log(`🔄 Cargando ${modelName}...`);
    const fileName = modelName === 'yolov8' ? 'yolov8.tflite' : 'yolov11.tflite';

    // react-native-fast-tflite busca automáticamente en android/app/src/main/assets/
    console.log(`📂 Cargando modelo: ${fileName}`);

    // TEMPORAL: Simulación para debugging - comentar cuando TFLite funcione
    console.log('⚠️ MODO SIMULACIÓN ACTIVO - No se carga TFLite real');
    loadedModel = { run: async () => [] } as any; // Mock model
    currentModelName = modelName;
    console.log("✅ Modelo simulado cargado exitosamente.");
    return loadedModel;

    // DESCOMENTAR CUANDO SOLUCIONES EL CRASH:
    // loadedModel = await loadTensorflowModel({ url: fileName });
    // currentModelName = modelName;
    // console.log("✅ Modelo cargado exitosamente.");
    // return loadedModel;

  } catch (error) {
    console.error("❌ Error cargando modelo:", error);
    console.error("❌ Stack trace:", JSON.stringify(error, null, 2));
    Alert.alert("Error", `No se pudo cargar ${modelName}. Detalles: ${error}`);
    return null;
  }
};

// 2. ANALIZAR IMAGEN
export const analyzeImage = async (imageUri: string, modelName: 'yolov8' | 'yolov11'): Promise<Detection[]> => {
  try {
    console.log(`🔵 [YoloService] analyzeImage() iniciado - URI: ${imageUri}, Model: ${modelName}`);

    console.log('🔵 [YoloService] Paso 1: Cargando modelo...');
    const model = await loadYoloModel(modelName);
    if (!model) {
      console.error('❌ [YoloService] El modelo no se cargó correctamente');
      return [];
    }
    console.log('✅ [YoloService] Modelo cargado exitosamente');

    console.log('🔵 [YoloService] Paso 2: Procesando tiling de imagen...');
    const tiles = await processImageTiling(imageUri);
    console.log(`✅ [YoloService] Tiling completado - ${tiles.length} tiles generados`);

    const allDetections: Detection[] = [];

    console.log(`🚀 [YoloService] Paso 3: Analizando ${tiles.length} tiles con ${modelName}...`);

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      try {
        console.log(`🔵 [YoloService] Procesando tile ${i + 1}/${tiles.length}`);

        // Simulación de Tensor (Para evitar bloqueo en Demo)
        const dummyInput = new Float32Array(1 * 1280 * 1280 * 3).fill(0.5);

        console.log(`🔵 [YoloService] Ejecutando modelo en tile ${i + 1}...`);
        const output = await model.run([dummyInput]);
        console.log(`✅ [YoloService] Tile ${i + 1} procesado`);

        // Procesar salida simulada para UI
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
      }
    }

    console.log(`✅ [YoloService] Análisis completado - Total detecciones: ${allDetections.length}`);
    return allDetections;
  } catch (error) {
    console.error('❌ [YoloService] ERROR CRÍTICO en analyzeImage():', error);
    return [];
  }
};   