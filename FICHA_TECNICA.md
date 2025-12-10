# Ficha Técnica - CamoteApp
## Proyecto de Detección de Plagas en Camote
### Universidad Señor de Sipán

---

## 📋 Información General

**Nombre del Proyecto:** CamoteApp
**Versión Actual:** 0.0.1
**Plataforma:** Android (React Native)
**Fecha de Última Actualización:** 10 de Diciembre de 2025
**Estado:** Operativo en Desarrollo

---

## 🔧 Especificaciones Técnicas

### Stack Tecnológico

| Componente | Versión | Propósito |
|------------|---------|-----------|
| React Native | 0.74.6 | Framework principal para desarrollo móvil |
| React | 18.2.0 | Librería de UI |
| Node.js | >=20 | Entorno de ejecución JavaScript |
| React Navigation | 6.1.18 | Sistema de navegación entre pantallas |
| TypeScript | 5.0.4 | Tipado estático para JavaScript |
| Hermes Engine | Habilitado | Motor JavaScript optimizado |

### Configuración Android

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| compileSdkVersion | 34 | Versión del SDK de compilación |
| targetSdkVersion | 34 | Versión objetivo de Android |
| minSdkVersion | 23 | Android 6.0 (Marshmallow) mínimo |
| buildToolsVersion | 34.0.0 | Herramientas de construcción |
| ndkVersion | 26.1.10909125 | Android NDK para código nativo |
| Kotlin Version | 1.9.0 | Versión del lenguaje Kotlin |
| Gradle Version | 8.8 | Sistema de construcción |
| Java Version | Compatible con Gradle 8.8 | JDK requerido |

### Arquitectura React Native

| Característica | Estado | Notas |
|----------------|--------|-------|
| New Architecture | Deshabilitado | Deshabilitado por problemas de compatibilidad con RN 0.76+ |
| Hermes Engine | Habilitado | Motor JS optimizado para mejor rendimiento |
| Edge-to-Edge Display | Deshabilitado | Pantalla completa deshabilitada |
| TurboModules | No disponible | Requiere New Architecture |
| Fabric Renderer | No disponible | Requiere New Architecture |

---

## 📦 Dependencias del Proyecto

### Dependencias de Producción

```json
{
  "react": "18.2.0",
  "react-native": "0.74.6",
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/native-stack": "^6.11.0",
  "react-native-safe-area-context": "^4.10.5",
  "react-native-screens": "^3.34.0"
}
```

### Dependencias de Desarrollo

```json
{
  "@babel/core": "^7.20.0",
  "@babel/preset-env": "^7.20.0",
  "@babel/runtime": "^7.20.0",
  "@react-native/babel-preset": "0.74.87",
  "@react-native/eslint-config": "0.74.87",
  "@react-native/metro-config": "0.74.87",
  "@react-native/typescript-config": "0.74.87",
  "@types/jest": "^29.5.13",
  "@types/react": "^18.2.6",
  "@types/react-test-renderer": "^18.0.0",
  "eslint": "^8.19.0",
  "jest": "^29.6.3",
  "prettier": "2.8.8",
  "react-test-renderer": "18.2.0",
  "typescript": "^5.0.4"
}
```

---

## 🔄 Historial de Cambios Realizados

### 1. **Downgrade de React Native (Crítico)**

**Problema Inicial:** React Native 0.76+ y 0.82.1 presentaban errores críticos con librerías nativas

**Versiones probadas:**
- ❌ React Native 0.82.1 (inicial) - Error: librerías nativas no encontradas
- ❌ React Native 0.76.5 - Error: `libreact_featureflagsjni.so` no encontrada
- ✅ React Native 0.74.6 (final) - **ESTABLE Y FUNCIONAL**

**Cambios en package.json:**
```json
"react-native": "0.74.6"  // Downgrade desde 0.76.5
```

**Dependencias actualizadas en sincronía:**
```json
"@react-native/babel-preset": "0.74.87",
"@react-native/eslint-config": "0.74.87",
"@react-native/metro-config": "0.74.87",
"@react-native/typescript-config": "0.74.87"
```

---

### 2. **Configuración de Android SDK**

**Archivo:** `android/build.gradle`

**Cambios realizados:**

| Parámetro | Valor Anterior | Valor Nuevo | Razón del Cambio |
|-----------|---------------|-------------|------------------|
| compileSdkVersion | 36 → 35 → | **34** | Compatibilidad con RN 0.74 y Gradle 8.8 |
| targetSdkVersion | 36 → 35 → | **34** | Mantener consistencia con compileSdk |
| buildToolsVersion | 35.0.0 → | **34.0.0** | Alineación con SDK 34 |
| kotlinVersion | 2.0.21 → 1.9.24 → | **1.9.0** | Compatibilidad con RN 0.74 |

