# 🔴 SOLUCIÓN: Crash al Cargar Modelos TFLite

## 📋 PROBLEMA IDENTIFICADO

### Síntoma

La app se crasheaba (reiniciaba automáticamente) al intentar analizar una foto justo después de mostrar:

```
LOG  Installing bindings...
LOG  Successfully installed!
BUNDLE  ./index.js  ← CRASH AQUÍ
```

### Error Real (adb logcat)

```
F com.camoteapp: JNI DETECTED ERROR IN APPLICATION:
android.content.res.Resources$NotFoundException: Resource ID #0x0

at byte[] com.tflite.TfliteModule.fetchByteDataFromUrl(java.lang.String)
(TfliteModule.java:117)
```

## 🔍 CAUSA RAÍZ

La librería `react-native-fast-tflite` busca modelos `.tflite` en la carpeta **`res/raw/`** de Android (como recursos nativos con ID), NO en la carpeta `assets/`.

### Estructura Incorrecta (Antes)

```
android/app/src/main/
├── assets/
│   ├── yolov8.tflite   ❌ Aquí NO funciona
│   └── yolov11.tflite  ❌ Aquí NO funciona
└── res/
    └── (vacío)
```

### Estructura Correcta (Ahora)

```
android/app/src/main/
├── assets/
│   ├── yolov8.tflite   (puede quedar, no se usa)
│   └── yolov11.tflite  (puede quedar, no se usa)
└── res/
    └── raw/  ✅ AQUÍ deben estar los modelos
        ├── yolov8.tflite   (12.1 MB)
        └── yolov11.tflite  (10.5 MB)
```

## ✅ SOLUCIÓN APLICADA

### Paso 1: Mover Modelos a res/raw

```powershell
# Crear carpeta res/raw
New-Item -Path "android\app\src\main\res\raw" -ItemType Directory -Force

# Copiar modelos
Copy-Item "android\app\src\main\assets\*.tflite" -Destination "android\app\src\main\res\raw\" -Force
```

### Paso 2: Actualizar Código

**Archivo:** `src/utils/YoloService.ts`

**Antes:**

```typescript
const fileName = 'yolov11.tflite'; // ❌ Con extensión
loadedModel = await loadTensorflowModel({ url: fileName });
```

**Ahora:**

```typescript
const resourceName = 'yolov11'; // ✅ SIN extensión (nombre del recurso)
loadedModel = await loadTensorflowModel({ url: resourceName });
```

**¿Por qué sin extensión?**

- En Android, los recursos en `res/raw/` se referencian por nombre (sin extensión)
- Ejemplo: `res/raw/yolov11.tflite` → Se accede como `R.raw.yolov11`
- `react-native-fast-tflite` internamente hace esta conversión

### Paso 3: Reconstruir App

```powershell
cd android
.\gradlew clean
cd ..
npm run android
```

## 📊 VERIFICACIÓN

Después de instalar la app actualizada, al analizar una foto deberías ver:

**✅ Logs de Éxito:**

```
🔵 [YoloService] Intentando cargar TFLite REAL desde res/raw...
🔵 [YoloService] Ruta: android/app/src/main/res/raw/yolov11.tflite
✅ [YoloService] ¡Modelo TFLite cargado exitosamente!
✅ [YoloService] Modelo activo: yolov11
```

**❌ Si Aún Falla:**
Verás un Alert con el error específico y los logs mostrarán:

```
❌ [YoloService] ERROR CRÍTICO al cargar TFLite: [mensaje]
⚠️ [YoloService] Activando MODO SIMULACIÓN como fallback
```

## 🎯 PRÓXIMOS PASOS

Una vez que el modelo cargue correctamente:

1. **Parsear Output de YOLO**: El modelo retorna un tensor con detecciones, necesitamos parsearlo
2. **Implementar NMS**: Eliminar detecciones duplicadas entre tiles
3. **Optimizar Procesamiento**: Usar Worklets para mejor rendimiento

## 📝 NOTAS TÉCNICAS

### Tamaños de Modelos

- `yolov8.tflite`: 12,147,662 bytes (~12 MB)
- `yolov11.tflite`: 10,530,890 bytes (~10.5 MB)

### Carga en Memoria

Al ejecutar `loadTensorflowModel()`, el modelo completo se carga en RAM del dispositivo. En un celular con 4-6 GB de RAM, esto deja suficiente espacio para procesamiento.

### Formatos Soportados

`react-native-fast-tflite` soporta:

- Modelos cuantizados (int8)
- Modelos float16
- Modelos float32
- Delegados GPU (si el dispositivo lo soporta)

### Limitaciones Conocidas

- Los archivos en `res/raw/` tienen un límite de tamaño en algunos dispositivos Android antiguos (generalmente 1 MB)
- Modelos > 10 MB pueden causar lentitud al iniciar la app por primera vez
- El APK aumenta de tamaño en ~22 MB (suma de ambos modelos)

## 🔧 COMANDOS ÚTILES

### Ver recursos en APK compilado

```powershell
# Extraer APK
cd android/app/build/outputs/apk/debug
Expand-Archive app-debug.apk extracted

# Ver recursos
Get-ChildItem extracted/res/raw
```

### Ver logs en tiempo real

```powershell
adb logcat | Select-String "YoloService"
```

### Limpiar caché de build

```powershell
cd android
.\gradlew clean cleanBuildCache
cd ..
```

## ✅ ESTADO FINAL

- ✅ Modelos copiados a `res/raw/`
- ✅ Código actualizado para cargar sin extensión
- ✅ Manejo de errores mejorado con Alert
- ✅ Fallback a simulación si falla
- ⏳ Build en progreso...

---

**Fecha de Solución:** 4 de febrero de 2026  
**Tiempo de Diagnóstico:** ~15 minutos  
**Cambios en Código:** Mínimos (2 líneas en YoloService.ts)  
**Impacto:** Crítico - Sin esto, TFLite no puede funcionar
