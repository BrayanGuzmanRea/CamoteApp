import ImageEditor from '@react-native-community/image-editor';

export interface ImageTile {
  uri: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MODEL_INPUT_SIZE = 1280;

// MODIFICADO: NO recorta físicamente, solo retorna coordenadas
export const processImageTiling = async (
  photoUri: string,
  width: number,
  height: number
): Promise<ImageTile[]> => {
  try {
    console.log(`🟣 [ImageProcessor] processImageTiling() iniciado`);
    console.log(`🟣 [ImageProcessor] URI: ${photoUri}`);
    console.log(`🟣 [ImageProcessor] Dimensiones: ${width}x${height}`);

    console.log(`📸 [ImageProcessor] Procesando Tiling: ${width}x${height} px`);

    // Si la imagen es pequeña, no se divide
    if (width <= MODEL_INPUT_SIZE && height <= MODEL_INPUT_SIZE) {
      console.log(`✅ [ImageProcessor] Imagen pequeña, no requiere tiling (1 tile)`);
      return [{ uri: photoUri, x: 0, y: 0, width, height }];
    }

    const tiles: ImageTile[] = [];
    let tileCount = 0;

    console.log(`🟣 [ImageProcessor] Calculando tiles virtuales (sin recorte físico)...`);
    console.log(`🟣 [ImageProcessor] Tamaño de tile: ${MODEL_INPUT_SIZE}x${MODEL_INPUT_SIZE}`);

    // Algoritmo de Ventana Deslizante - SOLO CALCULA COORDENADAS
    for (let y = 0; y < height; y += MODEL_INPUT_SIZE) {
      for (let x = 0; x < width; x += MODEL_INPUT_SIZE) {
        tileCount++;

        let cropX = x;
        let cropY = y;

        // Ajuste de bordes
        if (cropX + MODEL_INPUT_SIZE > width) cropX = Math.max(0, width - MODEL_INPUT_SIZE);
        if (cropY + MODEL_INPUT_SIZE > height) cropY = Math.max(0, height - MODEL_INPUT_SIZE);

        console.log(`✅ [ImageProcessor] Tile virtual #${tileCount} calculado en (${cropX}, ${cropY})`);

        // Guardamos la URI original + coordenadas para recorte virtual
        tiles.push({
          uri: photoUri, // URI de la imagen ORIGINAL
          x: cropX,
          y: cropY,
          width: MODEL_INPUT_SIZE,
          height: MODEL_INPUT_SIZE
        });
      }
    }

    console.log(`✅ [ImageProcessor] Tiling virtual completado - Total de tiles: ${tiles.length}`);
    return tiles;
  } catch (error) {
    console.error('❌ [ImageProcessor] ERROR CRÍTICO en processImageTiling():', error);
    console.error('❌ [ImageProcessor] Stack trace:', (error as Error).stack);
    throw error;
  }
};