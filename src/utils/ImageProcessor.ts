import ImageEditor from '@react-native-community/image-editor';
import { Image } from 'react-native';

export interface ImageTile {
  uri: string;      // Esto espera un STRING (texto)
  x: number;
  y: number;
  width: number;
  height: number;
}

const MODEL_INPUT_SIZE = 1280;

export const processImageTiling = async (photoUri: string): Promise<ImageTile[]> => {
  // 1. Obtener dimensiones
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(photoUri, (w, h) => resolve({ width: w, height: h }), reject);
  });

  console.log(`📸 Tiling imagen original: ${width}x${height}`);

  if (width <= MODEL_INPUT_SIZE && height <= MODEL_INPUT_SIZE) {
    return [{ uri: photoUri, x: 0, y: 0, width, height }];
  }

  const tiles: ImageTile[] = [];

  // 2. Algoritmo de Ventana Deslizante
  for (let y = 0; y < height; y += MODEL_INPUT_SIZE) {
    for (let x = 0; x < width; x += MODEL_INPUT_SIZE) {
      
      let cropX = x;
      let cropY = y;

      if (cropX + MODEL_INPUT_SIZE > width) cropX = Math.max(0, width - MODEL_INPUT_SIZE);
      if (cropY + MODEL_INPUT_SIZE > height) cropY = Math.max(0, height - MODEL_INPUT_SIZE);

      try {
        const cropData = {
          offset: { x: cropX, y: cropY },
          size: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE },
          displaySize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE },
        };

        // --- AQUÍ ESTABA EL ERROR, CORREGIDO ABAJO ---
        
        // 1. Ejecutamos el recorte
        const result: any = await ImageEditor.cropImage(photoUri, cropData);
        
        // 2. Extraemos la ruta correctamente.
        // Si 'result' es un objeto (versión nueva), usamos result.path
        // Si 'result' es un string (versión vieja), usamos result directo
        const finalUri = typeof result === 'object' ? result.path : result;

        tiles.push({ 
            uri: finalUri,  // Ahora sí es un string seguro
            x: cropX, 
            y: cropY, 
            width: MODEL_INPUT_SIZE, 
            height: MODEL_INPUT_SIZE 
        });

      } catch (error) {
        console.error("Error recortando tile:", error);
      }
    }
  }
  return tiles;
};