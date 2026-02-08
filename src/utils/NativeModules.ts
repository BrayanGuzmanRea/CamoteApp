/**
 * Declaraciones de tipos para módulos nativos de CamoteApp
 *
 * Proporciona tipado TypeScript para funciones nativas de Android/iOS
 */

import { NativeModules } from 'react-native';

/**
 * Módulo Nativo para Extracción de Píxeles RGB
 *
 * Permite convertir imágenes a tensores Float32Array normalizados
 * para procesamiento con TensorFlow Lite
 */
interface ImagePixelModuleInterface {
  /**
   * Extrae píxeles RGB normalizados de una imagen
   *
   * @param imageUri URI de la imagen (file://, content://, etc.)
   * @param targetWidth Ancho objetivo en píxeles
   * @param targetHeight Alto objetivo en píxeles
   * @returns Promise<number[]> - Array de píxeles normalizados [0.0 - 1.0]
   *          Formato: [R, G, B, R, G, B, ...] para cada píxel
   *          Tamaño: targetWidth * targetHeight * 3
   *
   * @example
   * const pixels = await ImagePixelModule.getImagePixels('file:///path/image.jpg', 1280, 1280);
   * const tensor = new Float32Array(pixels);
   */
  getImagePixels(
    imageUri: string,
    targetWidth: number,
    targetHeight: number,
  ): Promise<number[]>;

  /**
   * Obtiene estadísticas de una imagen (para debugging)
   *
   * @param imageUri URI de la imagen
   * @returns Promise con información de la imagen
   */
  getImageStats(imageUri: string): Promise<{
    width: number;
    height: number;
    totalPixels: number;
    config: string;
  }>;
}

/**
 * Módulo exportado desde Android/iOS
 * Disponible globalmente en NativeModules
 */
const ImagePixelModule: ImagePixelModuleInterface =
  NativeModules.ImagePixelModule;

export default ImagePixelModule;
