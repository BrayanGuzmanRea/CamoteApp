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
  try {
    console.log(`🟣 [ImageProcessor] Iniciando tiling para: ${photoUri}`);

    // 1. Obtener dimensiones
    console.log('🟣 [ImageProcessor] Paso 1: Obteniendo dimensiones de imagen...');
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        photoUri,
        (w, h) => {
          console.log(`✅ [ImageProcessor] Dimensiones obtenidas: ${w}x${h}`);
          resolve({ width: w, height: h });
        },
        (error) => {
          console.error('❌ [ImageProcessor] Error obteniendo dimensiones:', error);
          reject(error);
        }
      );
    });

    console.log(`📸 [ImageProcessor] Tiling imagen original: ${width}x${height}`);

    if (width <= MODEL_INPUT_SIZE && height <= MODEL_INPUT_SIZE) {
      console.log(`✅ [ImageProcessor] Imagen pequeña, no requiere tiling (1 tile)`);
      return [{ uri: photoUri, x: 0, y: 0, width, height }];
    }

    const tiles: ImageTile[] = [];
    let tileCount = 0;

    // 2. Algoritmo de Ventana Deslizante
    console.log('🟣 [ImageProcessor] Paso 2: Iniciando algoritmo de ventana deslizante...');
    for (let y = 0; y < height; y += MODEL_INPUT_SIZE) {
      for (let x = 0; x < width; x += MODEL_INPUT_SIZE) {
        tileCount++;

        let cropX = x;
        let cropY = y;

        if (cropX + MODEL_INPUT_SIZE > width) cropX = Math.max(0, width - MODEL_INPUT_SIZE);
        if (cropY + MODEL_INPUT_SIZE > height) cropY = Math.max(0, height - MODEL_INPUT_SIZE);

        try {
          // Calcular el tamaño real del tile (puede ser menor si está en el borde)
          const tileWidth = Math.min(MODEL_INPUT_SIZE, width - cropX);
          const tileHeight = Math.min(MODEL_INPUT_SIZE, height - cropY);

          console.log(`🟣 [ImageProcessor] Recortando tile #${tileCount} en posición (${cropX}, ${cropY}) - Tamaño: ${tileWidth}x${tileHeight}`);

          const cropData = {
            offset: { x: cropX, y: cropY },
            size: { width: tileWidth, height: tileHeight },
            displaySize: { width: tileWidth, height: tileHeight },
          };

          // 1. Ejecutamos el recorte
          const result: any = await ImageEditor.cropImage(photoUri, cropData);

          // 2. Extraemos la ruta correctamente.
          // Si 'result' es un objeto (versión nueva), usamos result.path
          // Si 'result' es un string (versión vieja), usamos result directo
          const finalUri = typeof result === 'object' ? result.path : result;
          console.log(`✅ [ImageProcessor] Tile #${tileCount} recortado exitosamente: ${finalUri}`);

          tiles.push({
              uri: finalUri,  // Ahora sí es un string seguro
              x: cropX,
              y: cropY,
              width: tileWidth,
              height: tileHeight
          });

        } catch (error) {
          console.error(`❌ [ImageProcessor] Error recortando tile #${tileCount}:`, error);
        }
      }
    }

    console.log(`✅ [ImageProcessor] Tiling completado - Total de tiles: ${tiles.length}`);
    return tiles;
  } catch (error) {
    console.error('❌ [ImageProcessor] ERROR CRÍTICO en processImageTiling():', error);
    throw error;
  }
};