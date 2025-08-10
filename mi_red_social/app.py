# app.py - Servidor Flask Profesional sin Emojis
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'empresa_red_relaciones_2024'

# Configuración de la base de datos
DATABASE = 'red_social.db'

def init_db():
    """Inicializar la base de datos con las tablas necesarias"""
    print("🔧 Inicializando base de datos empresarial...")
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Eliminar tablas si existen (para debug)
    cursor.execute('DROP TABLE IF EXISTS relaciones')
    cursor.execute('DROP TABLE IF EXISTS personas')
    
    # Tabla de personas
    cursor.execute('''
        CREATE TABLE personas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            icono TEXT DEFAULT 'user',
            grupo TEXT DEFAULT 'contactos',
            color TEXT DEFAULT '#3b82f6',
            descripcion TEXT,
            posicion_x REAL,
            posicion_y REAL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de relaciones
    cursor.execute('''
        CREATE TABLE relaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            persona1_id INTEGER,
            persona2_id INTEGER,
            tipo TEXT DEFAULT 'profesional',
            fortaleza INTEGER DEFAULT 5,
            contexto TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (persona1_id) REFERENCES personas (id),
            FOREIGN KEY (persona2_id) REFERENCES personas (id),
            UNIQUE(persona1_id, persona2_id)
        )
    ''')
    
    # Insertar datos iniciales SIEMPRE
    personas_iniciales = [
        ('Usuario Principal', 'target', 'centro', '#1e3a8a', 'Centro de la red organizacional'),
        ('Ana García', 'family', 'equipo_directo', '#10b981', 'Gerente de Proyectos - Equipo directo'),
        ('Carlos Mendez', 'briefcase', 'departamento', '#3b82f6', 'Desarrollador Senior - Mismo departamento'),
        ('María López', 'academic', 'colaboradores', '#f59e0b', 'Analista de Datos - Colaboradora frecuente'),
        ('David Rodríguez', 'briefcase', 'otros_departamentos', '#ef4444', 'Especialista en Marketing - Otros departamentos'),
        ('Laura Fernández', 'home', 'externos', '#8b5cf6', 'Consultora Externa - Proveedora de servicios')
    ]
    
    cursor.executemany(
        'INSERT INTO personas (nombre, icono, grupo, color, descripcion) VALUES (?, ?, ?, ?, ?)',
        personas_iniciales
    )
    
    # Relaciones iniciales
    relaciones_iniciales = [
        (1, 2, 'supervision_directa', 9, 'Relación supervisor-colaborador directo'),
        (1, 3, 'colaboracion_estrecha', 7, 'Trabajo conjunto en proyectos principales'),
        (1, 4, 'colaboracion_regular', 8, 'Intercambio frecuente de información'),
        (1, 5, 'colaboracion_interdepartamental', 6, 'Coordinación entre departamentos'),
        (1, 6, 'relacion_externa', 8, 'Proveedor de servicios estratégico'),
        (2, 4, 'colaboracion_proyecto', 7, 'Trabajo conjunto en análisis de datos'),
        (3, 5, 'coordinacion_ocasional', 4, 'Coordinación esporádica en campañas')
    ]
    
    cursor.executemany(
        'INSERT INTO relaciones (persona1_id, persona2_id, tipo, fortaleza, contexto) VALUES (?, ?, ?, ?, ?)',
        relaciones_iniciales
    )
    
    conn.commit()
    conn.close()
    
    print("✅ Base de datos inicializada con datos profesionales")

def get_db_connection():
    """Obtener conexión a la base de datos"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Página principal con el grafo interactivo"""
    return render_template('index.html')

@app.route('/admin')
def admin():
    """Panel de administración"""
    conn = get_db_connection()
    personas = conn.execute('SELECT * FROM personas ORDER BY nombre').fetchall()
    relaciones = conn.execute('''
        SELECT r.*, p1.nombre as persona1_nombre, p2.nombre as persona2_nombre
        FROM relaciones r
        JOIN personas p1 ON r.persona1_id = p1.id
        JOIN personas p2 ON r.persona2_id = p2.id
        ORDER BY r.fecha_creacion DESC
    ''').fetchall()
    conn.close()
    
    return render_template('admin.html', personas=personas, relaciones=relaciones)

# Reemplazar la función api_grafo existente en app.py con esta versión corregida

@app.route('/api/grafo')
def api_grafo():
    """API que devuelve los datos del grafo en formato JSON - CON POSICIONES"""
    try:
        conn = get_db_connection()
        
        # Obtener personas CON GRUPOS Y POSICIONES
        personas = conn.execute('SELECT * FROM personas').fetchall()
        
        # Obtener relaciones
        relaciones = conn.execute('''
            SELECT r.*, p1.nombre as persona1_nombre, p2.nombre as persona2_nombre
            FROM relaciones r
            JOIN personas p1 ON r.persona1_id = p1.id
            JOIN personas p2 ON r.persona2_id = p2.id
        ''').fetchall()
        
        conn.close()
        
        # Formatear datos para vis.js - INCLUYENDO GRUPOS Y POSICIONES
        nodes = []
        for persona in personas:
            size = 50 if 'Usuario Principal' in persona['nombre'] else 30
            label = persona['nombre']
            
            node_data = {
                'id': persona['id'],
                'label': label,
                'color': persona['color'],
                'size': size,
                'grupo': persona['grupo']
            }
            
            # ✅ AGREGAR POSICIONES SI EXISTEN
            if persona['posicion_x'] is not None and persona['posicion_y'] is not None:
                node_data['x'] = float(persona['posicion_x'])
                node_data['y'] = float(persona['posicion_y'])
                node_data['physics'] = True
            else:
                node_data['physics'] = True
            
            nodes.append(node_data)
        
        edges = []
        for relacion in relaciones:
            color = '#10b981' if relacion['fortaleza'] >= 8 else '#f59e0b' if relacion['fortaleza'] >= 6 else '#6b7280'
            edges.append({
                'from': relacion['persona1_id'],
                'to': relacion['persona2_id'],
                'width': relacion['fortaleza'],
                'color': color,
                'label': relacion['tipo'].replace('_', ' ').title(),
                'title': f"<b>{relacion['persona1_nombre']} ↔ {relacion['persona2_nombre']}</b><br>Tipo: {relacion['tipo'].replace('_', ' ').title()}<br>Fortaleza: {relacion['fortaleza']}/10<br>Contexto: {relacion['contexto'] or 'Sin contexto'}"
            })
        
        resultado = {'nodes': nodes, 'edges': edges}
        
        print(f"🔍 API devolviendo: {len(nodes)} nodos, {len(edges)} conexiones")
        
        return jsonify(resultado)
        
    except Exception as e:
        print(f"❌ Error en API: {e}")
        return jsonify({'error': str(e), 'nodes': [], 'edges': []}), 500
    
@app.route('/agregar_persona', methods=['POST'])
def agregar_persona():
    """Formulario para agregar nueva persona"""
    nombre = request.form['nombre']
    icono = request.form.get('icono', 'user')
    grupo = request.form.get('grupo', 'contactos')
    color = request.form.get('color', '#3b82f6')
    descripcion = request.form.get('descripcion', '')
    
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO personas (nombre, icono, grupo, color, descripcion)
            VALUES (?, ?, ?, ?, ?)
        ''', (nombre, icono, grupo, color, descripcion))
        conn.commit()
        flash(f'✅ Contacto "{nombre}" agregado exitosamente!')
    except sqlite3.IntegrityError:
        flash(f'❌ Ya existe un contacto llamado "{nombre}"')
    finally:
        conn.close()
    
    return redirect(url_for('admin'))

