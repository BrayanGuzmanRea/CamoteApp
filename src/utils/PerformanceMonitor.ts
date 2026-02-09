import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';

// ==================== INTERFACES ====================

export interface PerformanceMetrics {
  // Identificación
  analysisId: string;
  timestamp: string;

  // Dispositivo
  device: {
    model: string;
    os: string;
    osVersion: string;
  };

  // Configuración del modelo
  model: {
    name: string;
    threshold: number;
  };

  // Imagen
  image: {
    width: number;
    height: number;
    uri: string;
  };

  // Rendimiento
  performance: {
    time: {
      preprocessing: number; // ms
      tileInference: number[]; // ms por cada tile
      totalInference: number; // ms total de inferencia
      totalAnalysis: number; // ms desde inicio hasta fin
    };
    memory: {
      initial: number; // MB
      peak: number; // MB
      final: number; // MB
      delta: number; // MB (pico - inicial)
    };
    battery: {
      before: number; // %
      after: number; // %
      consumed: number; // % (before - after)
      isCharging: boolean;
    };
  };

  // Resultados
  detections: {
    total: number; // Sin filtrar
    filtered: number; // Después de threshold
    tilesProcessed: number;
  };
}

// ==================== FUNCIONES DE MEDICIÓN ====================

/**
 * Obtiene el uso actual de memoria en MB
 * Nota: En React Native, usamos un estimado basado en JS heap
 */
export async function getMemoryUsage(): Promise<number> {
  try {
    if (global.performance && (global.performance as any).memory) {
      // Chrome/Hermes tiene performance.memory
      const memory = (global.performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      return Math.round(usedMB * 100) / 100; // 2 decimales
    }

    // Fallback: Usar getUsedMemory de device-info
    const memoryBytes = await DeviceInfo.getUsedMemory();
    const memoryMB = memoryBytes / (1024 * 1024);
    return Math.round(memoryMB * 100) / 100;
  } catch (error) {
    console.warn('⚠️ [PerformanceMonitor] No se pudo medir memoria:', error);
    return 0;
  }
}

/**
 * Obtiene el nivel actual de batería (0-100)
 */
export async function getBatteryLevel(): Promise<number> {
  try {
    const level = await DeviceInfo.getBatteryLevel();
    return Math.round(level * 100 * 100) / 100; // Convierte 0.685 → 68.5%
  } catch (error) {
    console.warn('⚠️ [PerformanceMonitor] No se pudo leer batería:', error);
    return -1; // Indica error
  }
}

/**
 * Verifica si el dispositivo está cargando
 */
export async function isCharging(): Promise<boolean> {
  try {
    const charging = await DeviceInfo.isBatteryCharging();
    return charging;
  } catch (error) {
    console.warn('⚠️ [PerformanceMonitor] No se pudo verificar carga:', error);
    return false;
  }
}

/**
 * Obtiene información del dispositivo
 */
export async function getDeviceInfo(): Promise<{
  model: string;
  os: string;
  osVersion: string;
}> {
  try {
    const model = await DeviceInfo.getModel();
    const systemName = await DeviceInfo.getSystemName();
    const systemVersion = await DeviceInfo.getSystemVersion();

    return {
      model,
      os: systemName,
      osVersion: systemVersion,
    };
  } catch (error) {
    console.warn(
      '⚠️ [PerformanceMonitor] No se pudo obtener info dispositivo:',
      error,
    );
    return {
      model: 'Unknown',
      os: Platform.OS,
      osVersion: 'Unknown',
    };
  }
}

/**
 * Genera un ID único para el análisis
 */
export function generateAnalysisId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== FORMATEO DE MÉTRICAS ====================

/**
 * Formatea tiempo en ms para display
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  } else {
    return `${(ms / 1000).toFixed(2)} s`;
  }
}

/**
 * Formatea memoria en MB
 */
export function formatMemory(mb: number): string {
  return `${mb.toFixed(1)} MB`;
}

/**
 * Formatea batería con 1 decimal
 */
export function formatBattery(percent: number): string {
  if (percent < 0) return 'N/A';
  return `${percent.toFixed(1)}%`;
}

/**
 * Calcula estadísticas básicas de un array
 */
export function calculateStats(values: number[]): {
  mean: number;
  min: number;
  max: number;
  std: number;
} {
  if (values.length === 0) {
    return { mean: 0, min: 0, max: 0, std: 0 };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  const std = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    std: Math.round(std * 100) / 100,
  };
}

// ==================== ALMACENAMIENTO LOCAL ====================

const HISTORY_KEY = '@CamoteApp:AnalysisHistory';

/**
 * Guarda análisis en historial local
 */
export async function saveToHistory(
  metrics: PerformanceMetrics,
): Promise<void> {
  try {
    // Leer historial existente
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    const history: PerformanceMetrics[] = historyJson
      ? JSON.parse(historyJson)
      : [];

    // Agregar nuevo análisis al inicio
    history.unshift(metrics);

    // Limitar a últimos 100 análisis
    const trimmedHistory = history.slice(0, 100);

    // Guardar
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    console.log(
      `✅ [PerformanceMonitor] Análisis guardado en historial (total: ${trimmedHistory.length})`,
    );
  } catch (error) {
    console.error('❌ [PerformanceMonitor] Error guardando historial:', error);
  }
}

/**
 * Recupera todo el historial
 */
export async function getHistory(): Promise<PerformanceMetrics[]> {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('❌ [PerformanceMonitor] Error leyendo historial:', error);
    return [];
  }
}

/**
 * Limpia todo el historial
 */
