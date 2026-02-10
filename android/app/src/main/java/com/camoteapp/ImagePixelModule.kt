package com.camoteapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapRegionDecoder
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.min

/**
 * Módulo Nativo para extraer píxeles RGB de imágenes
 * 
 * Permite convertir imágenes a tensores Float32Array normalizados
 * para inferencia con TensorFlow Lite (YOLOv8/v11)
 * 
 * @author CamoteApp Research Team
 * @version 1.0.0
 */
class ImagePixelModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "ImagePixelModule"
    }

    override fun getName(): String {
        return "ImagePixelModule"
    }

    /**
     * Extrae píxeles RGB normalizados de una imagen
     * 
     * OPTIMIZADO: Retorna URI de archivo binario en lugar de array gigante
     * para evitar std::bad_alloc en React Native bridge
     * 
     * @param imageUri URI de la imagen (file://, content://, etc.)
     * @param targetWidth Ancho objetivo (default: 1280)
     * @param targetHeight Alto objetivo (default: 1280)
     * @param promise Promise que retorna URI del archivo .bin con píxeles
     * 
     * Formato de salida: Archivo binario Float32 (little-endian)
     * Valores normalizados: [0.0 - 1.0] (RGB / 255.0)
     * Orden: [R, G, B, R, G, B, ...] para cada píxel
     */
    @ReactMethod
    fun getImagePixels(
        imageUri: String,
        targetWidth: Int,
        targetHeight: Int,
        promise: Promise
    ) {
        try {
            // Validar parámetros
            if (targetWidth <= 0 || targetHeight <= 0) {
                promise.reject("INVALID_DIMENSIONS", "Width and height must be positive")
                return
            }

            // Cargar imagen desde URI
            val bitmap = loadBitmapFromUri(imageUri, targetWidth, targetHeight)
                ?: run {
                    promise.reject("IMAGE_LOAD_ERROR", "Failed to load image from URI: $imageUri")
                    return
                }

            // Extraer píxeles RGB
            val pixels = extractNormalizedPixels(bitmap)

            // Liberar memoria del bitmap
            bitmap.recycle()

            // 🧹 SOLUCIÓN CRÍTICA: Escribir a archivo binario en lugar de retornar array
            // Esto evita std::bad_alloc causado por 4.9M llamadas a pushDouble() en bridge
            val cacheDir = reactApplicationContext.cacheDir
            val tempFile = File.createTempFile("tensor_pixels_", ".bin", cacheDir)
            
            // Escribir FloatArray como binario (little-endian)
            FileOutputStream(tempFile).use { fos ->
                val buffer = ByteBuffer.allocate(pixels.size * 4) // 4 bytes por float
                buffer.order(ByteOrder.LITTLE_ENDIAN)
                
                for (pixel in pixels) {
                    buffer.putFloat(pixel)
                }
                
                fos.write(buffer.array())
            }

            // Retornar URI del archivo temporal
            promise.resolve(tempFile.absolutePath)

        } catch (e: Exception) {
            promise.reject("PIXEL_EXTRACTION_ERROR", "Error extracting pixels: ${e.message}", e)
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN CRÍTICA: Extrae píxeles de REGIÓN específica sin cargar imagen completa
     * 
     * Usa BitmapRegionDecoder para cargar SOLO la región necesaria (1280×1280)
     * en lugar de cargar la imagen completa (ej: 8160×6144) y recortarla.
     * 
     * BENEFICIO: Memoria constante ~20 MB por tile vs ~150 MB anterior
     * 
     * @param imageUri URI de la imagen fuente
     * @param x Coordenada X del recorte
     * @param y Coordenada Y del recorte
     * @param width Ancho de la región (típicamente 1280)
     * @param height Alto de la región (típicamente 1280)
     * @param promise Promise que retorna URI del archivo .bin con píxeles
     */
    @ReactMethod
    fun getImageRegionPixels(
        imageUri: String,
        x: Int,
        y: Int,
        width: Int,
        height: Int,
        promise: Promise
    ) {
        try {
            // Validar parámetros
            if (width <= 0 || height <= 0) {
                promise.reject("INVALID_DIMENSIONS", "Width and height must be positive")
                return
            }
            if (x < 0 || y < 0) {
                promise.reject("INVALID_COORDINATES", "Coordinates must be non-negative")
                return
            }

            // Cargar SOLO la región específica (no imagen completa)
            val bitmap = loadBitmapRegion(imageUri, x, y, width, height)
            if (bitmap == null) {
                promise.reject("REGION_LOAD_ERROR", "Failed to load image region")
                return
            }

            // Extraer píxeles normalizados
            val pixels = extractNormalizedPixels(bitmap)
            bitmap.recycle()

            // Guardar en archivo binario (evita std::bad_alloc)
            val tempFile = File.createTempFile("tensor_pixels_", ".bin", reactApplicationContext.cacheDir)
            FileOutputStream(tempFile).use { fos ->
                val buffer = ByteBuffer.allocate(pixels.size * 4)
                buffer.order(ByteOrder.LITTLE_ENDIAN)
                for (pixel in pixels) {
                    buffer.putFloat(pixel)
                }
                fos.write(buffer.array())
            }

            promise.resolve(tempFile.absolutePath)

        } catch (e: Exception) {
            promise.reject("REGION_PIXEL_ERROR", "Error extracting region pixels: ${e.message}", e)
        }
    }

    /**
     * � Obtiene las dimensiones REALES de la imagen sin cargarla en memoria
     * 
     * VENTAJA: Lee solo el header del archivo, consumo de memoria mínimo
     * Útil para obtener dimensiones antes de calcular tiling
     * 
     * @param imageUri URI de la imagen
     * @param promise Promise que retorna { width: number, height: number }
     */
    @ReactMethod
    fun getImageDimensions(imageUri: String, promise: Promise) {
        try {
            val cleanUri = imageUri.replace("file://", "")
            val file = File(cleanUri)
            
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "File does not exist: $cleanUri")
                return
            }

            val inputStream = FileInputStream(file)
            val decoder = BitmapRegionDecoder.newInstance(inputStream, false)
                ?: run {
                    promise.reject("DECODER_ERROR", "Failed to create BitmapRegionDecoder")
                    return
                }

            val width = decoder.width
            val height = decoder.height
            
            val dimensions = Arguments.createMap()
            dimensions.putInt("width", width)
            dimensions.putInt("height", height)
            
            decoder.recycle()
            inputStream.close()
            
            Log.d(TAG, "✅ [getImageDimensions] Image dimensions: ${width}x${height}")
            promise.resolve(dimensions)

        } catch (e: Exception) {
            promise.reject("DIMENSION_ERROR", "Error reading image dimensions: ${e.message}", e)
        }
    }

    /**
     * �🚀 Carga SOLO una región específica de la imagen usando BitmapRegionDecoder
     * 
     * VENTAJA: Consume memoria proporcional a la REGIÓN, no a la imagen completa
     * Ejemplo: Región 1280×1280 = ~6.5 MB vs Imagen 8160×6144 = ~150 MB
     * 
     * @param uriString URI de la imagen fuente
     * @param x Coordenada X inicial de la región
     * @param y Coordenada Y inicial de la región
     * @param regionWidth Ancho de la región a extraer
     * @param regionHeight Alto de la región a extraer
     * @return Bitmap de la región especificada (redimensionado a 1280×1280 con letterbox)
     */
    private fun loadBitmapRegion(
        uriString: String,
        x: Int,
        y: Int,
        regionWidth: Int,
        regionHeight: Int
    ): Bitmap? {
        try {
            val cleanUri = uriString.replace("file://", "")
            val file = File(cleanUri)

            if (!file.exists()) {
                Log.e(TAG, "❌ [loadBitmapRegion] File does not exist: $cleanUri")
                return null
            }

            // Usar BitmapRegionDecoder para cargar SOLO la región
            FileInputStream(file).use { inputStream ->
                val decoder = BitmapRegionDecoder.newInstance(inputStream, false)
                    ?: run {
                        Log.e(TAG, "❌ [loadBitmapRegion] Failed to create BitmapRegionDecoder")
                        return null
                    }

                // Obtener dimensiones reales de la imagen
                val imageWidth = decoder.width
                val imageHeight = decoder.height

                Log.d(TAG, "🔍 [loadBitmapRegion] ============ DIAGNOSTICS START ============")
                Log.d(TAG, "🔍 [loadBitmapRegion] Image dimensions: ${imageWidth}x${imageHeight}")
                Log.d(TAG, "🔍 [loadBitmapRegion] Requested region: x=$x, y=$y, size=${regionWidth}x${regionHeight}")
                Log.d(TAG, "🔍 [loadBitmapRegion] Requested rect would be: ($x, $y) to (${x + regionWidth}, ${y + regionHeight})")

                // Ajustar rectángulo para que NO exceda los límites de la imagen
                val adjustedRight = minOf(x + regionWidth, imageWidth)
                val adjustedBottom = minOf(y + regionHeight, imageHeight)

                Log.d(TAG, "🔍 [loadBitmapRegion] Adjusted right: $adjustedRight (limit: $imageWidth)")
                Log.d(TAG, "🔍 [loadBitmapRegion] Adjusted bottom: $adjustedBottom (limit: $imageHeight)")

                // Validar que el rectángulo sea válido
                if (x >= imageWidth || y >= imageHeight || adjustedRight <= x || adjustedBottom <= y) {
                    Log.e(TAG, "❌ [loadBitmapRegion] Invalid rect bounds!")
                    Log.e(TAG, "   x >= imageWidth? ${x >= imageWidth}")
                    Log.e(TAG, "   y >= imageHeight? ${y >= imageHeight}")
                    Log.e(TAG, "   adjustedRight <= x? ${adjustedRight <= x}")
                    Log.e(TAG, "   adjustedBottom <= y? ${adjustedBottom <= y}")
                    decoder.recycle()
                    return null
                }

                // Definir rectángulo ajustado a los límites de la imagen
                val rect = Rect(x, y, adjustedRight, adjustedBottom)
                Log.d(TAG, "✅ [loadBitmapRegion] Final rect: ($x, $y, $adjustedRight, $adjustedBottom)")
                Log.d(TAG, "✅ [loadBitmapRegion] Rect size: ${rect.width()}x${rect.height()}")

                // Opciones de decodificación
                val options = BitmapFactory.Options().apply {
                    inPreferredConfig = Bitmap.Config.ARGB_8888
                    inSampleSize = 1 // Sin submuestreo (queremos full quality)
                }

                Log.d(TAG, "🔍 [loadBitmapRegion] Calling decoder.decodeRegion()...")
                // Decodificar SOLO la región especificada
                val regionBitmap = decoder.decodeRegion(rect, options)
                decoder.recycle()

                if (regionBitmap == null) {
                    Log.e(TAG, "❌ [loadBitmapRegion] decoder.decodeRegion() returned NULL!")
                    Log.e(TAG, "   This usually means the rect is invalid or exceeds image bounds")
                    Log.e(TAG, "   Rect was: ($x, $y, $adjustedRight, $adjustedBottom)")
                    Log.e(TAG, "   Image size: ${imageWidth}x${imageHeight}")
                    Log.e(TAG, "============ DIAGNOSTICS END (FAILED) ============")
                    return null
                }

                Log.d(TAG, "✅ [loadBitmapRegion] decoder.decodeRegion() SUCCESS!")
                Log.d(TAG, "✅ [loadBitmapRegion] Decoded bitmap size: ${regionBitmap.width}x${regionBitmap.height}")
                Log.d(TAG, "============ DIAGNOSTICS END (SUCCESS) ============")

                // Aplicar letterbox para asegurar 1280×1280
                val letterboxed = applyLetterbox(regionBitmap, 1280, 1280)
                regionBitmap.recycle()

                return letterboxed
            }

        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    /**
     * Versión optimizada que retorna solo estadísticas (para debugging)
     */
    @ReactMethod
    fun getImageStats(imageUri: String, promise: Promise) {
        try {
            val bitmap = loadBitmapFromUri(imageUri, 1280, 1280)
                ?: run {
                    promise.reject("IMAGE_LOAD_ERROR", "Failed to load image")
                    return
                }

            val stats = Arguments.createMap().apply {
                putInt("width", bitmap.width)
                putInt("height", bitmap.height)
                putInt("totalPixels", bitmap.width * bitmap.height)
                putString("config", bitmap.config.toString())
            }

            bitmap.recycle()
            promise.resolve(stats)

        } catch (e: Exception) {
            promise.reject("STATS_ERROR", e.message)
        }
    }

    /**
     * Carga bitmap desde URI y lo redimensiona usando LETTERBOX
     * (mantiene aspect ratio y agrega padding negro, como Ultralytics YOLO)
     */
    private fun loadBitmapFromUri(uriString: String, targetWidth: Int, targetHeight: Int): Bitmap? {
        try {
            // Parsear URI
            val cleanUri = uriString.replace("file://", "")
            val file = File(cleanUri)

            if (!file.exists()) {
                return null
            }

            // Cargar con opciones para optimizar memoria
            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }

            // Primera pasada: obtener dimensiones
            BitmapFactory.decodeFile(file.absolutePath, options)

            // Calcular factor de submuestreo
            options.inSampleSize = calculateInSampleSize(options, targetWidth, targetHeight)
            options.inJustDecodeBounds = false
            options.inPreferredConfig = Bitmap.Config.ARGB_8888

            // Segunda pasada: cargar imagen submuestreada
            val sourceBitmap = BitmapFactory.decodeFile(file.absolutePath, options)
                ?: return null

            // Aplicar LETTERBOX RESIZE (como Python/Ultralytics)
            val letterboxed = applyLetterbox(sourceBitmap, targetWidth, targetHeight)
            
            // Liberar bitmap original
            sourceBitmap.recycle()
            
            return letterboxed

        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    /**
     * Aplica letterbox resize: mantiene aspect ratio y agrega padding negro
     * (Idéntico al comportamiento de Ultralytics YOLO en Python)
     */
    private fun applyLetterbox(source: Bitmap, targetWidth: Int, targetHeight: Int): Bitmap {
        val sourceWidth = source.width.toFloat()
        val sourceHeight = source.height.toFloat()
        
        // Calcular ratio para mantener aspect ratio (como Python)
        val ratio = min(targetWidth / sourceWidth, targetHeight / sourceHeight)
        
        // Dimensiones después del resize manteniendo proporciones
        val newWidth = (sourceWidth * ratio).toInt()
        val newHeight = (sourceHeight * ratio).toInt()
        
        // Redimensionar manteniendo aspect ratio
        val resized = Bitmap.createScaledBitmap(source, newWidth, newHeight, true)
        
        // Crear canvas de tamaño objetivo con fondo NEGRO (padding)
        val output = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        
        // Llenar con negro (RGB: 0, 0, 0)
        canvas.drawColor(Color.BLACK)
        
        // Calcular offset para centrar la imagen
        val offsetX = (targetWidth - newWidth) / 2f
        val offsetY = (targetHeight - newHeight) / 2f
        
        // Dibujar imagen redimensionada centrada sobre el fondo negro
        val paint = Paint().apply {
            isAntiAlias = false  // Sin antialiasing para mantener píxeles exactos
            isFilterBitmap = true  // Filtrado para mejor calidad
        }
        
        canvas.drawBitmap(resized, offsetX, offsetY, paint)
        
        // Liberar bitmap redimensionado temporal
        resized.recycle()
        
        return output
    }

    /**
     * Calcula el factor de submuestreo óptimo para BitmapFactory
     * Reduce uso de memoria al cargar imágenes grandes
     */
    private fun calculateInSampleSize(
        options: BitmapFactory.Options,
        reqWidth: Int,
        reqHeight: Int
    ): Int {
        val height = options.outHeight
        val width = options.outWidth
        var inSampleSize = 1

        if (height > reqHeight || width > reqWidth) {
            val halfHeight = height / 2
            val halfWidth = width / 2

            while ((halfHeight / inSampleSize) >= reqHeight &&
                (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2
            }
        }

        return inSampleSize
    }

    /**
     * Extrae píxeles RGB normalizados [0.0 - 1.0]
     * Orden: [R, G, B, R, G, B, ...] 
     */
    private fun extractNormalizedPixels(bitmap: Bitmap): FloatArray {
        val width = bitmap.width
        val height = bitmap.height
        val pixelCount = width * height

        // Array de píxeles en formato ARGB (enteros de 32 bits)
        val pixels = IntArray(pixelCount)
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

        // Convertir a Float32 normalizado (RGB separado)
        val normalized = FloatArray(pixelCount * 3)

        for (i in pixels.indices) {
            val pixel = pixels[i]

            // Extraer canales RGB (8 bits cada uno)
            val r = (pixel shr 16) and 0xFF  // Red
            val g = (pixel shr 8) and 0xFF   // Green
            val b = pixel and 0xFF            // Blue

            // Normalizar a [0.0 - 1.0] y almacenar
            normalized[i * 3 + 0] = r / 255.0f
            normalized[i * 3 + 1] = g / 255.0f
            normalized[i * 3 + 2] = b / 255.0f
        }

        return normalized
    }
}