**Código actualizado:**
```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 23
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "26.1.10909125"
        kotlinVersion = "1.9.0"
    }
}
```

---

### 3. **Deshabilitación de New Architecture**

**Archivo:** `android/gradle.properties`

**Problema:** New Architecture de RN 0.76+ causaba errores de librerías nativas no encontradas

**Cambio realizado:**
```properties
# Antes
newArchEnabled=true

# Después
newArchEnabled=false
```

**Impacto:**
- ✅ Resuelve errores de `libreact_featureflagsjni.so`
- ✅ Compatibilidad con librerías legacy
- ⚠️ No disponible: TurboModules y Fabric Renderer

---

### 4. **Configuración de Hermes Engine**

**Archivo:** `android/gradle.properties`

**Historial de cambios:**

| Intento | Configuración | Resultado |
|---------|--------------|-----------|
| 1 | `hermesEnabled=true` | Error: `libhermes_executor.so` no encontrada (RN 0.76) |
| 2 | `hermesEnabled=false` | Error: `libjscexecutor.so` no encontrada (RN 0.76) |
| 3 | `hermesEnabled=true` | ✅ **FUNCIONAL** (RN 0.74) |

**Configuración final:**
```properties
hermesEnabled=true
```

**Beneficios de Hermes:**
- Menor uso de memoria
- Tiempo de inicio más rápido
- Mejor rendimiento general
- Tamaño de APK optimizado

---

### 5. **Actualización de MainActivity.kt**

**Archivo:** `android/app/src/main/java/com/camoteapp/MainActivity.kt`

**Problema:** Referencia a `fabricEnabled` causaba errores de compilación

**Cambio realizado:**
```kotlin
// Antes
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled

override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(
      this,
      mainComponentName,
      fabricEnabled(this)  // ❌ Causaba error
    )

// Después
override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(
      this,
      mainComponentName,
      false  // ✅ Hardcoded para deshabilitar New Architecture
    )
```

---

### 6. **Configuración de Gradle Settings**

**Archivo:** `android/settings.gradle`

**Problema:** Sintaxis de RN 0.76+ incompatible con RN 0.74

**Cambio crítico:**
```gradle
// ❌ ANTES - RN 0.76+ syntax
plugins {
    id("com.facebook.react.settings")
}

extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
    ex.autolinkLibrariesFromCommand()
}

// ✅ DESPUÉS - RN 0.74 syntax
plugins {
    id("com.facebook.react.settings")
}

apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
applyNativeModulesSettingsGradle(settings)
```

---

### 7. **Actualización de app/build.gradle**

**Archivo:** `android/app/build.gradle`

**Problema:** Método `autolinkLibrariesWithApp()` no existe en RN 0.74

**Cambios realizados:**

```gradle
// ❌ ANTES - RN 0.76+ syntax
react {
    /* Autolinking */
    autolinkLibrariesWithApp()
}

// ✅ DESPUÉS - RN 0.74 syntax
react {
    // Configuración sin autolinkLibrariesWithApp()
}

// Autolinking agregado al final del archivo
apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
applyNativeModulesAppBuildGradle(project)
```

**Manifest Placeholders agregados:**
```gradle
defaultConfig {
    manifestPlaceholders = [
        usesCleartextTraffic: "true"  // Permitir HTTP en desarrollo
    ]
}
```

---

### 8. **Scripts de PowerShell Creados**

#### 8.1 `complete-rebuild.ps1`
**Propósito:** Reconstrucción completa del proyecto

**Funciones:**
1. Limpia `node_modules` y `package-lock.json`
2. Reinstala dependencias con `npm install`
3. Desinstala app anterior del dispositivo
4. Limpia build de Android con `./gradlew clean`
5. Construye APK debug con `./gradlew assembleDebug`
6. Instala APK en dispositivo
7. Inicia la aplicación

**Comando:** `.\complete-rebuild.ps1`

---

#### 8.2 `start-dev.ps1`
**Propósito:** Iniciar Metro Bundler para desarrollo

**Funciones:**
- Inicia el servidor Metro en puerto 8081
- Muestra instrucciones de conexión
- Permite hot-reload de código JavaScript

**Comando:** `.\start-dev.ps1`

**Instrucciones mostradas:**
1. Asegurar dispositivo y PC en misma red WiFi
2. Presionar RELOAD (R, R) en dispositivo
3. Configurar IP del Dev Server si es necesario