@app.route('/agregar_relacion', methods=['POST'])
def agregar_relacion():
    """Formulario para agregar nueva relación"""
    persona1_id = request.form['persona1_id']
    persona2_id = request.form['persona2_id']
    tipo = request.form.get('tipo', 'profesional')
    fortaleza = int(request.form.get('fortaleza', 5))
    contexto = request.form.get('contexto', '')
    
    if persona1_id == persona2_id:
        flash('❌ No puedes crear una relación de un contacto consigo mismo')
        return redirect(url_for('admin'))
    
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO relaciones (persona1_id, persona2_id, tipo, fortaleza, contexto)
            VALUES (?, ?, ?, ?, ?)
        ''', (persona1_id, persona2_id, tipo, fortaleza, contexto))
        conn.commit()
        flash('✅ Relación agregada exitosamente!')
    except sqlite3.IntegrityError:
        flash('❌ Ya existe una relación entre estos contactos')
    finally:
        conn.close()
    
    return redirect(url_for('admin'))

@app.route('/eliminar_persona/<int:persona_id>')
def eliminar_persona(persona_id):
    """Eliminar una persona y sus relaciones"""
    conn = get_db_connection()
    
    # Obtener nombre para el mensaje
    persona = conn.execute('SELECT nombre FROM personas WHERE id = ?', (persona_id,)).fetchone()
    
    if persona:
        # Eliminar relaciones asociadas
        conn.execute('DELETE FROM relaciones WHERE persona1_id = ? OR persona2_id = ?', (persona_id, persona_id))
        # Eliminar persona
        conn.execute('DELETE FROM personas WHERE id = ?', (persona_id,))
        conn.commit()
        flash(f'✅ Contacto "{persona["nombre"]}" eliminado exitosamente!')
    else:
        flash('❌ Contacto no encontrado')
    
    conn.close()
    return redirect(url_for('admin'))

# Agregar este endpoint al archivo app.py después de los otros endpoints

@app.route('/actualizar_grupos', methods=['POST'])
def actualizar_grupos():
    """Endpoint para actualizar los grupos de múltiples personas"""
    try:
        # Obtener datos JSON del request
        data = request.get_json()
        
        if not data or 'updates' not in data:
            return jsonify({'error': 'Datos de actualización no válidos'}), 400
        
        updates = data['updates']
        
        if not isinstance(updates, list):
            return jsonify({'error': 'Updates debe ser una lista'}), 400
        
        conn = get_db_connection()
        
        # Procesar cada actualización
        actualizados = 0
        for update in updates:
            if 'id' not in update:
                continue
                
            persona_id = update['id']
            grupo = update.get('grupo', None)
            
            # Actualizar la persona en la base de datos
            conn.execute('''
                UPDATE personas 
                SET grupo = ? 
                WHERE id = ?
            ''', (grupo, persona_id))
            
            actualizados += 1
        
        conn.commit()
        conn.close()
        
        print(f"✅ Actualizados {actualizados} grupos en la base de datos")
        
        return jsonify({
            'success': True,
            'message': f'{actualizados} grupos actualizados exitosamente',
            'actualizados': actualizados
        })
        
    except Exception as e:
        print(f"❌ Error actualizando grupos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/obtener_grupos_personas', methods=['GET'])
def obtener_grupos_personas():
    """Endpoint para obtener los grupos actuales de todas las personas"""
    try:
        conn = get_db_connection()
        
        personas = conn.execute('''
            SELECT id, nombre, grupo 
            FROM personas 
            ORDER BY nombre
        ''').fetchall()
        
        conn.close()
        
        # Convertir a diccionario para facilitar el uso
        grupos_actuales = {}
        for persona in personas:
            grupos_actuales[persona['id']] = {
                'nombre': persona['nombre'],
                'grupo': persona['grupo']
            }
        
        return jsonify({
            'success': True,
            'grupos': grupos_actuales
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo grupos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/eliminar_relacion/<int:relacion_id>')
def eliminar_relacion(relacion_id):
    """Eliminar una relación"""
    conn = get_db_connection()
    conn.execute('DELETE FROM relaciones WHERE id = ?', (relacion_id,))
    conn.commit()
    conn.close()
    
    flash('✅ Relación eliminada exitosamente!')
    return redirect(url_for('admin'))

@app.route('/debug')
def debug():
    """Endpoint de debug para verificar datos"""
    conn = get_db_connection()
    
    personas = conn.execute('SELECT * FROM personas').fetchall()
    relaciones = conn.execute('SELECT * FROM relaciones').fetchall()
    
    conn.close()
    
    debug_info = {
        'personas_count': len(personas),
        'relaciones_count': len(relaciones),
        'personas': [dict(p) for p in personas],
        'relaciones': [dict(r) for r in relaciones]
    }
    
    return jsonify(debug_info)

# Agregar al final de app.py

@app.route('/guardar_posiciones', methods=['POST'])
def guardar_posiciones():
    data = request.get_json()
    posiciones = data.get('posiciones', {})
    
    conn = get_db_connection()
    for node_id, pos in posiciones.items():
        conn.execute('UPDATE personas SET posicion_x = ?, posicion_y = ? WHERE id = ?', 
                    (pos['x'], pos['y'], node_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'guardadas': len(posiciones)})

@app.route('/obtener_posiciones', methods=['GET', 'POST'])
def posiciones():
    conn = get_db_connection()
    try:
        if request.method == 'GET':
            # ?ids=1,2,3  (opcional). Si no se pasa, devuelve todas las que tengan posición
            ids_param = request.args.get('ids', '').strip()
            if ids_param:
                try:
                    ids = [int(x) for x in ids_param.split(',') if x.strip().isdigit()]
                except ValueError:
                    return jsonify({'error': 'ids inválidos'}), 400

                if not ids:
                    return jsonify({'posiciones': {}})

                qmarks = ','.join('?' for _ in ids)
                filas = conn.execute(
                    f'SELECT id, posicion_x, posicion_y FROM personas WHERE id IN ({qmarks})',
                    ids
                ).fetchall()
            else:
                filas = conn.execute(
                    'SELECT id, posicion_x, posicion_y FROM personas WHERE posicion_x IS NOT NULL'
                ).fetchall()

            posiciones = {
                f['id']: {'x': f['posicion_x'], 'y': f['posicion_y']}
                for f in filas if f['posicion_x'] is not None and f['posicion_y'] is not None
            }
            return jsonify({'posiciones': posiciones})

        # POST: guarda posiciones parciales o totales
        data = request.get_json(silent=True) or {}
        pos = data.get('posiciones', {})
        if not isinstance(pos, dict) or not pos:
            return jsonify({'error': 'JSON inválido o vacío'}), 400

        payload = []
        for node_id, xy in pos.items():
            try:
                nid = int(node_id)
                x = float(xy['x'])
                y = float(xy['y'])
                payload.append((x, y, nid))
            except (ValueError, KeyError, TypeError):
                continue

        if payload:
            conn.executemany(
                'UPDATE personas SET posicion_x = ?, posicion_y = ? WHERE id = ?',
                payload
            )
            conn.commit()

        return jsonify({'success': True, 'guardadas': len(payload)})
    finally:
        conn.close()


# Modificaciones necesarias para app.py - Sistema de Imágenes
# AGREGAR estas modificaciones al archivo app.py existente

import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
from flask import request, jsonify

# === CONFIGURACIÓN DE IMÁGENES ===
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
IMAGE_SIZE = (150, 150)  # Tamaño estándar para nodos
IMAGES_FOLDER = 'static/images/users'

def allowed_file(filename):
    """Verificar si el archivo tiene una extensión permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_images_directory():
    """Crear directorio de imágenes si no existe"""
    images_path = os.path.join(app.root_path, IMAGES_FOLDER)
    os.makedirs(images_path, exist_ok=True)
    return images_path

def resize_and_crop_image(image, size=IMAGE_SIZE):
    """Redimensionar y recortar imagen para hacerla circular"""
    # Convertir a RGB si es necesario
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    # Redimensionar manteniendo aspecto
    image.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Crear imagen cuadrada con relleno si es necesario
    if image.size != size:
        background = Image.new('RGB', size, (255, 255, 255))
        offset = ((size[0] - image.size[0]) // 2, (size[1] - image.size[1]) // 2)
        background.paste(image, offset)
        image = background
    
    return image

def save_image_file(file, persona_id):
    """Guardar archivo de imagen procesado"""
    if not file or not allowed_file(file.filename):
        return None, "Tipo de archivo no permitido"
    
    try:
        # Verificar tamaño del archivo
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return None, f"Archivo demasiado grande. Máximo {MAX_FILE_SIZE // (1024*1024)}MB"
        
        # Crear directorio si no existe
        images_path = create_images_directory()
        
        # Generar nombre único para el archivo
        file_extension = secure_filename(file.filename).rsplit('.', 1)[1].lower()
        filename = f"user_{persona_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        filepath = os.path.join(images_path, filename)
        
        # Procesar imagen
        image = Image.open(file.stream)
        processed_image = resize_and_crop_image(image)
        
        # Guardar imagen procesada
        processed_image.save(filepath, quality=85, optimize=True)
        
        # Retornar ruta relativa para la base de datos
        relative_path = f"{IMAGES_FOLDER}/{filename}"
        return relative_path, None
        
    except Exception as e:
        return None, f"Error procesando imagen: {str(e)}"

def delete_image_file(image_path):
    """Eliminar archivo de imagen"""
    if not image_path:
        return True
    
    try:
        full_path = os.path.join(app.root_path, image_path)
        if os.path.exists(full_path):
            os.remove(full_path)
        return True
    except Exception as e:
        print(f"Error eliminando imagen: {e}")
        return False

# === MODIFICAR LA FUNCIÓN init_db() EXISTENTE ===
# Agregar esto al final de la función init_db() existente:

def agregar_soporte_imagenes_db():
    """Agregar soporte para imágenes a la base de datos existente"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Verificar si la columna imagen_url existe
    cursor.execute("PRAGMA table_info(personas)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'imagen_url' not in columns:
        print("➕ Agregando columna imagen_url a la tabla personas...")
        cursor.execute('ALTER TABLE personas ADD COLUMN imagen_url TEXT')
        conn.commit()
        print("✅ Columna imagen_url agregada exitosamente")
    else:
        print("✅ La columna imagen_url ya existe")
    
    conn.close()
    
    # Crear directorio de imágenes
    create_images_directory()
    print("✅ Directorio de imágenes configurado")

# === NUEVAS RUTAS PARA MANEJO DE IMÁGENES ===

@app.route('/subir_imagen/<int:persona_id>', methods=['POST'])
def subir_imagen(persona_id):
    """Subir imagen para una persona"""
    try:
        # Verificar que la persona existe
        conn = get_db_connection()
        persona = conn.execute('SELECT * FROM personas WHERE id = ?', (persona_id,)).fetchone()
        
        if not persona:
            conn.close()
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        # Verificar que se envió un archivo
        if 'imagen' not in request.files:
            conn.close()
            return jsonify({'error': 'No se envió ningún archivo'}), 400
        
        file = request.files['imagen']
        if file.filename == '':
            conn.close()
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        # Eliminar imagen anterior si existe
        if persona['imagen_url']:
            delete_image_file(persona['imagen_url'])
        
        # Guardar nueva imagen
        image_path, error = save_image_file(file, persona_id)
        
        if error:
            conn.close()
            return jsonify({'error': error}), 400
        
        # Actualizar base de datos
        conn.execute(
            'UPDATE personas SET imagen_url = ? WHERE id = ?',
            (image_path, persona_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Imagen subida exitosamente',
            'imagen_url': image_path,
            'persona_id': persona_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@app.route('/eliminar_imagen/<int:persona_id>', methods=['DELETE'])
def eliminar_imagen(persona_id):
    """Eliminar imagen de una persona"""
    try:
        conn = get_db_connection()
        persona = conn.execute('SELECT * FROM personas WHERE id = ?', (persona_id,)).fetchone()
        
        if not persona:
            conn.close()
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        # Eliminar archivo de imagen
        if persona['imagen_url']:
            delete_image_file(persona['imagen_url'])
        
        # Actualizar base de datos
        conn.execute(
            'UPDATE personas SET imagen_url = NULL WHERE id = ?',
            (persona_id,)
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Imagen eliminada exitosamente',
            'persona_id': persona_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@app.route('/obtener_imagenes', methods=['GET'])
def obtener_imagenes():
    """Obtener todas las URLs de imágenes"""
    try:
        conn = get_db_connection()
        personas = conn.execute(
            'SELECT id, nombre, imagen_url FROM personas WHERE imagen_url IS NOT NULL'
        ).fetchall()
        conn.close()
        
        imagenes = {}
        for persona in personas:
            imagenes[persona['id']] = {
                'nombre': persona['nombre'],
                'imagen_url': persona['imagen_url']
            }
        
        return jsonify({
            'success': True,
            'imagenes': imagenes
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

# === MODIFICAR LA RUTA agregar_persona EXISTENTE ===
# Reemplazar la función existente con esta versión mejorada:

@app.route('/agregar_persona', methods=['POST'])
def agregar_persona():
    """Formulario para agregar nueva persona - VERSIÓN CON SOPORTE PARA IMÁGENES"""
    nombre = request.form['nombre']
    icono = request.form.get('icono', 'user')
    grupo = request.form.get('grupo', 'contactos')
    color = request.form.get('color', '#3b82f6')
    descripcion = request.form.get('descripcion', '')
    
    conn = get_db_connection()
    try:
        # Insertar persona y obtener ID
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO personas (nombre, icono, grupo, color, descripcion)
            VALUES (?, ?, ?, ?, ?)
        ''', (nombre, icono, grupo, color, descripcion))
        
        persona_id = cursor.lastrowid
        conn.commit()
        
        # Si es una petición JSON (desde el modal mejorado), devolver JSON con ID
        if request.is_json or 'application/json' in request.headers.get('Accept', ''):
            return jsonify({
                'success': True,
                'message': f'Persona "{nombre}" agregada exitosamente',
                'persona_id': persona_id
            })
        else:
            # Si es desde el formulario HTML tradicional, mantener comportamiento original
            flash(f'✅ Contacto "{nombre}" agregado exitosamente!')
            return redirect(url_for('admin'))
            
    except sqlite3.IntegrityError:
        error_msg = f'❌ Ya existe un contacto llamado "{nombre}"'
        
        if request.is_json or 'application/json' in request.headers.get('Accept', ''):
            return jsonify({'error': error_msg}), 400
        else:
            flash(error_msg)
            return redirect(url_for('admin'))
            
    except Exception as e:
        error_msg = f'Error interno: {str(e)}'
        
        if request.is_json or 'application/json' in request.headers.get('Accept', ''):
            return jsonify({'error': error_msg}), 500
        else:
            flash(f'❌ {error_msg}')
            return redirect(url_for('admin'))
            
    finally:
        conn.close()

