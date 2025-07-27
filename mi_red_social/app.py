# app.py - Servidor Flask con Base de Datos SQLite (VERSIÓN CORREGIDA)
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'tu_clave_secreta_para_flask_sessions'

# Configuración de la base de datos
DATABASE = 'red_social.db'

def init_db():
    """Inicializar la base de datos con las tablas necesarias"""
    print("🔧 Inicializando base de datos...")
    
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
            emoji TEXT DEFAULT '😊',
            grupo TEXT DEFAULT 'amigos',
            color TEXT DEFAULT '#4ecdc4',
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
            tipo TEXT DEFAULT 'amistad',
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
        ('Tú', '😎', 'centro', '#ff4757', 'El centro de tu red social'),
        ('Ana', '🎨', 'familia_cercana', '#2ed573', 'Mejor amiga desde la secundaria'),
        ('Carlos', '💻', 'trabajo', '#3742fa', 'Compañero de trabajo y coding buddy'),
        ('María', '📚', 'universidad', '#ffa502', 'Amiga de la universidad'),
        ('David', '⚽', 'deportes', '#ff6348', 'Compañero del gimnasio'),
        ('Laura', '🐕', 'familia_cercana', '#7bed9f', 'Prima y confidente')
    ]
    
    cursor.executemany(
        'INSERT INTO personas (nombre, emoji, grupo, color, descripcion) VALUES (?, ?, ?, ?, ?)',
        personas_iniciales
    )
    
    # Relaciones iniciales
    relaciones_iniciales = [
        (1, 2, 'mejor_amiga', 9, 'Desde la secundaria'),
        (1, 3, 'colega', 7, 'Proyecto actual en la empresa'),
        (1, 4, 'universidad', 8, 'Compañera de carrera'),
        (1, 5, 'gimnasio', 6, 'Entrenamientos juntos'),
        (1, 6, 'familia', 8, 'Prima favorita'),
        (2, 4, 'amigas', 7, 'Se conocieron por mí'),
        (3, 5, 'conocidos', 4, 'Coinciden en eventos')
    ]
    
    cursor.executemany(
        'INSERT INTO relaciones (persona1_id, persona2_id, tipo, fortaleza, contexto) VALUES (?, ?, ?, ?, ?)',
        relaciones_iniciales
    )
    
    conn.commit()
    conn.close()
    
    print("✅ Base de datos inicializada con datos de ejemplo")

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
        
        # Formatear datos para vis.js
        nodes = []
        for persona in personas:
            size = 50 if persona['nombre'] == 'Tú' else 30
            nodes.append({
                'id': persona['id'],
                'label': f"{persona['emoji']} {persona['nombre']}",
                'color': persona['color'],
                'size': size,
                'title': f"<b>{persona['nombre']}</b><br>{persona['descripcion'] or 'Sin descripción'}",
                'grupo': persona['grupo']
            })
        
        edges = []
        for relacion in relaciones:
            color = '#ff4757' if relacion['fortaleza'] >= 8 else '#ffa502' if relacion['fortaleza'] >= 6 else '#747d8c'
            edges.append({
                'from': relacion['persona1_id'],
                'to': relacion['persona2_id'],
                'width': relacion['fortaleza'],
                'color': color,
                'label': relacion['tipo'],
                'title': f"<b>{relacion['persona1_nombre']} ↔ {relacion['persona2_nombre']}</b><br>Tipo: {relacion['tipo']}<br>Fortaleza: {relacion['fortaleza']}/10<br>Contexto: {relacion['contexto'] or 'Sin contexto'}"
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
    emoji = request.form.get('emoji', '😊')
    grupo = request.form.get('grupo', 'amigos')
    color = request.form.get('color', '#4ecdc4')
    descripcion = request.form.get('descripcion', '')
    
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO personas (nombre, emoji, grupo, color, descripcion)
            VALUES (?, ?, ?, ?, ?)
        ''', (nombre, emoji, grupo, color, descripcion))
        conn.commit()
        flash(f'✅ Persona "{nombre}" agregada exitosamente!')
    except sqlite3.IntegrityError:
        flash(f'❌ Ya existe una persona llamada "{nombre}"')
    finally:
        conn.close()
    
    return redirect(url_for('admin'))

@app.route('/agregar_relacion', methods=['POST'])
def agregar_relacion():
    """Formulario para agregar nueva relación"""
    persona1_id = request.form['persona1_id']
    persona2_id = request.form['persona2_id']
    tipo = request.form.get('tipo', 'amistad')
    fortaleza = int(request.form.get('fortaleza', 5))
    contexto = request.form.get('contexto', '')
    
    if persona1_id == persona2_id:
        flash('❌ No puedes crear una relación de una persona consigo misma')
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
        flash('❌ Ya existe una relación entre estas personas')
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
        flash(f'✅ Persona "{persona["nombre"]}" eliminada exitosamente!')
    else:
        flash('❌ Persona no encontrada')
    
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
    
    print("🚀 Iniciando servidor web...")
    print("📊 Base de datos: red_social.db")
    print("🌐 Abre tu navegador en: http://localhost:5000")
    print("⚙️ Panel admin en: http://localhost:5000/admin")
    print("📱 API datos en: http://localhost:5000/api/grafo")
    print("🔍 Debug en: http://localhost:5000/debug")
    print("🛑 Para detener: Ctrl+C")
    
    # Ejecutar servidor
    app.run(debug=True, port=5000)