---

#### 8.3 `kill-metro.ps1`
**Propósito:** Detener procesos Metro Bundler en ejecución

**Funciones:**
- Encuentra procesos usando puerto 8081
- Termina procesos Node.js relacionados
- Limpia conexiones TCP

**Comando:** `.\kill-metro.ps1`

---

#### 8.4 `setup-adb-reverse.ps1`
**Propósito:** Configurar port forwarding para conexión USB

**Funciones:**
- Verifica dispositivos conectados vía ADB
- Configura `adb reverse tcp:8081 tcp:8081`
- Lista puertos configurados

**Comando:** `.\setup-adb-reverse.ps1`

**Uso:** Ejecutar antes de presionar RELOAD en el dispositivo

---

#### 8.5 `fix-connection.ps1` ⭐
**Propósito:** Solución completa para problemas de conexión

**Funciones:**
1. Verifica dispositivos conectados
2. Reinicia servidor ADB (`kill-server` → `start-server`)
3. Configura port forwarding para puertos 8081 y 8097
4. Verifica configuración con `adb reverse --list`
5. Reinicia la app en el dispositivo automáticamente

**Comando:** `.\fix-connection.ps1`

**Cuándo usar:**
- Cuando aparece "Could not connect to development server"
- Después de desconectar/reconectar el dispositivo
- Si el RELOAD (R, R) no funciona

---

#### 8.6 `install-apk.ps1`
**Propósito:** Instalar APK en dispositivo conectado

**Funciones:**
- Agrega ADB al PATH
- Verifica dispositivos conectados
- Instala APK con flag `-r` (reinstalar)
- Inicia la aplicación automáticamente

**Comando:** `.\install-apk.ps1`

**Ruta del APK:** `android\app\build\outputs\apk\debug\app-debug.apk`

---

### 9. **Configuración de Port Forwarding (Crítico para USB)**

**Problema:** Dispositivo conectado por USB no podía alcanzar Metro Bundler en localhost:8081

**Solución implementada:**
```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097
```

**Qué hace:**
- Redirige peticiones del dispositivo a `localhost:8081` → PC puerto 8081
- Redirige peticiones del dispositivo a `localhost:8097` → PC puerto 8097 (DevTools)

**Verificación:**
```bash
adb reverse --list
# Salida esperada:
# tcp:8081 tcp:8081
# tcp:8097 tcp:8097
```

---

## 🐛 Problemas Resueltos

### Error 1: ADB no reconocido
**Síntoma:** `"adb" no se reconoce como un comando interno o externo`

**Causa:** Android SDK platform-tools no está en el PATH del sistema

**Solución:**
- Agregado automáticamente en scripts PowerShell:
  ```powershell
  $env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
  ```

---

### Error 2: Incompatibilidad de dependencias
**Síntoma:** `react-native-screens 3.31.1 incompatible con @react-navigation/native-stack`

**Causa:** Versiones desactualizadas de librerías de navegación

**Solución:**
- Actualizado `react-native-screens` a 3.34.0
- Actualizado `react-native-safe-area-context` a 4.10.5

---

### Error 3: Kotlin version mismatch
**Síntoma:** `Incompatible classes were found... binary version 2.1.0, expected 1.9.0`

**Causa:** Versión de Kotlin 2.0+ incompatible con React Native 0.74

**Solución:**
- Downgrade a Kotlin 1.9.0 en `android/build.gradle`

---

### Error 4: New Architecture libraries not found
**Síntoma:** `library "libreact_featureflagsjni.so" not found`

**Causa:** New Architecture no está completamente implementada en la distribución de RN 0.76+

**Solución:**
- Deshabilitada New Architecture: `newArchEnabled=false`
- Hardcoded `fabricEnabled = false` en MainActivity.kt

---

### Error 5: Hermes executor not found
**Síntoma:** `library "libhermes_executor.so" not found`

**Causa:** Incompatibilidad entre versión de Hermes y React Native 0.76

**Solución:**
- Downgrade a React Native 0.74.6 donde Hermes está completamente soportado

---

### Error 6: JSC executor not found
**Síntoma:** `library "libjscexecutor.so" not found`

**Causa:** JavaScriptCore no disponible en RN 0.76 con Hermes deshabilitado

**Solución:**
- Downgrade a React Native 0.74.6
- Re-habilitado Hermes: `hermesEnabled=true`

---

### Error 7: Settings.gradle syntax error
**Síntoma:** `Could not get unknown property 'com' for settings 'android'`

**Causa:** Sintaxis `extensions.configure(com.facebook.react.ReactSettingsExtension)` es de RN 0.76+