# === MODIFICAR LA FUNCIÓN api_grafo EXISTENTE ===
# Actualizar para incluir información de imágenes:

@app.route('/api/grafo')
def api_grafo():
    """API que devuelve los datos del grafo en formato JSON - CON IMÁGENES"""
    try:
        conn = get_db_connection()
        
        # Obtener personas CON IMÁGENES
        personas = conn.execute('SELECT * FROM personas').fetchall()
        
        # Obtener relaciones
        relaciones = conn.execute('''
            SELECT r.*, p1.nombre as persona1_nombre, p2.nombre as persona2_nombre
            FROM relaciones r
            JOIN personas p1 ON r.persona1_id = p1.id
            JOIN personas p2 ON r.persona2_id = p2.id
        ''').fetchall()
        
        conn.close()
        
        # Formatear datos para vis.js - INCLUYENDO IMÁGENES
        nodes = []
        for persona in personas:
            size = 50 if 'Usuario Principal' in persona['nombre'] else 30
            label = persona['nombre']
            
            node_data = {
                'id': persona['id'],
                'label': label,
                'color': persona['color'],
                'size': size,
                'grupo': persona['grupo']
            }
            
            # ✅ AGREGAR SOPORTE PARA IMÁGENES
            if persona['imagen_url']:
                node_data['shape'] = 'image'
                node_data['image'] = persona['imagen_url']
                node_data['size'] = 150  # Tamaño mayor para nodos con imagen
                node_data['borderWidth'] = 3
                node_data['borderWidthSelected'] = 5
                node_data['color'] = {
                    'border': persona['color'],
                    'background': 'white'
                }
                node_data['chosen'] = {
                    'node': "function(values, id, selected, hovering) { values.borderWidth = selected ? 5 : 3; values.shadow = selected || hovering; values.shadowColor = 'rgba(0,0,0,0.3)'; values.shadowSize = selected ? 15 : 10; }"
                }
            else:
                # Nodo sin imagen - estilo tradicional
                node_data['shape'] = 'dot'
                node_data['borderWidth'] = 2
            
            # ✅ AGREGAR POSICIONES SI EXISTEN
            if persona['posicion_x'] is not None and persona['posicion_y'] is not None:
                node_data['x'] = float(persona['posicion_x'])
                node_data['y'] = float(persona['posicion_y'])
                node_data['physics'] = True
            else:
                node_data['physics'] = True
            
            nodes.append(node_data)
        
        edges = []
        for relacion in relaciones:
            color = '#10b981' if relacion['fortaleza'] >= 8 else '#f59e0b' if relacion['fortaleza'] >= 6 else '#6b7280'
            edges.append({
                'from': relacion['persona1_id'],
                'to': relacion['persona2_id'],
                'width': relacion['fortaleza'],
                'color': color,
                'label': relacion['tipo'].replace('_', ' ').title(),
                'title': f"<b>{relacion['persona1_nombre']} ↔ {relacion['persona2_nombre']}</b><br>Tipo: {relacion['tipo'].replace('_', ' ').title()}<br>Fortaleza: {relacion['fortaleza']}/10<br>Contexto: {relacion['contexto'] or 'Sin contexto'}"
            })
        
        resultado = {'nodes': nodes, 'edges': edges}
        
        print(f"🔍 API devolviendo: {len(nodes)} nodos, {len(edges)} conexiones")
        
        return jsonify(resultado)
        
    except Exception as e:
        print(f"❌ Error en API: {e}")
        return jsonify({'error': str(e), 'nodes': [], 'edges': []}), 500