export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
    console.log('✅ [PerformanceMonitor] Historial limpiado');
  } catch (error) {
    console.error('❌ [PerformanceMonitor] Error limpiando historial:', error);
  }
}

// ==================== EXPORTACIÓN DE DATOS ====================

/**
 * Exporta métricas individuales a JSON
 */
export async function exportMetricsJSON(
  metrics: PerformanceMetrics,
): Promise<string> {
  try {
    const fileName = `metricas_${metrics.analysisId}.json`;
    const downloadPath = `${RNFS.DownloadDirectoryPath}/CamoteApp`;

    // Crear directorio si no existe
    const dirExists = await RNFS.exists(downloadPath);
    if (!dirExists) {
      await RNFS.mkdir(downloadPath);
    }

    const filePath = `${downloadPath}/${fileName}`;

    // Escribir JSON formateado
    await RNFS.writeFile(filePath, JSON.stringify(metrics, null, 2), 'utf8');

    console.log(`✅ [PerformanceMonitor] JSON exportado: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('❌ [PerformanceMonitor] Error exportando JSON:', error);
    throw error;
  }
}

/**
 * Exporta métricas a CSV (para Excel/Python/R)
 */
export async function exportMetricsCSV(
  metrics: PerformanceMetrics,
): Promise<string> {
  try {
    const fileName = `metricas_${metrics.analysisId}.csv`;
    const downloadPath = `${RNFS.DownloadDirectoryPath}/CamoteApp`;

    const dirExists = await RNFS.exists(downloadPath);
    if (!dirExists) {
      await RNFS.mkdir(downloadPath);
    }

    const filePath = `${downloadPath}/${fileName}`;

    // Cabeceras CSV
    const headers = [
      'timestamp',
      'analysisId',
      'deviceModel',
      'os',
      'osVersion',
      'modelName',
      'threshold',
      'imageWidth',
      'imageHeight',
      'preprocessingTime',
      'totalInferenceTime',
      'totalAnalysisTime',
      'memoryInitial',
      'memoryPeak',
      'memoryDelta',
      'batteryBefore',
      'batteryAfter',
      'batteryConsumed',
      'isCharging',
      'totalDetections',
      'filteredDetections',
      'tilesProcessed',
    ].join(',');

    // Fila de datos
    const row = [
      metrics.timestamp,
      metrics.analysisId,
      metrics.device.model,
      metrics.device.os,
      metrics.device.osVersion,
      metrics.model.name,
      metrics.model.threshold,
      metrics.image.width,
      metrics.image.height,
      metrics.performance.time.preprocessing,
      metrics.performance.time.totalInference,
      metrics.performance.time.totalAnalysis,
      metrics.performance.memory.initial,
      metrics.performance.memory.peak,
      metrics.performance.memory.delta,
      metrics.performance.battery.before,
      metrics.performance.battery.after,
      metrics.performance.battery.consumed,
      metrics.performance.battery.isCharging,
      metrics.detections.total,
      metrics.detections.filtered,
      metrics.detections.tilesProcessed,
    ].join(',');

    const csvContent = `${headers}\n${row}`;

    await RNFS.writeFile(filePath, csvContent, 'utf8');

    console.log(`✅ [PerformanceMonitor] CSV exportado: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('❌ [PerformanceMonitor] Error exportando CSV:', error);
    throw error;
  }
}

/**
 * Exporta TODO el historial a CSV consolidado
 */
export async function exportHistoryCSV(): Promise<string> {
  try {
    const history = await getHistory();

    if (history.length === 0) {
      throw new Error('No hay análisis en el historial');
    }

    const fileName = `historial_completo_${Date.now()}.csv`;
    const downloadPath = `${RNFS.DownloadDirectoryPath}/CamoteApp`;

    const dirExists = await RNFS.exists(downloadPath);
    if (!dirExists) {
      await RNFS.mkdir(downloadPath);
    }

    const filePath = `${downloadPath}/${fileName}`;

    // Cabeceras
    const headers = [
      'timestamp',
      'analysisId',
      'deviceModel',
      'os',
      'osVersion',
      'modelName',
      'threshold',
      'imageWidth',
      'imageHeight',
      'preprocessingTime',
      'totalInferenceTime',
      'totalAnalysisTime',
      'memoryInitial',
      'memoryPeak',
      'memoryDelta',
      'batteryBefore',
      'batteryAfter',
      'batteryConsumed',
      'isCharging',
      'totalDetections',
      'filteredDetections',
      'tilesProcessed',
    ].join(',');

    // Filas
    const rows = history.map(m => {
      return [
        m.timestamp,
        m.analysisId,
        m.device.model,
        m.device.os,
        m.device.osVersion,
        m.model.name,
        m.model.threshold,
        m.image.width,
        m.image.height,
        m.performance.time.preprocessing,
        m.performance.time.totalInference,
        m.performance.time.totalAnalysis,
        m.performance.memory.initial,
        m.performance.memory.peak,
        m.performance.memory.delta,
        m.performance.battery.before,
        m.performance.battery.after,
        m.performance.battery.consumed,
        m.performance.battery.isCharging,
        m.detections.total,
        m.detections.filtered,
        m.detections.tilesProcessed,
      ].join(',');
    });

    const csvContent = `${headers}\n${rows.join('\n')}`;

    await RNFS.writeFile(filePath, csvContent, 'utf8');

    console.log(
      `✅ [PerformanceMonitor] Historial completo exportado: ${filePath} (${history.length} análisis)`,
    );
    return filePath;
  } catch (error) {
    console.error(
      '❌ [PerformanceMonitor] Error exportando historial CSV:',
      error,
    );
    throw error;
  }
}