**Solución:**
- Cambiado a sintaxis RN 0.74:
  ```gradle
  apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
  applyNativeModulesSettingsGradle(settings)
  ```

---

### Error 8: autolinkLibrariesWithApp() not found
**Síntoma:** `Could not find method autolinkLibrariesWithApp()`

**Causa:** Método no existe en React Native 0.74

**Solución:**
- Removido de bloque `react {}`
- Agregado autolinking manual al final de `app/build.gradle`

---

### Error 9: Could not connect to development server
**Síntoma:** Pantalla roja "Could not connect to development server"

**Causa:** Port forwarding no configurado para conexión USB

**Solución:**
- Implementado `adb reverse tcp:8081 tcp:8081`
- Script automatizado: `fix-connection.ps1`

---

### Error 10: Metro already running on port 8081
**Síntoma:** `listen EADDRINUSE: address already in use :::8081`

**Causa:** Múltiples instancias de Metro Bundler ejecutándose

**Solución:**
- Script `kill-metro.ps1` para terminar procesos
- Comando manual: `npx react-native start --reset-cache`

---

## 🚀 Proceso de Desarrollo

### Flujo de Trabajo Recomendado

1. **Primera vez / Después de cambios en dependencias:**
   ```powershell
   .\complete-rebuild.ps1
   ```

2. **Desarrollo diario:**
   ```powershell
   # Terminal 1: Iniciar Metro Bundler
   .\start-dev.ps1

   # Terminal 2: Configurar conexión USB (si es necesario)
   .\fix-connection.ps1
   ```

3. **Si hay problemas de conexión:**
   ```powershell
   .\fix-connection.ps1
   # Luego presionar RELOAD (R, R) en el dispositivo
   ```

4. **Para reinstalar la app:**
   ```powershell
   cd android
   .\gradlew assembleDebug
   cd ..
   .\install-apk.ps1
   ```

---

## 📱 Configuración del Dispositivo

### Requisitos del Dispositivo

**Dispositivo de Prueba:**
- Modelo: Redmi Note 11 (2201117TL)
- Android Version: 13
- Conexión: USB con depuración habilitada

### Habilitar Depuración USB

1. Ir a **Ajustes** → **Acerca del teléfono**
2. Tocar **Versión MIUI** 7 veces (habilitar opciones de desarrollador)
3. Ir a **Ajustes** → **Ajustes adicionales** → **Opciones de desarrollador**
4. Activar **Depuración USB**
5. Conectar el dispositivo por USB y aceptar el diálogo de autorización

### Verificar Conexión

```powershell
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
adb devices

# Salida esperada:
# List of devices attached
# 2201117TL       device
```

---

## 🔐 Configuración de Seguridad

### Permisos de Red

**Archivo:** `android/app/build.gradle`

```gradle
manifestPlaceholders = [
    usesCleartextTraffic: "true"  // ⚠️ Solo para desarrollo
]
```

**⚠️ IMPORTANTE:** En producción, cambiar a `false` y usar HTTPS

---

## 📊 Estructura del Proyecto

```
CamoteApp/
├── android/                          # Código nativo Android
│   ├── app/
│   │   ├── build.gradle             # ✏️ Modificado - Autolinking RN 0.74
│   │   └── src/main/java/com/camoteapp/
│   │       └── MainActivity.kt      # ✏️ Modificado - Deshabilitar Fabric
│   ├── build.gradle                 # ✏️ Modificado - SDK versions, Kotlin
│   ├── settings.gradle              # ✏️ Modificado - Sintaxis RN 0.74
│   └── gradle.properties            # ✏️ Modificado - New Arch, Hermes
├── src/
│   └── screens/
│       ├── HomeScreen.tsx           # Pantalla principal
│       └── DetectionScreen.tsx      # Pantalla de detección
├── App.tsx                          # ✏️ Modificado temporalmente (restaurar)
├── package.json                     # ✏️ Modificado - RN 0.74.6
├── react-native.config.js           # ✅ Creado - Config autolinking
├── complete-rebuild.ps1             # ✅ Creado - Rebuild completo
├── start-dev.ps1                    # ✅ Creado - Iniciar Metro
├── kill-metro.ps1                   # ✅ Creado - Detener Metro
├── setup-adb-reverse.ps1            # ✅ Creado - Port forwarding
├── fix-connection.ps1               # ✅ Creado - Solución conexión
├── install-apk.ps1                  # ✅ Creado - Instalar APK
└── FICHA_TECNICA.md                 # ✅ Este documento
```

---

## ⚠️ Notas Importantes

