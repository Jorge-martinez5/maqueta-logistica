"""Personas de la maqueta de Tisnova.

Uso:  blender -b --python blender/personas.py
Genera Tisnova-personas.blend y public/maqueta/personas.glb.

Cada cuerpo es una malla continua: un esqueleto de vértices con el modificador
Skin y subdivisión. Las partes que se animan en la web van por separado:
- Sentado, TorsoDePie, Pierna: cuerpos (origen en el asiento, la cadera o el pie).
- Cabeza, Gorra, Moño: origen en la base del cuello, para girar la cabeza.
- BrazoSuperior, Antebrazo: crecen hacia +Y desde la articulación (0,45 y 0,47 m);
  la web los orienta y estira entre hombro, codo y mano.

Coordenadas como en three.js (Y arriba, la persona mira hacia -Z); `aBlender`
las pasa a Blender. Los nombres de material (Ropa, Pantalón, Calzado, Piel,
Pelo, Chaleco, Reflectante, Ojos, Gorra) los usa la web para dar color.
"""
import bpy, bmesh, math, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.read_factory_settings(use_empty=True)
escena = bpy.context.scene


def aBlender(x, y, z):
    return (x, -z, y)


def material(nombre, color, rugosidad=0.7):
    m = bpy.data.materials.new(nombre)
    c = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    m.diffuse_color = (*c, 1)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*[v ** 2.2 for v in c], 1)
    p.inputs['Roughness'].default_value = rugosidad
    return m


M = {nombre: material(nombre, color, r) for nombre, color, r in (
    ('Ropa', '#f4efdf', 0.8), ('Pantalón', '#354d57', 0.85), ('Calzado', '#242e2d', 0.5),
    ('Piel', '#d8a478', 0.6), ('Pelo', '#4a3529', 0.75), ('Chaleco', '#cbd86e', 0.6),
    ('Reflectante', '#edeee0', 0.25), ('Ojos', '#1d2422', 0.2), ('Gorra', '#37664c', 0.7),
)}


def esqueleto(nombre, nodos, aristas, nivel=2):
    """nodos: [(x, y, z, radio)] en coordenadas three. Devuelve la malla ya aplicada."""
    malla = bpy.data.meshes.new(nombre)
    malla.from_pydata([aBlender(x, y, z) for x, y, z, _ in nodos], aristas, [])
    o = bpy.data.objects.new(nombre, malla)
    escena.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.modifiers.new('Piel', 'SKIN')
    for i, (*_, radio) in enumerate(nodos):
        r = radio if isinstance(radio, tuple) else (radio, radio)
        o.data.skin_vertices[0].data[i].radius = r
    o.data.skin_vertices[0].data[0].use_root = True
    sub = o.modifiers.new('Suave', 'SUBSURF')
    sub.levels = sub.render_levels = nivel
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    for pol in o.data.polygons:
        pol.use_smooth = True
    return o


def cortar(o, alturas):
    """Corta la malla con planos horizontales (alturas three) para que los bordes de material queden rectos."""
    bm = bmesh.new(); bm.from_mesh(o.data)
    for y in alturas:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, y), plane_no=(0, 0, 1))
    bm.to_mesh(o.data); bm.free()
    for pol in o.data.polygons:
        pol.use_smooth = True


def pintar(o, regla):
    """Asigna a cada cara el material que devuelve regla(x, y, z) con el centro de la cara (coordenadas three)."""
    nombres = []
    for pol in o.data.polygons:
        bx, by, bz = pol.center
        nombre = regla(bx, bz, -by)
        if nombre not in nombres:
            nombres.append(nombre)
            o.data.materials.append(M[nombre])
        pol.material_index = nombres.index(nombre)


def aplanar(o, condicion, factor):
    """Aplana en profundidad (eje three Z) los vértices que cumplen la condición."""
    for v in o.data.vertices:
        x, y, z = v.co.x, v.co.z, -v.co.y
        if condicion(x, y, z):
            v.co.y *= factor


