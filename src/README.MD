# 🍠 CamoteApp: Detección Inteligente de Gusano Minador

> **Proyecto de Tesis:** "Detección del gusano minador de hojas en cultivos de camote mediante análisis de imágenes utilizando modelos basados en Machine Learning".
> **Universidad Señor de Sipán - Pimentel, Perú (2025)**

## 📋 Contexto y Problemática
El cultivo de camote (*Ipomoea batatas*) es vital para la seguridad alimentaria y economía en regiones como Lambayeque. Sin embargo, enfrenta amenazas críticas como el **Gusano Minador de hojas** (*Liriomyza huidobrensis*).

Actualmente, la detección de esta plaga se realiza mediante **inspección visual manual**, un proceso que es:
* **Lento:** Inviable para grandes extensiones de terreno.
* **Subjetivo:** Depende de la experiencia del evaluador.
* **Tardío:** Muchas veces se detecta cuando la infestación ya es severa, obligando al uso excesivo de pesticidas.

## 💡 Solución Propuesta
**CamoteApp** es una aplicación móvil desarrollada en **React Native** que utiliza Inteligencia Artificial (Deep Learning) para asistir al agricultor en la detección temprana de la plaga.

La aplicación funciona **Offline** (sin internet) y permite:
1.  Capturar fotos de las hojas de camote en campo.
2.  Analizar la imagen mediante un modelo **YOLOv11s/v8s** optimizado.
3.  Identificar y localizar daños por **Minador** y **Perforador**.
4.  Visualizar los resultados con cuadros delimitadores (Bounding Boxes) sobre la imagen.

## 🚀 Estrategia Técnica: Inferencia por Sectores (Tiling)
Uno de los desafíos técnicos de este proyecto es que el gusano minador genera patrones pequeños (galerías) que se pierden si se reduce drásticamente la calidad de la imagen.

Para resolver esto, el aplicativo implementa una lógica de **Preprocesamiento Inteligente**:
* **Imágenes Pequeñas:** Si la imagen es cercana a 1280x1280px, se procesa directamente.
* **Imágenes de Alta Resolución:** Si la imagen proviene de cámaras modernas (ej. 50MP), el sistema **NO** la redimensiona de golpe. En su lugar, aplica un algoritmo de **Recorte por Sectores (Tiling)**:
    1.  Divide la imagen original en cuadrantes de **1280x1280 px**.
    2.  Analiza cada cuadrante independientemente con el modelo YOLO.
    3.  Reconstruye las detecciones sobre la imagen original.

Esto garantiza que el modelo "vea" los detalles finos del daño foliar sin perder precisión.

---

## 📂 Estructura del Proyecto (Carpeta `src`)

El código fuente principal se encuentra organizado dentro de la carpeta `src` de la siguiente manera:

### 📁 `src/assets`
Almacena los recursos estáticos y binarios del modelo de IA.
* `yolo_model.tflite`: El modelo entrenado y cuantizado (exportado desde PyTorch/Ultralytics).
* `labels.txt`: Archivo de texto con las clases (`0: minador`, `1: perforador`).

### 📁 `src/components`
Contiene los elementos visuales de la interfaz de usuario (UI) que son reutilizables.
* `BoundingBox.tsx`: Componente encargado de dibujar los rectángulos de colores sobre la plaga detectada (Rojo para Minador, por ejemplo).
* `CameraOverlay.tsx`: La interfaz que se superpone a la cámara (botones de captura, indicadores de carga).

### 📁 `src/screens`
Define las pantallas principales de navegación de la aplicación.
* `HomeScreen.tsx`: Pantalla de bienvenida e instrucciones.
* `DetectionScreen.tsx`: Pantalla principal donde se activa la cámara, se toma la foto y se muestran los resultados.

### 📁 `src/hooks`
Contiene la lógica encapsulada (Custom Hooks) para separar el procesamiento de la vista.
* `useTensorflow.ts`: Hook responsable de cargar el modelo `.tflite` en memoria y gestionar el estado del motor de inferencia (cargando, listo, error).

### 📁 `src/utils`
**Núcleo lógico del procesamiento de imágenes.** Aquí residen los algoritmos matemáticos puros.
* `imageProcessor.ts`: Contiene la función de **"Tiling"**. Recibe la imagen original, decide si cortarla en sectores y prepara los tensores para el modelo.
* `nms.ts`: Implementación de *Non-Maximum Suppression*. Si al cortar la imagen un gusano aparece en dos recortes, esta función elimina el duplicado para no contarlo dos veces.

---

## 🛠 Requisitos Técnicos
* **Lenguaje:** TypeScript / JavaScript (React Native).
* **Motor IA:** TensorFlow Lite (vía Bridge).
* **Modelo:** YOLOv11s / YOLOv8s (Input: 1280x1280).
* **Dispositivo:** Android 10.0+ (Min. 4GB RAM recomendado).

## 👥 Autores
* Guzman Reaño Brayan Hipolito
* Huaman Lopez Brandon Saul

## 📅 Hoja de Ruta (Roadmap)

### FASE 1: Estructura y UI (El Cascarón) 🎨
- [x] Inicialización del proyecto React Native.
- [x] Creación de estructura de carpetas (`src`).
- [x] Instalación de librerías de navegación.
- [ ] Configuración del `Stack Navigator` en `App.tsx`.
- [ ] Diseño de `HomeScreen` (Bienvenida e Instrucciones).
- [ ] Diseño de `DetectionScreen` (UI base sin cámara).

### FASE 2: Cámara y Permisos (Los Ojos) 📷
- [ ] Configuración de permisos en `AndroidManifest.xml`.
- [ ] Integración de librería `react-native-vision-camera`.
- [ ] Visualización de flujo de video en tiempo real.
- [ ] Implementación de controles de cámara (Zoom, Enfoque).

### FASE 3: Inteligencia Artificial (El Cerebro) 🧠
- [ ] Exportación de modelo YOLOv11s/v8s a `.tflite`.
- [ ] Implementación de carga de modelo con `react-native-fast-tflite`.
- [ ] Lógica de Pre-procesamiento: Algoritmo de recorte por sectores (Tiling 1280px).
- [ ] Conversión de formatos de imagen (YUV/Bitmap a Tensor).

### FASE 4: Visualización y Validación ✅
- [ ] Dibujado de Bounding Boxes (Cajas delimitadoras) sobre el video.
- [ ] Lógica de filtrado por umbral de confianza (>50%).
- [ ] Pruebas de campo en dispositivos físicos (Redmi Note 11/13).
- [ ] Ajustes finales de rendimiento y memoria.

