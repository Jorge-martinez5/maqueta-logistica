"""Comprime los GLB de la web sin modificar los archivos de trabajo .blend.

Uso: blender -b --python blender/comprimir.py
Ejecutar después de exportar los modelos. Omite archivos ya comprimidos.
"""
import bpy
import json
import pathlib
import struct

RAIZ = pathlib.Path(__file__).resolve().parent.parent
for relativo in ('maqueta/personas.glb', 'maqueta/camion.glb', 'visual/tisnova-letras.glb'):
    archivo = RAIZ / 'public' / relativo
    datos = archivo.read_bytes()
    longitud = struct.unpack_from('<I', datos, 12)[0]
    documento = json.loads(datos[20:20 + longitud])
    if 'KHR_draco_mesh_compression' in documento.get('extensionsUsed', []):
        print(f'{relativo}: ya comprimido')
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(archivo))
    temporal = archivo.with_suffix('.tmp.glb')
    bpy.ops.export_scene.gltf(
        filepath=str(temporal), export_format='GLB', export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=16,
        export_draco_normal_quantization=12,
        export_draco_texcoord_quantization=14,
    )
    temporal.replace(archivo)
    print(f'{relativo}: {len(datos)} → {archivo.stat().st_size} bytes')
