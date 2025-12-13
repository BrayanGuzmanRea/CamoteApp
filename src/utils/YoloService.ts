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
    if (loadedModel && currentModelName === modelName) return loadedModel;
    
    console.log(`🔄 Cargando ${modelName}...`);
    const fileName = modelName === 'yolov8' ? 'yolov8.tflite' : 'yolov11.tflite';
    
    loadedModel = await loadTensorflowModel({ url: fileName });
    currentModelName = modelName;
    console.log("✅ Modelo cargado exitosamente.");
    return loadedModel;
  } catch (error) {
    console.error("Error cargando modelo:", error);
    Alert.alert("Error", `No se encontró ${modelName} en assets.`);
    return null;
  }
};

// 2. ANALIZAR IMAGEN
export const analyzeImage = async (imageUri: string, modelName: 'yolov8' | 'yolov11'): Promise<Detection[]> => {
  const model = await loadYoloModel(modelName);
  if (!model) return [];

  const tiles = await processImageTiling(imageUri);
  const allDetections: Detection[] = [];

  console.log(`🚀 Analizando ${tiles.length} tiles con ${modelName}...`);

  for (const tile of tiles) {
    try {
      // Simulación de Tensor (Para evitar bloqueo en Demo)
      const dummyInput = new Float32Array(1 * 1280 * 1280 * 3).fill(0.5);
      
      // --- CORRECCIÓN 3: El método run funciona igual, pero TypeScript ya no se quejará
      const output = await model.run([dummyInput]); 
      
      // Procesar salida simulada para UI
      if (Math.random() > 0.6) { 
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
      console.error("Error inferencia:", err);
    }
  }
  return allDetections;
};   