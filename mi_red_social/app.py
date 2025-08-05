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
    """API que devuelve los datos del grafo en formato JSON - VERSIÓN CORREGIDA CON GRUPOS"""
    try:
        conn = get_db_connection()
        
        # Obtener personas CON GRUPOS
        personas = conn.execute('SELECT * FROM personas').fetchall()
        
        # Obtener relaciones
        relaciones = conn.execute('''
            SELECT r.*, p1.nombre as persona1_nombre, p2.nombre as persona2_nombre
            FROM relaciones r
            JOIN personas p1 ON r.persona1_id = p1.id
            JOIN personas p2 ON r.persona2_id = p2.id
        ''').fetchall()
        
        conn.close()
        
        # Formatear datos para vis.js - INCLUYENDO GRUPOS
        nodes = []
        for persona in personas:
            size = 50 if 'Usuario Principal' in persona['nombre'] else 30
            # Solo usar el nombre, sin iconos
            label = persona['nombre']
            
            # IMPORTANTE: Incluir el grupo en los datos del nodo
            node_data = {
                'id': persona['id'],
                'label': label,
                'color': persona['color'],
                'size': size,
                'title': f"<b>{persona['nombre']}</b><br>{persona['descripcion'] or 'Sin descripción'}<br>Grupo: {persona['grupo'] or 'Sin grupo'}",
                'grupo': persona['grupo']  # ESTO ES CRUCIAL - incluir el grupo
            }
            
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
        
        # Debug: mostrar distribución de grupos
        grupos_debug = {}
        for node in nodes:
            grupo = node.get('grupo') or 'sin_grupo'
            grupos_debug[grupo] = grupos_debug.get(grupo, 0) + 1
        
        print(f"🔍 API devolviendo: {len(nodes)} nodos, {len(edges)} conexiones")
        print(f"📊 Distribución de grupos: {grupos_debug}")
        
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

@app.route('/obtener_posiciones', methods=['GET'])
def obtener_posiciones():
    conn = get_db_connection()
    personas = conn.execute('SELECT id, posicion_x, posicion_y FROM personas WHERE posicion_x IS NOT NULL').fetchall()
    conn.close()
    
    posiciones = {p['id']: {'x': p['posicion_x'], 'y': p['posicion_y']} for p in personas}
    return jsonify({'posiciones': posiciones})

# Modificar init_db() - agregar posicion_x REAL, posicion_y REAL a la tabla personas

if __name__ == '__main__':
    # Eliminar base de datos anterior si existe
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
        print("🗑️ Base de datos anterior eliminada")
    
    # Inicializar base de datos
    init_db()
    
    print("🚀 Iniciando servidor empresarial...")
    print("📊 Base de datos: red_social.db")
    print("🌐 Análisis en: http://localhost:5000")
    print("⚙️ Administración en: http://localhost:5000/admin")
    print("📱 API en: http://localhost:5000/api/grafo")
    print("🔍 Debug en: http://localhost:5000/debug")
    print("🛑 Para detener: Ctrl+C")
    
    # Ejecutar servidor
    app.run(debug=True, port=5000)