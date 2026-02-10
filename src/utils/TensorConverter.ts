import RNFS from 'react-native-fs';
import ImagePixelModule from './NativeModules';

/**
 * Convierte una región de imagen a tensor Float32Array normalizado para YOLO
 *
 * ESTRATEGIA OPTIMIZADA (v2.0 - BitmapRegionDecoder):
 * 1. Llamar directamente al módulo nativo con coordenadas de región
 * 2. Módulo nativo carga SOLO la región 1280×1280 (NO imagen completa)
 * 3. Retornar tensor normalizado [0.0 - 1.0]
 *
 * ✅ VENTAJAS vs versión anterior:
 * - Elimina OutOfMemory en imágenes grandes (8160×6144+)
 * - Memoria constante ~6.5 MB por tile (vs ~150 MB anterior)
 * - Sin archivos temporales intermedios (crop, resize)
 * - Más rápido (elimina 2 operaciones I/O)
 */
export const imageRegionToTensor = async (
  imageUri: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<Float32Array> => {
  try {
    console.log(
      `🔵 [TensorConverter] Convirtiendo región a tensor (OPTIMIZADO v2.0)...`,
    );
    console.log(`🔵 [TensorConverter] URI: ${imageUri}`);
    console.log(
      `🔵 [TensorConverter] Región: (${x}, ${y}) - ${width}x${height}`,
    );

    // 🚀 PASO ÚNICO: Extraer píxeles de región directamente desde imagen original
    console.log(
      `🔵 [TensorConverter] Cargando región con BitmapRegionDecoder nativo...`,
    );

    // Módulo nativo usa BitmapRegionDecoder para cargar SOLO esta región
    // NO carga la imagen completa → Memoria constante independiente del tamaño original
    const binFilePath = await ImagePixelModule.getImageRegionPixels(
      imageUri,
      x,
      y,
      width,
      height,
    );
    console.log(
      `✅ [TensorConverter] Archivo binario generado: ${binFilePath}`,
    );

    // Leer archivo binario como base64
    const base64Data = await RNFS.readFile(binFilePath, 'base64');

    // Decodificar base64 a Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convertir a Float32Array (interpreta bytes como floats)
    const tensor = new Float32Array(bytes.buffer);

    console.log(
      `✅ [TensorConverter] Tensor generado: ${tensor.length} elementos`,
    );
    console.log(
      `🎯 [TensorConverter] ¡Región cargada sin cargar imagen completa!`,
    );

    // 🧹 Limpiar archivo binario temporal
    await RNFS.unlink(binFilePath).catch(err => {
      console.warn(
        `⚠️ [TensorConverter] No se pudo eliminar binario: ${err.message}`,
      );
    });

    return tensor;
  } catch (error) {
    console.error(
      '❌ [TensorConverter] ERROR al convertir región a tensor:',
      error,
    );
    console.error('❌ [TensorConverter] Stack:', (error as Error).stack);

    throw error;
  }
};

/**
 * Parsea el output raw de YOLO (formato YOLOv8/v11) y extrae detecciones
 *
 * @param output - Array de TypedArray del modelo
 * @param imageWidth - Ancho de la imagen de entrada
 * @param imageHeight - Alto de la imagen de entrada
 * @param confidenceThreshold - Umbral mínimo de confianza (0.0-1.0)
 * @returns Array de detecciones parseadas
 */
export interface YoloDetection {
  classIndex: number;
  score: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const parseYoloOutput = (
  output: any[], // TypedArray[] from TFLite
  imageWidth: number,
  imageHeight: number,
  confidenceThreshold: number = 0.25,
): YoloDetection[] => {
  console.log(`🔵 [YoloParser] Parseando output de YOLO...`);
  console.log(`🔵 [YoloParser] Output arrays: ${output.length}`);
  console.log(`🔵 [YoloParser] Tamaño imagen: ${imageWidth}x${imageHeight}`);

  const detections: YoloDetection[] = [];

  if (!output || output.length === 0) {
    console.log(`⚠️  [YoloParser] Output vacío`);
    return detections;
  }

  // YOLOv8/v11 output format: [1, num_attrs, num_anchors]
  // Este modelo: [1, 6, 33600] donde 6 = [x, y, w, h, confidence, class_id]
  const outputTensor = output[0];
  console.log(`🔵 [YoloParser] Tensor size: ${outputTensor.length}`);

  // Determinar número de atributos y anchors
  // Formato: num_attrs * num_anchors
  // Este modelo YOLOv11 custom: 6 attrs * 33600 anchors = 201600
  const numClasses = 1; // Modelo custom tiene 1 clase (minador)
  const numAttrs = 4 + numClasses + 1; // x, y, w, h + confidence + class_id = 6
  const numAnchors = Math.floor(outputTensor.length / numAttrs);

  console.log(`🔵 [YoloParser] Anchors detectados: ${numAnchors}`);
  console.log(
    `🔵 [YoloParser] Formato: [${numAttrs} attrs, ${numAnchors} anchors]`,
  );

  // YOLO puede usar dos formatos:
  // Formato A (TRANSPUESTO): [x1, x2, ..., y1, y2, ..., w1, w2, ...]
  // Formato B (LINEAL): [x1, y1, w1, h1, c1, x2, y2, w2, h2, c2, ...]

  // Probar formato LINEAL primero (más común en modelos custom)
  console.log(`🔵 [YoloParser] Intentando formato TRANSPUESTO...`);

  // DEBUG: Inspeccionar primeros valores del tensor
  console.log(`🔍 [YoloParser] DEBUG - Primeros 25 valores del output:`);
  const sample = Array.from(outputTensor.slice(0, 25)) as number[];
  console.log(`   [${sample.map(val => val.toFixed(3)).join(', ')}]`);

  // YOLOv8/v11 usa formato TRANSPUESTO: [X1, X2, ..., Y1, Y2, ..., W1, W2, ..., H1, H2, ..., C1, C2, ..., ID1, ID2, ...]
  // Con 6 atributos: [33600 Xs, 33600 Ys, 33600 Ws, 33600 Hs, 33600 Confs, 33600 ClassIDs]
  for (let i = 0; i < numAnchors; i++) {
    // Coordenadas en formato TRANSPUESTO
    const centerX = outputTensor[i]; // Fila 0: todas las X
    const centerY = outputTensor[numAnchors + i]; // Fila 1: todas las Y
    const width = outputTensor[numAnchors * 2 + i]; // Fila 2: todos los widths
    const height = outputTensor[numAnchors * 3 + i]; // Fila 3: todos los heights
    const confidence = outputTensor[numAnchors * 4 + i]; // Fila 4: todas las confidences
    const classId = outputTensor[numAnchors * 5 + i]; // Fila 5: todas las class IDs

    // Filtrar por umbral
    if (confidence >= confidenceThreshold) {
      // DEBUG: Loggear primeras 3 detecciones válidas
      if (detections.length < 3) {
        console.log(
          `🔍 [YoloParser] DEBUG - Detección #${detections.length + 1}:`,
        );
        console.log(
          `   centerX=${centerX.toFixed(3)}, centerY=${centerY.toFixed(3)}`,
        );
        console.log(
          `   width=${width.toFixed(3)}, height=${height.toFixed(3)}`,
        );
        console.log(`   confidence=${confidence.toFixed(3)}`);
      }

      // Convertir coordenadas normalizadas [0-1] a píxeles
      const x = (centerX - width / 2) * imageWidth;
      const y = (centerY - height / 2) * imageHeight;
      const w = width * imageWidth;
      const h = height * imageHeight;

      // Validar que la caja sea razonable
      if (
        w > 0 &&
        h > 0 &&
        w <= imageWidth &&
        h <= imageHeight &&
        x >= -w &&
        y >= -h &&
        x <= imageWidth &&
        y <= imageHeight
      ) {
        detections.push({
          classIndex: 0,
          score: confidence,
          box: {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: w,
            height: h,
          },
        });
      }
    }
  }

  console.log(
    `✅ [YoloParser] Detecciones parseadas (antes de NMS): ${detections.length}`,
  );

  // Aplicar NMS simple (Non-Maximum Suppression) para eliminar duplicados
  const nmsDetections = applyNMS(detections, 0.45); // IoU threshold 0.45
  console.log(
    `✅ [YoloParser] Detecciones después de NMS: ${nmsDetections.length}`,
  );

  return nmsDetections;
};

/**
 * Non-Maximum Suppression (NMS) - Elimina detecciones duplicadas
 * @param detections - Lista de detecciones
 * @param iouThreshold - Umbral de IoU (default 0.45)
 */
function applyNMS(
  detections: YoloDetection[],
  iouThreshold: number = 0.45,
): YoloDetection[] {
  if (detections.length === 0) return [];

  // Ordenar por score descendente
  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const keep: YoloDetection[] = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    keep.push(current);

    // Filtrar detecciones con IoU alto con la actual
    const remaining = sorted.filter(det => {
      const iou = calculateIoU(current.box, det.box);
      return iou < iouThreshold;
    });

    sorted.length = 0;
    sorted.push(...remaining);
  }

  return keep;
}

/**
 * Calcula Intersection over Union (IoU) entre dos bounding boxes
 */
function calculateIoU(
  box1: YoloDetection['box'],
  box2: YoloDetection['box'],
): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  const intersectionWidth = Math.max(0, x2 - x1);
  const intersectionHeight = Math.max(0, y2 - y1);
  const intersectionArea = intersectionWidth * intersectionHeight;

  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - intersectionArea;

  return unionArea > 0 ? intersectionArea / unionArea : 0;
}
