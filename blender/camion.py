"""Camión de Tisnova para la maqueta.

Uso:  blender -b --python blender/camion.py
Genera Tisnova-camion.blend y public/maqueta/camion.glb.

Medidas y ejes iguales que el camión procedural de src/scripts/maqueta/mundo.ts
(en coordenadas de three.js: X hacia delante, Y arriba, Z a la derecha del morro;
el conductor va en el lado -Z). El script trabaja con esas coordenadas y las
convierte a Blender (Z arriba) en `aBlender`.
"""
import bpy, math, os
from mathutils import Vector

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.read_factory_settings(use_empty=True)
escena = bpy.context.scene

def aBlender(x, y, z):
    return (x, -z, y)

# ---------- Materiales ----------
def mat(nombre, color, rugosidad=0.5, metal=0.0, capa=0.0, emision=None, fuerza=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    c = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    p.inputs['Base Color'].default_value = (*[v ** 2.2 for v in c], 1)
    p.inputs['Roughness'].default_value = rugosidad
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = capa
    p.inputs['Coat Roughness'].default_value = 0.08
    if emision:
        e = tuple(int(emision[i:i + 2], 16) / 255 for i in (1, 3, 5))
        p.inputs['Emission Color'].default_value = (*[v ** 2.2 for v in e], 1)
        p.inputs['Emission Strength'].default_value = fuerza
    return m

M = {
    'lacado': mat('Verde lacado', '#245943', 0.22, 0.15, 1.0),
    'lima': mat('Lima Tisnova', '#aed47d', 0.35, 0.0, 0.6),
    'remolque': mat('Blanco remolque', '#f3f3e8', 0.6),
    'aluminio': mat('Aluminio satinado', '#c4ccc4', 0.32, 1.0),
    'cromo': mat('Cromo', '#e6ebe6', 0.06, 1.0),
    'chasis': mat('Chasis grafito', '#1d2621', 0.55, 0.3),
    'goma': mat('Goma neumático', '#1b201e', 0.86),
    'cristal': mat('Cristal tintado', '#1a2c27', 0.04, 0.4, 1.0),
    'interior': mat('Interior cabina', '#2c3632', 0.8),
    'faro': mat('Faro', '#fff6dc', 0.1, 0.0, 0.0, '#fff1c8', 3.0),
    'piloto': mat('Piloto rojo', '#c03a2a', 0.2, 0.0, 0.0, '#d23a28', 2.0),
    'ambar': mat('Piloto ámbar', '#e8a33a', 0.2, 0.0, 0.0, '#f0a030', 1.6),
    'reflectante': mat('Reflectante', '#e9ead8', 0.3),
}

piezas, ruedas = [], []

def terminar(obj, material, bisel=0.0, segmentos=3, suave=True):
    obj.data.materials.append(M[material])
    if bisel:
        mod = obj.modifiers.new('Bisel', 'BEVEL')
        mod.width = bisel
        mod.segments = segmentos
        mod.limit_method = 'ANGLE'
    if suave:
        for pol in obj.data.polygons:
            pol.use_smooth = True
        mod = obj.modifiers.new('Suavizado', 'WEIGHTED_NORMAL') if bisel else None
        if mod: mod.keep_sharp = True
    return obj

def caja(material, tam, pos, bisel=0.0, nombre='Pieza', giro=(0, 0, 0), lista=None):
    """tam y pos en coordenadas three (x, y arriba, z)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=aBlender(*pos))
    o = bpy.context.object
    o.name = nombre
    o.scale = (tam[0], tam[2], tam[1])
    o.rotation_euler = (giro[0], -giro[2], giro[1])
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    terminar(o, material, bisel)
    (piezas if lista is None else lista).append(o)
    return o

def cilindro(material, radio, largo, pos, eje='z', bisel=0.0, vertices=32, lista=None, nombre='Cilindro'):
    """Cilindro con su eje a lo largo del eje three indicado."""
    bpy.ops.mesh.primitive_cylinder_add(radius=radio, depth=largo, vertices=vertices, location=aBlender(*pos))
    o = bpy.context.object
    o.name = nombre
    # El cilindro de Blender apunta a Z de Blender (= Y three).
    if eje == 'z':   # eje three Z = -Y Blender
        o.rotation_euler = (math.pi / 2, 0, 0)
    elif eje == 'x':
        o.rotation_euler = (0, math.pi / 2, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    terminar(o, material, bisel)
    (piezas if lista is None else lista).append(o)
    return o

def prisma(material, perfil, ancho, nombre='Prisma', bisel=0.0, z=0.0):
    """Extruye a lo ancho (eje three Z) un perfil (x, y) dado en el plano lateral."""
    import bmesh
    malla = bpy.data.meshes.new(nombre)
    o = bpy.data.objects.new(nombre, malla)
    escena.collection.objects.link(o)
    bm = bmesh.new()
    delante = [bm.verts.new(aBlender(x, y, z - ancho / 2)) for x, y in perfil]
    detras = [bm.verts.new(aBlender(x, y, z + ancho / 2)) for x, y in perfil]
    bm.faces.new(delante)
    bm.faces.new(list(reversed(detras)))
    n = len(perfil)
    for i in range(n):
        bm.faces.new([delante[i], delante[(i + 1) % n], detras[(i + 1) % n], detras[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(malla)
    bm.free()
    terminar(o, material, bisel)
    piezas.append(o)
    return o

def arco(material, x, y, z, radio, grosor, ancho, desde=0.0, hasta=math.pi, pasos=24, nombre='Arco', bisel=0.006):
    """Media caña: sector de corona en el plano lateral, extruido a lo ancho (eje three Z)."""
    import bmesh
    malla = bpy.data.meshes.new(nombre)
    o = bpy.data.objects.new(nombre, malla)
    escena.collection.objects.link(o)
    bm = bmesh.new()
    capas = []
    for dz in (-ancho / 2, ancho / 2):
        fuera, dentro = [], []
        for i in range(pasos + 1):
            a = desde + (hasta - desde) * i / pasos
            fuera.append(bm.verts.new(aBlender(x + math.cos(a) * (radio + grosor), y + math.sin(a) * (radio + grosor), z + dz)))
            dentro.append(bm.verts.new(aBlender(x + math.cos(a) * radio, y + math.sin(a) * radio, z + dz)))
        capas.append((fuera, dentro))
    (f0, d0), (f1, d1) = capas
    for i in range(pasos):
        bm.faces.new([f0[i], f0[i + 1], f1[i + 1], f1[i]])
        bm.faces.new([d0[i + 1], d0[i], d1[i], d1[i + 1]])
        bm.faces.new([f0[i + 1], f0[i], d0[i], d0[i + 1]])
        bm.faces.new([f1[i], f1[i + 1], d1[i + 1], d1[i]])
    for extremo in (0, pasos):
        bm.faces.new([f0[extremo], d0[extremo], d1[extremo], f1[extremo]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(malla)
    bm.free()
    terminar(o, material, bisel)
    piezas.append(o)
    return o

# ---------- Semirremolque ----------
LARGO, X0, X1 = 6.13, -4.15, 1.98
XC = (X0 + X1) / 2
caja('remolque', [LARGO - 0.04, 2.2, 2.25], [XC, 2.02, 0], 0.035, 'Caja remolque')
# Perfiles de aluminio: solo en los cantos del techo y en el bajo; el techo queda blanco.
for z in (-1.14, 1.14):
    caja('aluminio', [LARGO + 0.02, 0.08, 0.06], [XC, 3.14, z], 0.015, 'Perfil techo')
for x in (X0 + 0.02, X1 - 0.02):
    caja('aluminio', [0.06, 0.08, 2.31], [x, 3.14, 0], 0.015, 'Perfil techo')
caja('aluminio', [LARGO + 0.02, 0.15, 2.31], [XC, 0.96, 0], 0.02, 'Perfil bajo')
for x in (X0 + 0.02, X1 - 0.02):
    for z in (-1.14, 1.14):
        caja('aluminio', [0.09, 2.2, 0.09], [x, 2.03, z], 0.015, 'Esquina')
# Nervios laterales del panel.
x = X0 + 0.38
while x < X1 - 0.2:
    for z in (-1.135, 1.135):
        caja('remolque', [0.05, 2.0, 0.025], [x, 2.03, z], 0.01, 'Nervio')
    x += 0.42
# Franjas de marca en los bajos del panel: lima fina y verde.
for z in (-1.15, 1.15):
    caja('lacado', [LARGO - 0.3, 0.09, 0.02], [XC, 1.17, z], 0.008, 'Franja verde')
    caja('lima', [LARGO - 0.3, 0.035, 0.02], [XC, 1.27, z], 0.006, 'Franja lima')
    # Cinta reflectante discontinua.
    for i in range(12):
        caja('reflectante' if i % 2 else 'piloto', [0.24, 0.05, 0.01], [X0 + 0.4 + i * 0.25, 1.05, z * 1.004], 0, 'Cinta')
# Puertas traseras.
for z in (-0.56, 0.56):
    caja('remolque', [0.04, 2.06, 1.08], [X0 - 0.01, 2.03, z], 0.01, 'Puerta')
for z in (-0.82, -0.3, 0.3, 0.82):
    cilindro('cromo', 0.022, 2.05, [X0 - 0.06, 2.03, z], 'y', 0, 12, nombre='Barra cierre')
    caja('cromo', [0.05, 0.05, 0.16], [X0 - 0.07, 1.55, z + 0.06], 0.01, 'Manilla')
    for y in (1.2, 2.8):
        caja('aluminio', [0.06, 0.07, 0.08], [X0 - 0.05, y, z], 0.01, 'Soporte')
for z in (-1.08, 1.08):
    for y in (1.25, 2.0, 2.75):
        caja('aluminio', [0.05, 0.1, 0.12], [X0 - 0.04, y, z], 0.01, 'Bisagra')
# Pilotos y parachoques antiempotramiento.
for lado in (-1, 1):
    caja('piloto', [0.05, 0.13, 0.3], [X0 - 0.02, 0.97, lado * 0.8], 0.02, 'Piloto')
    caja('ambar', [0.05, 0.13, 0.12], [X0 - 0.02, 0.97, lado * 0.55], 0.02, 'Intermitente')
    caja('ambar', [0.05, 0.06, 0.06], [X0 - 0.02, 3.1, lado * 1.05], 0.01, 'Galibo')
caja('chasis', [0.12, 0.14, 2.0], [X0 + 0.06, 0.6, 0], 0.02, 'Antiempotramiento')
for z in (-0.8, 0.8):
    caja('chasis', [0.08, 0.3, 0.08], [X0 + 0.1, 0.74, z], 0.01, 'Soporte parachoques')
# Faldones laterales aerodinámicos entre ejes.
for lado in (-1, 1):
    caja('remolque', [3.0, 0.42, 0.03], [-0.55, 0.68, lado * 1.08], 0.012, 'Faldón')
    caja('lima', [3.0, 0.03, 0.035], [-0.55, 0.88, lado * 1.085], 0, 'Remate faldón')
# Patas de apoyo.
for z in (-0.75, 0.75):
    caja('chasis', [0.1, 0.55, 0.1], [1.25, 0.6, z], 0.015, 'Pata')
    caja('chasis', [0.24, 0.04, 0.24], [1.25, 0.33, z], 0.01, 'Pie')
caja('chasis', [0.04, 0.04, 1.5], [1.25, 0.55, 0], 0, 'Traviesa')

# ---------- Chasis ----------
for z in (-0.45, 0.45):
    caja('chasis', [8.3, 0.22, 0.14], [0.0, 0.66, z], 0.02, 'Larguero')
caja('chasis', [1.2, 0.07, 1.6], [1.6, 0.85, 0], 0.02, 'Quinta rueda')
caja('chasis', [0.06, 0.08, 1.95], [2.1, 1.0, 0], 0.01, 'Pasarela')

# ---------- Cabina ----------
CX = 3.11
# Cuerpo bajo (puertas hasta la línea de cintura).
caja('lacado', [2.06, 1.12, 2.13], [CX, 1.18, 0], 0.09, 'Cabina baja')
# Techo, trasera y pilares: dejan los huecos de ventanilla.
caja('lacado', [2.06, 0.26, 2.13], [CX, 2.85, 0], 0.09, 'Techo')
caja('lacado', [0.16, 1.1, 2.12], [2.16, 2.22, 0], 0.04, 'Trasera')
for z in (-0.99, 0.99):
    caja('lacado', [0.17, 1.1, 0.14], [4.04, 2.22, z], 0.04, 'Pilar A')
    caja('lacado', [0.12, 1.1, 0.14], [2.3, 2.22, z], 0.03, 'Pilar B')
# Parabrisas inclinado y su marco.
caja('cristal', [0.03, 0.8, 1.86], [4.04, 2.22, 0], 0.006, 'Parabrisas')
caja('chasis', [0.06, 0.05, 1.9], [4.08, 2.66, 0], 0.01, 'Junta parabrisas')
caja('lacado', [0.18, 0.1, 2.0], [4.08, 2.76, 0], 0.03, 'Visera')
for z in (-0.45, 0.45):
    caja('chasis', [0.02, 0.025, 0.6], [4.15, 1.93, z], 0, 'Limpiaparabrisas', giro=(0.18, 0, 0))
# Ventanillas: la del acompañante fija; la del conductor aparte para poder abrirla.
caja('cristal', [1.62, 0.78, 0.025], [3.17, 2.22, 1.0], 0.006, 'Cristal acompañante')
caja('cristal', [1.62, 0.78, 0.025], [3.17, 2.22, -1.0], 0.006, 'Cristal conductor', lista=[])
cristal_conductor = bpy.data.objects['Cristal conductor']
# Deflector de techo con perfil aerodinámico.
prisma('lacado', [(2.12, 2.96), (3.3, 2.96), (2.85, 3.38), (2.12, 3.42)], 2.0, 'Deflector', 0.06)
caja('lima', [0.03, 0.06, 1.7], [3.05, 3.12, 0], 0, 'Luz techo', giro=(0, 0, -0.75))
for z in (-0.6, -0.2, 0.2, 0.6):
    caja('ambar', [0.06, 0.04, 0.1], [3.33, 2.98, z], 0.01, 'Gálibo cabina')
# Frontal: calandra cromada, faros, parachoques.
caja('chasis', [0.06, 0.66, 1.36], [4.15, 1.24, 0], 0.02, 'Calandra')
for y in (0.98, 1.1, 1.22, 1.34, 1.46):
    caja('cromo', [0.05, 0.035, 1.3], [4.18, y, 0], 0.01, 'Lama')
caja('cromo', [0.05, 0.7, 0.05], [4.17, 1.24, -0.68], 0.01, 'Marco calandra')
caja('cromo', [0.05, 0.7, 0.05], [4.17, 1.24, 0.68], 0.01, 'Marco calandra')
caja('lima', [0.03, 0.12, 0.42], [4.2, 1.62, 0], 0.01, 'Placa Tisnova')
caja('chasis', [0.34, 0.36, 2.2], [4.06, 0.68, 0], 0.08, 'Parachoques')
caja('aluminio', [0.04, 0.05, 2.0], [4.24, 0.8, 0], 0.01, 'Moldura parachoques')
for lado in (-1, 1):
    caja('cromo', [0.06, 0.2, 0.42], [4.15, 0.98, lado * 0.82], 0.03, 'Carcasa faro')
    caja('faro', [0.04, 0.14, 0.34], [4.18, 0.98, lado * 0.82], 0.02, 'Faro')
    caja('faro', [0.04, 0.05, 0.12], [4.24, 0.66, lado * 0.85], 0.015, 'Antiniebla')
    caja('ambar', [0.04, 0.08, 0.1], [4.18, 0.98, lado * 1.06], 0.015, 'Intermitente')
    # Retrovisores.
    caja('chasis', [0.04, 0.04, 0.26], [3.95, 2.45, lado * 1.17], 0.01, 'Brazo retrovisor')
    caja('chasis', [0.14, 0.44, 0.14], [3.95, 2.2, lado * 1.32], 0.04, 'Retrovisor')
    caja('cristal', [0.02, 0.38, 0.1], [3.87, 2.2, lado * 1.32], 0, 'Espejo')
    # Estribos, tiradores y franja de marca en la puerta.
    for y in (0.48, 0.78):
        caja('aluminio', [0.48, 0.04, 0.2], [3.2, y, lado * 1.02], 0.01, 'Estribo')
    caja('cromo', [0.22, 0.04, 0.03], [2.6, 1.55, lado * 1.075], 0.01, 'Tirador')
    caja('lima', [1.9, 0.05, 0.015], [CX, 1.68, lado * 1.07], 0.004, 'Franja cabina')
    caja('chasis', [0.025, 0.95, 0.015], [2.48, 1.2, lado * 1.068], 0, 'Junta puerta')
    # Depósitos con flejes.
    cilindro('aluminio', 0.19, 0.75, [2.55, 0.72, lado * 0.9], 'x', 0.02, 28, nombre='Depósito')
    for x in (2.3, 2.8):
        cilindro('chasis', 0.2, 0.04, [x, 0.72, lado * 0.9], 'x', 0, 28, nombre='Fleje')
# Interior visible por la ventanilla abierta.
caja('interior', [1.7, 0.05, 1.95], [CX, 1.72, 0], 0, 'Suelo cabina')
caja('interior', [0.32, 0.36, 1.95], [3.82, 1.9, 0], 0.03, 'Salpicadero')
caja('interior', [0.45, 0.12, 0.5], [2.7, 1.86, 0.55], 0.04, 'Asiento')
caja('interior', [0.12, 0.6, 0.5], [2.48, 2.15, 0.55], 0.04, 'Respaldo')
caja('interior', [0.06, 0.4, 2.0], [2.26, 2.2, 0], 0, 'Litera')

# ---------- Ruedas y guardabarros ----------
def rueda(x, lado, indice):
    partes = []
    z = lado * 0.97
    cilindro('goma', 0.45, 0.32, [x, 0.45, z], 'z', 0.07, 32, partes, 'Neumático')
    # Dibujo de la banda de rodadura.
    for i in range(20):
        a = i / 20 * math.tau
        caja('goma', [0.06, 0.018, 0.24], [x + math.sin(a) * 0.448, 0.45 + math.cos(a) * 0.448, z], 0, 'Taco',
             giro=(0, 0, -a), lista=partes)
    cara = z + lado * 0.165
    cilindro('cromo', 0.29, 0.04, [x, 0.45, cara], 'z', 0.012, 36, partes, 'Llanta')
    cilindro('aluminio', 0.18, 0.05, [x, 0.45, cara + lado * 0.01], 'z', 0.01, 28, partes, 'Disco')
    cilindro('cromo', 0.07, 0.07, [x, 0.45, cara + lado * 0.03], 'z', 0.01, 20, partes, 'Buje')
    for i in range(10):
        a = i / 10 * math.tau
        cilindro('chasis', 0.022, 0.05, [x + math.sin(a) * 0.13, 0.45 + math.cos(a) * 0.13, cara + lado * 0.03],
                 'z', 0, 6, partes, 'Tuerca')
    for o in partes:
        o.select_set(False)
    bpy.ops.object.select_all(action='DESELECT')
    for o in partes:
        for m in list(o.modifiers):
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=m.name)
        o.select_set(True)
    bpy.context.view_layer.objects.active = partes[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = f'Rueda.{indice}'
    escena.cursor.location = aBlender(x, 0.45, z)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    ruedas.append(o)

indice = 0
for x in (-3.3, -2.44, 1.68, 3.51):
    for lado in (-1, 1):
        rueda(x, lado, indice)
        indice += 1
    for lado in (-1, 1):
        if x > 0:
            # Guardabarros de la tractora: media caña lacada sobre la rueda.
            arco('lacado', x, 0.47, lado * 0.97, 0.53, 0.035, 0.4, 0.12, math.pi - 0.12, nombre='Guardabarros')
        else:
            # Remolque: faldilla de goma detrás de cada tándem.
            if x < -3:
                caja('goma', [0.03, 0.5, 0.36], [x - 0.58, 0.48, lado * 0.97], 0.01, 'Faldilla')
                caja('chasis', [0.04, 0.04, 0.42], [x - 0.58, 0.75, lado * 0.97], 0, 'Soporte faldilla')

# ---------- Unir y exportar ----------
def aplicar_y_unir(objetos, nombre):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objetos:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)
        o.select_set(True)
    bpy.context.view_layer.objects.active = objetos[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = nombre
    escena.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    return o

carroceria = aplicar_y_unir(piezas, 'Carrocería')
aplicar_y_unir([cristal_conductor], 'Cristal conductor')
for o in bpy.data.objects:
    if o.type == 'MESH':
        for pol in o.data.polygons:
            pol.use_smooth = True

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(RAIZ, 'Tisnova-camion.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(RAIZ, 'public/maqueta/camion.glb'), export_format='GLB',
                          export_yup=True, export_apply=True)
print('CAMION OK', len(piezas), 'piezas', sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'), 'caras')
