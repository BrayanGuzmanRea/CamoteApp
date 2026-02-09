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
   * OPTIMIZADO: Retorna path de archivo binario en lugar de array
   * para evitar std::bad_alloc en React Native bridge
   *
   * @param imageUri URI de la imagen (file://, content://, etc.)
   * @param targetWidth Ancho objetivo en píxeles
   * @param targetHeight Alto objetivo en píxeles
   * @returns Promise<string> - Path absoluto del archivo .bin con píxeles
   *          Formato: Float32 binario (little-endian)
   *          Tamaño archivo: targetWidth * targetHeight * 3 * 4 bytes
   *
   * @example
   * const binPath = await ImagePixelModule.getImagePixels('file:///path/image.jpg', 1280, 1280);
   * const buffer = await RNFS.readFile(binPath, 'base64');
   * const tensor = new Float32Array(Uint8Array.from(atob(buffer), c => c.charCodeAt(0)).buffer);
   */
  getImagePixels(
    imageUri: string,
    targetWidth: number,
    targetHeight: number,
  ): Promise<string>;

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
