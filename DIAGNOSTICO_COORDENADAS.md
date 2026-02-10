# 🔍 DIAGNÓSTICO: Coordenadas YOLO Desplazadas

## Problema Observado

- **Python/Colab**: Cuadros rodean EXACTAMENTE las plagas ✅
- **App móvil**: Cuadros DESPLAZADOS ~50-100px ❌

## Causa Raíz Probable

### 1. NORMALIZACIÓN INCORRECTA (80% probabilidad)

El código asume que YOLO retorna coordenadas normalizadas [0-1]:

```typescript
// TensorConverter.ts línea 185-188
const x = (centerX - width / 2) * imageWidth; // imageWidth = 1280
const y = (centerY - height / 2) * imageHeight; // imageHeight = 1280
```

**Pero hay 2 posibles formatos**:

- **Formato A (normalizado)**: centerX = 0.5 → x = 640 píxeles ✅
- **Formato B (píxeles directos)**: centerX = 640 → x = 819,200 píxeles ❌

### 2. VERIFICAR EN LOGS

**Busca en Metro logs**:

```
🔍 [YoloParser] DEBUG - Detección #1:
   centerX=???, centerY=???
```

**Si los valores son**:

- Entre 0.0 y 1.0 → Coordenadas normalizadas ✅ (código correcto)
- Entre 100 y 1280 → Píxeles absolutos ❌ (necesita fix)

### 3. EXPORTACIÓN DEL MODELO TFLite

**¿Cómo exportaste el modelo?**

```python
# Opción A: Exportación estándar
model.export(format='tflite', imgsz=1280)

# Opción B: Con normalización específica
model.export(format='tflite', imgsz=1280, int8=False)
```

**Verifica el preprocesamiento del modelo**:

- Si el modelo espera input [0-255] → Retorna coordenadas normalizadas
- Si el modelo espera input [0-1] → Puede retornar píxeles directos

### 4. ASPECT RATIO DEL TILE (15% probabilidad)

El tile es cuadrado (1280×1280) pero ¿el modelo fue entrenado con imágenes cuadradas?

**Verifica en Colab**:

```python
# ¿Qué shape espera tu modelo?
print(model.model.names)  # Nombres de clases
print(model.model.yaml['imgsz'])  # Tamaño de entrada

# Prueba con tile exacto 1280×1280
results = model.predict(source='tile.jpg', imgsz=1280, conf=0.4)
```

### 5. OFFSET DEL TILE (5% probabilidad)

Las coordenadas se convierten de tile → global:

```typescript
// YoloService.ts línea 268-275
const globalDetection = {
  box: {
    x: tile.x + detection.box.x, // ← ¿Correcto?
    y: tile.y + detection.box.y,
    // ...
  },
};
```

Si `detection.box.x` ya viene en píxeles absolutos de la imagen completa (8160×6144) en lugar del tile (1280×1280), sumar `tile.x` causaría desplazamiento.

## 🧪 Plan de Acción

### PASO 1: Captura logs reales

```bash
adb logcat | findstr "centerX="
```

Analiza la imagen y **comparte los valores exactos** de centerX, centerY que aparecen.

### PASO 2: Verificar exportación TFLite

En Colab, ejecuta:

```python
from ultralytics import YOLO
import numpy as np

# Cargar modelo original
model = YOLO('/content/drive/MyDrive/.../best.pt')

# Exportar TFLite con configuración explícita
model.export(
    format='tflite',
    imgsz=1280,
    int8=False,  # Sin cuantización
    dynamic=False,  # Tamaño fijo
    simplify=True
)

# Probar inferencia TFLite vs PyTorch
import tensorflow as tf

# Cargar TFLite
interpreter = tf.lite.Interpreter(model_path='best.tflite')
interpreter.allocate_tensors()

# Input/Output details
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print("INPUT SHAPE:", input_details[0]['shape'])
print("OUTPUT SHAPE:", output_details[0]['shape'])
print("INPUT DTYPE:", input_details[0]['dtype'])
print("OUTPUT DTYPE:", output_details[0]['dtype'])

# Probar con imagen de prueba 1280×1280
import cv2
img = cv2.imread('test_tile.jpg')
img_resized = cv2.resize(img, (1280, 1280))

# Normalizar input
input_data = np.expand_dims(img_resized, axis=0).astype(np.float32) / 255.0

# Inferencia
interpreter.set_tensor(input_details[0]['index'], input_data)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details[0]['index'])

print("\n🔍 PRIMEROS 25 VALORES DEL OUTPUT:")
print(output_data.flatten()[:25])

# Comparar con PyTorch
results_pytorch = model.predict(source='test_tile.jpg', imgsz=1280, verbose=False)
print("\n📊 DETECCIONES PYTORCH:")
for box in results_pytorch[0].boxes:
    print(f"  x={box.xywh[0][0]:.1f}, y={box.xywh[0][1]:.1f}, w={box.xywh[0][2]:.1f}, h={box.xywh[0][3]:.1f}")
```

**Compara**:

- Si los valores del output TFLite están entre [0-1] → Normalizado ✅
- Si están entre [0-1280] → Píxeles ❌ necesita fix

### PASO 3: Fix según el diagnóstico

**Si el modelo retorna píxeles absolutos**:

```typescript
// TensorConverter.ts línea 185-188 - CAMBIAR A:
const x = centerX - width / 2; // SIN multiplicar
const y = centerY - height / 2;
const w = width;
const h = height;
```

**Si el modelo retorna normalizados** (actual):

- Código está correcto, buscar en aspect ratio o scaling de ResultsScreen

## 🎯 Respuesta a tus Preguntas

### ¿Es problema del modelo?

**Probablemente NO**. El modelo en Colab funciona perfecto. El problema es:

1. **Conversión TFLite**: Formato de coordenadas diferente entre PyTorch y TFLite
2. **Código de parseo**: Asume formato incorrecto

### ¿Es normal?

**NO es normal**. Las coordenadas deberían ser exactas como en Colab.

### ¿Es el dispositivo?

**NO**. El dispositivo solo ejecuta el modelo, no afecta las coordenadas.

### ¿Es el código?

**SÍ, muy posiblemente**. Específicamente:

- TensorConverter.ts (parseo de coordenadas)
- O exportación incorrecta del modelo TFLite

## 📋 Checklist

- [ ] Capturar logs con valores de centerX, centerY
- [ ] Verificar que modelo TFLite es del mismo best.pt
- [ ] Confirmar que imgsz=1280 en exportación TFLite
- [ ] Ejecutar script de Colab para comparar outputs
- [ ] Ajustar código según formato de coordenadas detectado