def bola(nombre, tam, pos, mat, segmentos=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segmentos, ring_count=segmentos // 2, location=aBlender(*pos))
    o = bpy.context.object
    o.name = nombre
    o.scale = (tam[0], tam[2], tam[1])
    bpy.ops.object.transform_apply(scale=True)
    for pol in o.data.polygons:
        pol.use_smooth = True
    o.data.materials.append(M[mat])
    return o


def unir(partes, nombre, origen=(0, 0, 0)):
    bpy.ops.object.select_all(action='DESELECT')
    for p in partes:
        p.select_set(True)
    bpy.context.view_layer.objects.active = partes[0]
    if len(partes) > 1:
        bpy.ops.object.join()
    o = bpy.context.object
    o.name = nombre
    escena.cursor.location = aBlender(*origen)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    o.location = (0, 0, 0)
    return o


# ---------- Sentado (origen en el asiento) ----------
nodos = [
    (0, 0.13, 0.02, 0.15),                      # 0 pelvis
    (0, 0.31, 0.03, 0.135),                     # 1 cintura
    (0, 0.49, 0.01, 0.165),                     # 2 pecho
    (0, 0.63, 0.0, 0.07),                       # 3 base del cuello
    (0, 0.71, 0.0, 0.058),                      # 4 cuello
]
aristas = [(0, 1), (1, 2), (2, 3), (3, 4)]
for lado in (-1, 1):
    i = len(nodos)
    nodos += [
        (lado * 0.1, 0.1, -0.02, 0.105),        # cadera
        (lado * 0.11, 0.12, -0.43, 0.08),       # rodilla
        (lado * 0.11, -0.5, -0.47, 0.055),      # tobillo
        (lado * 0.11, -0.55, -0.61, 0.06),      # punta del pie
        (lado * 0.18, 0.57, 0.0, 0.1),          # hombro
    ]
    aristas += [(0, i), (i, i + 1), (i + 1, i + 2), (i + 2, i + 3), (2, i + 4)]
sentado = esqueleto('Sentado', nodos, aristas, 3)
aplanar(sentado, lambda x, y, z: 0.2 < y < 0.62, 0.78)
cortar(sentado, (0.2, 0.69))
pintar(sentado, lambda x, y, z: 'Calzado' if y < -0.45 else 'Pantalón' if y < 0.2 else 'Piel' if y > 0.69 else 'Ropa')
unir([sentado], 'Sentado')

# ---------- De pie: torso (origen en el suelo) y pierna (origen en la cadera) ----------
nodos = [
    (0, 0.96, 0.0, 0.155),
    (0, 1.13, 0.01, 0.135),
    (0, 1.3, 0.0, 0.165),
    (0, 1.44, 0.0, 0.07),
    (0, 1.52, 0.0, 0.058),
]
aristas = [(0, 1), (1, 2), (2, 3), (3, 4)]
for lado in (-1, 1):
    i = len(nodos)
    nodos += [(lado * 0.18, 1.38, 0.0, 0.1), (lado * 0.1, 0.88, 0.0, 0.1)]
    aristas += [(2, i), (0, i + 1)]
torso = esqueleto('TorsoDePie', nodos, aristas, 3)
aplanar(torso, lambda x, y, z: 1.0 < y < 1.43, 0.78)


def ropa_agente(x, y, z):
    if y < 1.02:
        return 'Pantalón'
    if y > 1.5:
        return 'Piel'
    if abs(x) > 0.16 and y > 1.3:
        return 'Ropa'
    if 1.09 < y < 1.13 or 1.24 < y < 1.28:
        return 'Reflectante'
    return 'Chaleco'


cortar(torso, (1.02, 1.09, 1.13, 1.24, 1.28, 1.5))
pintar(torso, ropa_agente)
unir([torso], 'TorsoDePie')

pierna = esqueleto('Pierna', [
    (0, 0.04, 0.0, 0.1), (0, -0.43, 0.01, 0.075), (0, -0.83, 0.02, 0.052), (0, -0.87, -0.13, 0.058),
], [(0, 1), (1, 2), (2, 3)])
cortar(pierna, (-0.78,))
pintar(pierna, lambda x, y, z: 'Calzado' if y < -0.78 else 'Pantalón')
unir([pierna], 'Pierna')

# ---------- Cabeza (origen en la base del cuello) ----------
craneo = bola('Craneo', (0.095, 0.118, 0.105), (0, 0.13, 0), 'Piel', 32)
nariz = bola('Nariz', (0.018, 0.024, 0.02), (0, 0.118, -0.1), 'Piel', 12)
orejas = [bola('Oreja', (0.016, 0.03, 0.02), (lado * 0.093, 0.128, 0.01), 'Piel', 12) for lado in (-1, 1)]
ojos = [bola('Ojo', (0.012, 0.014, 0.008), (lado * 0.035, 0.145, -0.096), 'Ojos', 10) for lado in (-1, 1)]
pelo = bola('Pelo', (0.102, 0.104, 0.11), (0, 0.15, 0.007), 'Pelo', 32)
# El pelo cubre la parte alta y la nuca y deja la cara libre (coordenadas locales: z de Blender = alto, -y = fondo).
bm = bmesh.new(); bm.from_mesh(pelo.data)
fuera = [v for v in bm.verts if (v.co.z < 0.035 and -v.co.y < 0.02) or v.co.z < -0.07]
bmesh.ops.delete(bm, geom=fuera, context='VERTS')
bm.to_mesh(pelo.data); bm.free()
sol = pelo.modifiers.new('Grosor', 'SOLIDIFY'); sol.thickness = 0.008
bpy.context.view_layer.objects.active = pelo
bpy.ops.object.modifier_apply(modifier='Grosor')
unir([craneo, nariz, pelo, *orejas, *ojos], 'Cabeza')

gorra = bola('Gorra', (0.106, 0.07, 0.113), (0, 0.175, 0.004), 'Gorra', 32)
bm = bmesh.new(); bm.from_mesh(gorra.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.005], context='VERTS')
bm.to_mesh(gorra.data); bm.free()
sol = gorra.modifiers.new('Grosor', 'SOLIDIFY'); sol.thickness = 0.008
bpy.context.view_layer.objects.active = gorra
bpy.ops.object.modifier_apply(modifier='Grosor')
visera = bola('Visera', (0.08, 0.008, 0.06), (0, 0.176, -0.098), 'Gorra', 24)
unir([gorra, visera], 'Gorra')
unir([bola('Moño', (0.05, 0.048, 0.045), (0, 0.17, 0.1), 'Pelo', 20)], 'Moño')