# === AGREGAR AL FINAL DE LA FUNCIÓN __main__ ===
# En la parte donde se ejecuta if __name__ == '__main__':

if __name__ == '__main__':
    # Eliminar base de datos anterior si existe
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
        print("🗑️ Base de datos anterior eliminada")
    
    # Inicializar base de datos
    init_db()
    
    # ✅ AGREGAR SOPORTE PARA IMÁGENES
    agregar_soporte_imagenes_db()
    
    print("🚀 Iniciando servidor empresarial...")
    print("📊 Base de datos: red_social.db")
    print("🌐 Análisis en: http://localhost:5000")
    print("⚙️ Administración en: http://localhost:5000/admin")
    print("📱 API en: http://localhost:5000/api/grafo")
    print("🔍 Debug en: http://localhost:5000/debug")
    print("🖼️ Sistema de imágenes: Activado")
    print("🛑 Para detener: Ctrl+C")
    
    # Ejecutar servidor
    app.run(debug=True, port=5000)

# === INSTRUCCIONES DE INSTALACIÓN ===
"""
DEPENDENCIAS ADICIONALES REQUERIDAS:

1. Instalar Pillow para procesamiento de imágenes:
   pip install Pillow

2. Estructura de directorios que se creará automáticamente:
   mi_red_social/
   ├── static/
   │   ├── images/
   │   │   └── users/          # Aquí se guardarán las imágenes
   │   ├── js/
   │   └── css/

3. Permisos:
   - Asegúrate de que la aplicación tenga permisos de escritura en el directorio static/

4. Configuración de servidor web (si se usa en producción):
   - Configurar límites de subida de archivos
   - Configurar servido de archivos estáticos

NOTAS IMPORTANTES:
- Las imágenes se redimensionan automáticamente a 150x150 píxeles
- Se mantiene la relación de aspecto y se agrega padding si es necesario
- Los formatos soportados son: JPG, PNG, GIF, WebP
- Tamaño máximo por imagen: 5MB
- Las imágenes antiguas se eliminan automáticamente al subir nuevas
"""
