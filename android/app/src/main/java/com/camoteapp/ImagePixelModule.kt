package com.camoteapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
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

    override fun getName(): String {
        return "ImagePixelModule"
    }

    /**
     * Extrae píxeles RGB normalizados de una imagen
     * 
     * @param imageUri URI de la imagen (file://, content://, etc.)
     * @param targetWidth Ancho objetivo (default: 1280)
     * @param targetHeight Alto objetivo (default: 1280)
     * @param promise Promise que retorna WritableArray con píxeles normalizados
     * 
     * Formato de salida: Float32Array de tamaño [targetWidth * targetHeight * 3]
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

            // Retornar como WritableArray
            val pixelArray = Arguments.createArray()
            pixels.forEach { pixelArray.pushDouble(it.toDouble()) }

            promise.resolve(pixelArray)

        } catch (e: Exception) {
            promise.reject("PIXEL_EXTRACTION_ERROR", "Error extracting pixels: ${e.message}", e)
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