# ---------- Brazos (crecen hacia +Y desde la articulación) ----------
superior = esqueleto('BrazoSuperior', [(0, 0.0, 0, 0.085), (0, 0.24, 0, 0.074), (0, 0.45, 0, 0.066)], [(0, 1), (1, 2)])
pintar(superior, lambda x, y, z: 'Ropa')
unir([superior], 'BrazoSuperior')

antebrazo = esqueleto('Antebrazo', [
    (0, 0.0, 0, 0.064), (0, 0.33, 0, 0.047),          # codo → muñeca
    (0, 0.4, 0, (0.05, 0.03)), (0, 0.47, 0, (0.045, 0.026)),  # palma
    (0.04, 0.37, -0.02, 0.022), (0.06, 0.42, -0.035, 0.018),  # pulgar
], [(0, 1), (1, 2), (2, 3), (1, 4), (4, 5)])
cortar(antebrazo, (0.31,))
pintar(antebrazo, lambda x, y, z: 'Piel' if y > 0.31 else 'Ropa')
unir([antebrazo], 'Antebrazo')

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(RAIZ, 'Tisnova-personas.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(RAIZ, 'public/maqueta/personas.glb'), export_format='GLB',
                          export_yup=True, export_apply=True)
print('PERSONAS OK', [o.name for o in bpy.data.objects], sum(len(o.data.polygons) for o in bpy.data.objects), 'caras')