### 1. App.tsx Temporal
El archivo `App.tsx` actualmente contiene una versión de prueba simplificada:

```tsx
// VERSIÓN ACTUAL (Prueba Simple)
function AppTest(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />
      <View style={styles.content}>
        <Text style={styles.title}>🍠 CamoteApp</Text>
        <Text style={styles.subtitle}>Prueba Simple</Text>
      </View>
    </SafeAreaView>
  );
}
```

**⚠️ PENDIENTE:** Restaurar la versión original con React Navigation cuando se confirme que todo funciona

---

### 2. Compilación en Producción

Para compilar una versión de producción (release):

```powershell
cd android
.\gradlew assembleRelease
```

**⚠️ ANTES de compilar para producción:**
1. Cambiar `usesCleartextTraffic` a `false`
2. Configurar keystore propio (no usar debug.keystore)
3. Generar APK firmado

---

### 3. Optimizaciones Pendientes

**Para mejorar rendimiento:**
- [ ] Habilitar ProGuard: `enableProguardInReleaseBuilds = true`
- [ ] Configurar App Bundle (AAB) en lugar de APK
- [ ] Optimizar imágenes y assets
- [ ] Implementar code splitting si la app crece

---

## 🎯 Estado Actual del Proyecto

### ✅ Completado

- [x] Downgrade exitoso a React Native 0.74.6
- [x] Configuración de Android SDK compatible
- [x] Deshabilitación de New Architecture
- [x] Habilitación de Hermes Engine
- [x] Scripts de automatización para desarrollo
- [x] Configuración de port forwarding USB
- [x] Build exitoso del APK
- [x] Instalación exitosa en dispositivo físico
- [x] Conexión exitosa con Metro Bundler
- [x] App ejecutándose correctamente

### 🔄 En Progreso

- [ ] Restaurar App.tsx con React Navigation completa
- [ ] Probar navegación entre pantallas
- [ ] Implementar funcionalidad de detección de plagas

### 📝 Próximos Pasos Sugeridos

1. **Verificar React Navigation:**
   - Restaurar versión original de App.tsx
   - Probar navegación HomeScreen ↔ DetectionScreen

2. **Implementar Funcionalidades:**
   - Integrar cámara para captura de imágenes
   - Implementar algoritmo de detección de plagas
   - Diseñar pantallas adicionales

3. **Optimización:**
   - Configurar build de producción
   - Generar APK firmado
   - Preparar para publicación en Play Store

---

## 📞 Comandos Rápidos de Referencia

### Desarrollo Diario
```powershell
# Iniciar Metro Bundler
.\start-dev.ps1

# Solucionar problemas de conexión
.\fix-connection.ps1

# Reconstruir desde cero
.\complete-rebuild.ps1
```

### Gestión de Metro Bundler
```powershell
# Detener Metro
.\kill-metro.ps1

# Reiniciar con cache limpio
npm start -- --reset-cache
```

### Gestión de ADB
```powershell
# Verificar dispositivos
$env:Path = $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
adb devices

# Port forwarding
adb reverse tcp:8081 tcp:8081

# Ver logs
adb logcat *:E
```

### Build y Deploy
```powershell
# Build debug
cd android && .\gradlew assembleDebug && cd ..

# Instalar APK
.\install-apk.ps1

# Build y deploy en un solo comando
.\complete-rebuild.ps1
```

---

## 📚 Documentación de Referencia

- [React Native 0.74 Docs](https://reactnavigation.org/docs/getting-started)
- [React Navigation Docs](https://reactnavigation.org/)
- [Hermes Engine](https://hermesengine.dev/)
- [Android Debug Bridge (ADB)](https://developer.android.com/tools/adb)

---

## 👨‍💻 Información del Desarrollo

**Fecha de Inicio:** Diciembre 2025
**Última Actualización:** 10 de Diciembre de 2025
**Duración del Troubleshooting:** Múltiples iteraciones
**Problemas Resueltos:** 10 errores críticos
**Scripts Creados:** 6 herramientas de automatización

---

## ✨ Conclusión

El proyecto CamoteApp ha sido exitosamente configurado con React Native 0.74.6 (versión estable) después de resolver múltiples problemas de compatibilidad con versiones más recientes. La aplicación está completamente funcional en el dispositivo físico Redmi Note 11, conectada por USB al entorno de desarrollo, con Metro Bundler sirviendo el código JavaScript en tiempo real.

**Estado final:** ✅ **OPERATIVO Y LISTO PARA DESARROLLO**

---

*Documento generado automáticamente por Claude Code*
*Universidad Señor de Sipán - Proyecto CamoteApp*
