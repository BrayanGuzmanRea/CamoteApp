"""
Script de Diagnóstico para Modelo TensorFlow Lite
Inspecciona yolov11.tflite para ver el formato de entrada/salida esperado
"""

import numpy as np

try:
    import tensorflow as tf
    print("✅ TensorFlow instalado correctamente")
except ImportError:
    print("❌ ERROR: TensorFlow no está instalado")
    print("📦 Instala con: pip install tensorflow")
    exit(1)

# Ruta al modelo (MODIFICA ESTA RUTA SI ES NECESARIO)
MODEL_PATH = r'd:\temp\yolov11.tflite'

print(f"\n{'='*70}")
print(f"🔍 INSPECCIÓN DE MODELO YOLO TFLite")
print(f"{'='*70}\n")
print(f"📂 Ruta del modelo: {MODEL_PATH}\n")

try:
    # Cargar el intérprete de TFLite
    interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    
    # Obtener detalles de entrada
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("━" * 70)
    print("📥 ENTRADA DEL MODELO (Input)")
    print("━" * 70)
    
    for i, input_detail in enumerate(input_details):
        print(f"\nInput #{i+1}:")
        print(f"  🔹 Nombre:       {input_detail['name']}")
        print(f"  🔹 Shape:        {input_detail['shape']}")
        print(f"  🔹 Tipo:         {input_detail['dtype']}")
        print(f"  🔹 Índice:       {input_detail['index']}")
        
        # Análisis del formato
        shape = input_detail['shape']
        if len(shape) == 4:
            batch, dim1, dim2, dim3 = shape
            print(f"\n  📊 ANÁLISIS DE FORMATO:")
            print(f"     Batch size:  {batch}")
            
            # Determinar formato basado en dimensiones
            if dim3 == 3 and dim1 > 3 and dim2 > 3:
                print(f"     Altura:      {dim1}")
                print(f"     Ancho:       {dim2}")
                print(f"     Canales:     {dim3}")
                print(f"     ✅ FORMATO DETECTADO: NHWC (Batch, Height, Width, Channels)")
                print(f"     ✅ Orden de píxeles: [R,G,B, R,G,B, R,G,B, ...]")
                
            elif dim1 == 3 and dim2 > 3 and dim3 > 3:
                print(f"     Canales:     {dim1}")
                print(f"     Altura:      {dim2}")
                print(f"     Ancho:       {dim3}")
                print(f"     ✅ FORMATO DETECTADO: NCHW (Batch, Channels, Height, Width)")
                print(f"     ✅ Orden de píxeles: [R1,R2,...,Rn, G1,G2,...,Gn, B1,B2,...,Bn]")
            else:
                print(f"     ⚠️  Formato no estándar detectado")
        
        # Verificar cuantización
        if 'quantization' in input_detail and input_detail['quantization'][0] != 0.0:
            scale, zero_point = input_detail['quantization']
            print(f"\n  ⚙️  CUANTIZACIÓN:")
            print(f"     Scale:       {scale}")
            print(f"     Zero point:  {zero_point}")
        else:
            print(f"\n  ⚙️  CUANTIZACIÓN: No (modelo usa FLOAT32 sin cuantizar)")
    
    print("\n" + "━" * 70)
    print("📤 SALIDA DEL MODELO (Output)")
    print("━" * 70)
    
    for i, output_detail in enumerate(output_details):
        print(f"\nOutput #{i+1}:")
        print(f"  🔹 Nombre:       {output_detail['name']}")
        print(f"  🔹 Shape:        {output_detail['shape']}")
        print(f"  🔹 Tipo:         {output_detail['dtype']}")
        print(f"  🔹 Índice:       {output_detail['index']}")
        
        # Análisis del output YOLO
        shape = output_detail['shape']
        if len(shape) >= 2:
            print(f"\n  📊 ANÁLISIS DE OUTPUT YOLO:")
            if len(shape) == 3:
                batch, attrs, anchors = shape
                print(f"     Batch:       {batch}")
                print(f"     Atributos:   {attrs} (x, y, w, h, confidence)")
                print(f"     Anchors:     {anchors}")
                print(f"     ✅ Formato YOLOv8/v11 estándar: [batch, attrs, anchors]")
            elif len(shape) == 2:
                attrs, anchors = shape
                print(f"     Atributos:   {attrs}")
                print(f"     Anchors:     {anchors}")
    
    print("\n" + "═" * 70)
    print("📋 RESUMEN Y RECOMENDACIONES")
    print("═" * 70)
    
    input_shape = input_details[0]['shape']
    input_dtype = input_details[0]['dtype']
    
    print(f"\n✅ INPUT ESPERADO POR EL MODELO:")
    print(f"   Shape:  {input_shape}")
    print(f"   Tipo:   {input_dtype}")
    
    if len(input_shape) == 4 and input_shape[3] == 3:
        print(f"\n🎯 CONCLUSIÓN:")
        print(f"   El modelo espera formato NHWC (Height, Width, Channels)")
        print(f"   Orden de píxeles: [R,G,B, R,G,B, R,G,B, ...]")
        print(f"   ")
        print(f"   ✅ NUESTRO CÓDIGO ACTUAL (ImagePixelModule.kt) GENERA:")
        print(f"      Formato: HWC (equivalente a NHWC con batch=1)")
        print(f"      Orden: [R,G,B, R,G,B, ...] ✅ CORRECTO")
        print(f"   ")
        print(f"   ⚠️  PROBLEMA IDENTIFICADO:")
        print(f"      NO es el formato de tensor (ese está correcto)")
        print(f"      El problema es probablemente:")
        print(f"      1. LETTERBOX: Mobile usa stretch, Python usa letterbox+padding")
        print(f"      2. EXIF rotation: Mobile no respeta orientación de foto")
        
    elif len(input_shape) == 4 and input_shape[1] == 3:
        print(f"\n🎯 CONCLUSIÓN:")
        print(f"   El modelo espera formato NCHW (Channels, Height, Width)")
        print(f"   Orden de píxeles: [R1,R2,...,Rn, G1,G2,...,Gn, B1,B2,...,Bn]")
        print(f"   ")
        print(f"   ❌ NUESTRO CÓDIGO ACTUAL GENERA HWC (INCORRECTO)")
        print(f"      Necesitamos convertir HWC → NCHW")
    
    print(f"\n{'='*70}\n")

except FileNotFoundError:
    print(f"❌ ERROR: No se encontró el archivo en la ruta:")
    print(f"   {MODEL_PATH}")
    print(f"\n💡 Solución:")
    print(f"   1. Verifica que copiaste yolov11.tflite a d:\\temp\\")
    print(f"   2. O modifica MODEL_PATH en este script con la ruta correcta")
    
except Exception as e:
    print(f"❌ ERROR INESPERADO:")
    print(f"   {str(e)}")
    import traceback
    traceback.print_exc()

print("\n✅ Inspección completada. Comparte este resultado para continuar con el diagnóstico.")
