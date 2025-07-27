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

@app.route('/api/grafo')
def api_grafo():
    """API que devuelve los datos del grafo en formato JSON"""
    try:
        conn = get_db_connection()
        
        # Obtener personas
        personas = conn.execute('SELECT * FROM personas').fetchall()
        
        # Obtener relaciones
        relaciones = conn.execute('''
            SELECT r.*, p1.nombre as persona1_nombre, p2.nombre as persona2_nombre
            FROM relaciones r
            JOIN personas p1 ON r.persona1_id = p1.id
            JOIN personas p2 ON r.persona2_id = p2.id
        ''').fetchall()
        
        conn.close()
        
        # Formatear datos para vis.js (sin emojis)
        nodes = []
        for persona in personas:
            size = 50 if 'Usuario Principal' in persona['nombre'] else 30
            # Solo usar el nombre, sin iconos
            label = persona['nombre']
            
            nodes.append({
                'id': persona['id'],
                'label': label,
                'color': persona['color'],
                'size': size,
                'title': f"<b>{persona['nombre']}</b><br>{persona['descripcion'] or 'Sin descripción'}<br>Grupo: {persona['grupo']}",
                'grupo': persona['grupo']
            })
        
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