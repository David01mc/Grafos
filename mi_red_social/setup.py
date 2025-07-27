# setup.py - Script para crear automáticamente todos los archivos
import os
import subprocess
import sys

def crear_estructura_proyecto():
    """Crea la estructura de carpetas del proyecto"""
    print("📁 Creando estructura de carpetas...")
    
    # Crear carpetas
    os.makedirs('templates', exist_ok=True)
    
    print("✅ Estructura de carpetas creada")

def instalar_dependencias():
    """Instala las dependencias necesarias"""
    print("📦 Instalando dependencias...")
    
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'flask'])
        print("✅ Flask instalado correctamente")
    except subprocess.CalledProcessError:
        print("❌ Error instalando Flask. Instálalo manualmente: pip install flask")
        return False
    
    return True

def crear_app_py():
    """Crea el archivo app.py principal"""
    print("🐍 Creando app.py...")
    
    app_content = """# app.py - Servidor Flask con Base de Datos SQLite
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
    \"\"\"Inicializar la base de datos con las tablas necesarias\"\"\"
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Tabla de personas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS personas (
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
        CREATE TABLE IF NOT EXISTS relaciones (
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
    
    # Insertar datos iniciales si no existen
    cursor.execute("SELECT COUNT(*) FROM personas")
    if cursor.fetchone()[0] == 0:
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

def get_db_connection():
    \"\"\"Obtener conexión a la base de datos\"\"\"
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    \"\"\"Página principal con el grafo interactivo\"\"\"
    return render_template('index.html')

@app.route('/admin')
def admin():
    \"\"\"Panel de administración\"\"\"
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
    \"\"\"API que devuelve los datos del grafo en formato JSON\"\"\"
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
    
    return jsonify({'nodes': nodes, 'edges': edges})

@app.route('/agregar_persona', methods=['POST'])
def agregar_persona():
    \"\"\"Formulario para agregar nueva persona\"\"\"
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
    \"\"\"Formulario para agregar nueva relación\"\"\"
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
    \"\"\"Eliminar una persona y sus relaciones\"\"\"
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
    \"\"\"Eliminar una relación\"\"\"
    conn = get_db_connection()
    conn.execute('DELETE FROM relaciones WHERE id = ?', (relacion_id,))
    conn.commit()
    conn.close()
    
    flash('✅ Relación eliminada exitosamente!')
    return redirect(url_for('admin'))

if __name__ == '__main__':
    # Inicializar base de datos
    init_db()
    
    print("🚀 Iniciando servidor web...")
    print("📊 Base de datos: red_social.db")
    print("🌐 Abre tu navegador en: http://localhost:5000")
    print("⚙️ Panel admin en: http://localhost:5000/admin")
    print("📱 API datos en: http://localhost:5000/api/grafo")
    print("🛑 Para detener: Ctrl+C")
    
    # Ejecutar servidor
    app.run(debug=True, port=5000)
"""
    
    with open('app.py', 'w', encoding='utf-8') as f:
        f.write(app_content)
    
    print("✅ app.py creado")

def crear_templates():
    """Crea todos los archivos HTML en la carpeta templates"""
    print("🌐 Creando templates HTML...")
    
    # base.html
    base_html = '''<!-- templates/base.html -->
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Mi Red Social{% endblock %}</title>
    <script src="https://unpkg.com/vis-network@latest/standalone/umd/vis-network.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .main-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            margin: 20px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .network-container {
            height: 600px;
            border: 2px solid #dee2e6;
            border-radius: 15px;
            background: #f8f9fa;
        }
        
        .admin-panel {
            background: rgba(248, 249, 250, 0.9);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .btn-custom {
            border-radius: 25px;
            padding: 10px 25px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .btn-custom:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .stats-card {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .form-control {
            border-radius: 10px;
            border: 2px solid #dee2e6;
            padding: 10px 15px;
        }
        
        .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .alert {
            border-radius: 15px;
            border: none;
        }
        
        .table {
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .navbar-custom {
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(10px);
            border-radius: 0 0 20px 20px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light navbar-custom">
        <div class="container">
            <a class="navbar-brand" href="{{ url_for('index') }}">
                <strong>🌐 Mi Red Social</strong>
            </a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="{{ url_for('index') }}">📊 Grafo</a>
                <a class="nav-link" href="{{ url_for('admin') }}">⚙️ Admin</a>
                <a class="nav-link" href="/api/grafo" target="_blank">🔧 API</a>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        {% with messages = get_flashed_messages() %}
            {% if messages %}
                <div class="row">
                    <div class="col-12">
                        {% for message in messages %}
                            <div class="alert alert-info alert-dismissible fade show" role="alert">
                                {{ message }}
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        {% endfor %}
                    </div>
                </div>
            {% endif %}
        {% endwith %}

        {% block content %}{% endblock %}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    {% block scripts %}{% endblock %}
</body>
</html>'''
    
    with open('templates/base.html', 'w', encoding='utf-8') as f:
        f.write(base_html)
    
    # index.html
    index_html = '''<!-- templates/index.html -->
{% extends "base.html" %}

{% block title %}Grafo de Mi Red Social{% endblock %}

{% block content %}
<div class="main-container">
    <div class="row">
        <div class="col-12">
            <h1 class="text-center mb-4">🌐 Mi Red Social Interactiva</h1>
            
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stats-card">
                        <h4 id="total-personas">-</h4>
                        <p class="mb-0">👥 Personas</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <h4 id="total-conexiones">-</h4>
                        <p class="mb-0">🔗 Conexiones</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <h4 id="densidad-red">-</h4>
                        <p class="mb-0">📊 Densidad</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <h4 id="mas-conectado">-</h4>
                        <p class="mb-0">👑 Más Conectado</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row">
        <div class="col-12">
            <div class="network-container" id="network"></div>
        </div>
    </div>
    
    <div class="row mt-4">
        <div class="col-12 text-center">
            <button class="btn btn-primary btn-custom me-2" onclick="network.fit()">🎯 Centrar</button>
            <button class="btn btn-success btn-custom me-2" onclick="togglePhysics()">⚡ Toggle Física</button>
            <button class="btn btn-info btn-custom me-2" onclick="randomizePositions()">🎲 Aleatorio</button>
            <button class="btn btn-warning btn-custom me-2" onclick="recargarDatos()">🔄 Recargar</button>
            <a href="{{ url_for('admin') }}" class="btn btn-secondary btn-custom">⚙️ Administrar</a>
        </div>
    </div>
    
    <div class="row mt-4">
        <div class="col-12">
            <div class="admin-panel">
                <h5>🎮 Instrucciones de Uso:</h5>
                <div class="row">
                    <div class="col-md-6">
                        <ul class="mb-0">
                            <li><strong>Arrastrar:</strong> Mueve los nodos para reorganizar la red</li>
                            <li><strong>Zoom:</strong> Usa la rueda del ratón para acercar/alejar</li>
                            <li><strong>Click:</strong> Selecciona nodos para ver información detallada</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="mb-0">
                            <li><strong>Hover:</strong> Pasa el ratón sobre conexiones para ver detalles</li>
                            <li><strong>Admin:</strong> Ve al panel de administración para gestionar datos</li>
                            <li><strong>Colores:</strong> Los nodos se colorean por grupos sociales</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block scripts %}
<script>
let network;
let physicsEnabled = true;
let nodes, edges;

async function cargarDatos() {
    try {
        const response = await fetch('/api/grafo');
        const data = await response.json();
        
        // Actualizar estadísticas
        document.getElementById('total-personas').textContent = data.nodes.length;
        document.getElementById('total-conexiones').textContent = data.edges.length;
        
        // Calcular densidad
        const maxConexiones = data.nodes.length > 1 ? (data.nodes.length * (data.nodes.length - 1)) / 2 : 0;
        const densidad = maxConexiones > 0 ? ((data.edges.length / maxConexiones) * 100).toFixed(1) : 0;
        document.getElementById('densidad-red').textContent = densidad + '%';
        
        // Encontrar el más conectado
        const conexionesPorNodo = {};
        data.edges.forEach(edge => {
            conexionesPorNodo[edge.from] = (conexionesPorNodo[edge.from] || 0) + 1;
            conexionesPorNodo[edge.to] = (conexionesPorNodo[edge.to] || 0) + 1;
        });
        
        let masConectado = '';
        let maxConexiones = 0;
        for (const [nodeId, conexiones] of Object.entries(conexionesPorNodo)) {
            if (conexiones > maxConexiones) {
                maxConexiones = conexiones;
                const nodo = data.nodes.find(n => n.id == nodeId);
                masConectado = nodo ? nodo.label.replace(/[^a-zA-ZÀ-ÿ\\s]/g, '').trim() : '';
            }
        }
        document.getElementById('mas-conectado').textContent = masConectado;
        
        return data;
    } catch (error) {
        console.error('Error cargando datos:', error);
        return { nodes: [], edges: [] };
    }
}

async function inicializarRed() {
    const data = await cargarDatos();
    
    const container = document.getElementById('network');
    nodes = new vis.DataSet(data.nodes);
    edges = new vis.DataSet(data.edges);
    
    const options = {
        physics: {
            enabled: true,
            stabilization: { iterations: 100 },
            barnesHut: {
                gravitationalConstant: -8000,
                centralGravity: 0.3,
                springLength: 95,
                springConstant: 0.04,
                damping: 0.09
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            hideEdgesOnDrag: false,
            selectConnectedEdges: false
        },
        edges: {
            smooth: {
                type: "continuous",
                forceDirection: "none"
            },
            font: { color: '#333', size: 12 }
        },
        nodes: {
            borderWidth: 2,
            shadow: true,
            font: { color: 'white', size: 14 }
        }
    };
    
    network = new vis.Network(container, { nodes, edges }, options);
    
    // Eventos
    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodes.get(nodeId);
            alert(`🎯 Información de: ${node.label}\\n\\nGrupo: ${node.grupo}\\nID: ${node.id}`);
        }
    });
    
    network.on("hoverNode", function () {
        document.body.style.cursor = 'pointer';
    });
    
    network.on("blurNode", function () {
        document.body.style.cursor = 'default';
    });
    
    // Centrar después de un segundo
    setTimeout(() => network.fit(), 1000);
}

function togglePhysics() {
    physicsEnabled = !physicsEnabled;
    network.setOptions({ physics: { enabled: physicsEnabled } });
}

function randomizePositions() {
    const updates = [];
    nodes.forEach(node => {
        updates.push({
            id: node.id,
            x: Math.random() * 800 - 400,
            y: Math.random() * 600 - 300
        });
    });
    nodes.update(updates);
}

async function recargarDatos() {
    await inicializarRed();
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', inicializarRed);
</script>
{% endblock %}'''
    
    with open('templates/index.html', 'w', encoding='utf-8') as f:
        f.write(index_html)
    
    # admin.html - COMPLETO
    admin_html = '''<!-- templates/admin.html -->
{% extends "base.html" %}

{% block title %}Panel de Administración{% endblock %}

{% block content %}
<div class="main-container">
    <h1 class="text-center mb-4">⚙️ Panel de Administración</h1>
    
    <!-- Formularios para agregar datos -->
    <div class="row">
        <div class="col-md-6">
            <div class="admin-panel">
                <h4>👤 Agregar Nueva Persona</h4>
                <form method="POST" action="{{ url_for('agregar_persona') }}">
                    <div class="mb-3">
                        <label class="form-label">Nombre *</label>
                        <input type="text" class="form-control" name="nombre" required>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Emoji</label>
                            <input type="text" class="form-control" name="emoji" placeholder="😊" maxlength="2">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Color</label>
                            <input type="color" class="form-control" name="color" value="#4ecdc4">
                        </div>
                    </div>
                    <div class="mb-3 mt-3">
                        <label class="form-label">Grupo</label>
                        <select class="form-control" name="grupo">
                            <option value="amigos">Amigos</option>
                            <option value="familia_cercana">Familia Cercana</option>
                            <option value="trabajo">Trabajo</option>
                            <option value="universidad">Universidad</option>
                            <option value="deportes">Deportes</option>
                            <option value="nuevo">Nuevo</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-control" name="descripcion" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-success btn-custom">➕ Agregar Persona</button>
                </form>
            </div>
        </div>
        
        <!-- Formulario para agregar relación -->
        <div class="col-md-6">
            <div class="admin-panel">
                <h4>🔗 Agregar Nueva Relación</h4>
                <form method="POST" action="{{ url_for('agregar_relacion') }}">
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Persona 1 *</label>
                            <select class="form-control" name="persona1_id" required>
                                <option value="">Seleccionar...</option>
                                {% for persona in personas %}
                                <option value="{{ persona.id }}">{{ persona.emoji }} {{ persona.nombre }}</option>
                                {% endfor %}
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Persona 2 *</label>
                            <select class="form-control" name="persona2_id" required>
                                <option value="">Seleccionar...</option>
                                {% for persona in personas %}
                                <option value="{{ persona.id }}">{{ persona.emoji }} {{ persona.nombre }}</option>
                                {% endfor %}
                            </select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <label class="form-label">Tipo de Relación</label>
                            <select class="form-control" name="tipo">
                                <option value="amistad">Amistad</option>
                                <option value="mejor_amigo">Mejor Amigo/a</option>
                                <option value="familia">Familia</option>
                                <option value="trabajo">Trabajo</option>
                                <option value="universidad">Universidad</option>
                                <option value="deportes">Deportes</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Fortaleza (1-10)</label>
                            <input type="number" class="form-control" name="fortaleza" min="1" max="10" value="5">
                        </div>
                    </div>
                    <div class="mb-3 mt-3">
                        <label class="form-label">Contexto</label>
                        <input type="text" class="form-control" name="contexto" placeholder="¿Cómo se conocen?">
                    </div>
                    <button type="submit" class="btn btn-primary btn-custom">🔗 Crear Relación</button>
                </form>
            </div>
        </div>
    </div>
    
    <!-- Lista de personas existentes -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="admin-panel">
                <h4>👥 Personas en tu Red ({{ personas|length }})</h4>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Persona</th>
                                <th>Grupo</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for persona in personas %}
                            <tr>
                                <td>{{ persona.id }}</td>
                                <td>
                                    <span style="color: {{ persona.color }};">{{ persona.emoji }}</span>
                                    <strong>{{ persona.nombre }}</strong>
                                </td>
                                <td>
                                    <span class="badge bg-secondary">{{ persona.grupo.replace('_', ' ').title() }}</span>
                                </td>
                                <td>{{ persona.descripcion or 'Sin descripción' }}</td>
                                <td>
                                    {% if persona.nombre != 'Tú' %}
                                    <a href="{{ url_for('eliminar_persona', persona_id=persona.id) }}" 
                                       class="btn btn-sm btn-danger"
                                       onclick="return confirm('¿Eliminar a {{ persona.nombre }}?')">🗑️</a>
                                    {% else %}
                                    <span class="text-muted">👑 Centro</span>
                                    {% endif %}
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Lista de relaciones existentes -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="admin-panel">
                <h4>🔗 Relaciones Actuales ({{ relaciones|length }})</h4>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Conexión</th>
                                <th>Tipo</th>
                                <th>Fortaleza</th>
                                <th>Contexto</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for relacion in relaciones %}
                            <tr>
                                <td>
                                    <strong>{{ relacion.persona1_nombre }}</strong> 
                                    ↔ 
                                    <strong>{{ relacion.persona2_nombre }}</strong>
                                </td>
                                <td>
                                    <span class="badge bg-info">{{ relacion.tipo.replace('_', ' ').title() }}</span>
                                </td>
                                <td>{{ relacion.fortaleza }}/10</td>
                                <td>{{ relacion.contexto or 'Sin contexto' }}</td>
                                <td>
                                    <a href="{{ url_for('eliminar_relacion', relacion_id=relacion.id) }}" 
                                       class="btn btn-sm btn-danger"
                                       onclick="return confirm('¿Eliminar esta relación?')">🗑️</a>
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Botón para ver el grafo -->
    <div class="row mt-4">
        <div class="col-12 text-center">
            <a href="{{ url_for('index') }}" class="btn btn-success btn-custom btn-lg">
                📊 Ver Grafo Actualizado
            </a>
        </div>
    </div>
</div>
{% endblock %}'''
    
    with open('templates/admin.html', 'w', encoding='utf-8') as f:
        f.write(admin_html)
    
    print("✅ Templates HTML creados")

def crear_readme():
    """Crea un archivo README con instrucciones"""
    print("📝 Creando README...")
    
    readme_content = '''# 🌐 Mi Red Social - Sistema de Grafos Interactivo

## 🚀 Instalación y Uso

### 1. Requisitos
- Python 3.7 o superior
- Flask (se instala automáticamente)

### 2. Instalación
```bash
# Ejecutar el script de setup
python setup.py

# O manualmente:
pip install flask
python app.py
```

### 3. Uso
1. Abre tu navegador en: http://localhost:5000
2. Ve al panel de administración: http://localhost:5000/admin
3. Agrega personas y relaciones
4. Visualiza tu red social interactiva

## 📊 Funcionalidades

### Grafo Interactivo
- 🎯 Visualización en tiempo real
- 🖱️ Arrastrar y reorganizar nodos
- 🔍 Zoom y navegación
- 📊 Estadísticas automáticas
- 🎨 Colores por grupos sociales

### Panel de Administración
- ➕ Agregar personas con emojis y colores
- 🔗 Crear relaciones con diferentes tipos y fortalezas
- 🗑️ Eliminar personas y relaciones
- 📋 Ver listas completas de datos

### Base de Datos
- 💾 SQLite local (sin configuración)
- 🔄 Persistencia automática
- 📈 Escalable para cientos de personas

## 🎮 Controles del Grafo

- **Arrastrar**: Mueve nodos
- **Rueda del ratón**: Zoom in/out
- **Click en nodo**: Ver información
- **Hover en conexión**: Ver detalles de relación
- **Botones**: Centrar, física, aleatorio, recargar

## 🛠️ Estructura del Proyecto

```
mi_red_social/
├── app.py              # Servidor Flask principal
├── red_social.db       # Base de datos SQLite
├── templates/
│   ├── base.html       # Plantilla base
│   ├── index.html      # Página del grafo
│   └── admin.html      # Panel de administración
└── README.md           # Este archivo
```

---
Creado con ❤️ usando Python, Flask, SQLite y vis.js
'''
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("✅ README.md creado")

def main():
    """Función principal que ejecuta todo el setup"""
    print("🚀 SETUP AUTOMÁTICO - MI RED SOCIAL")
    print("=" * 50)
    
    # Verificar si ya existe
    if os.path.exists('app.py'):
        respuesta = input("⚠️ Ya existe app.py. ¿Sobrescribir? (s/n): ")
        if respuesta.lower() != 's':
            print("❌ Setup cancelado")
            return
    
    try:
        # Crear estructura
        crear_estructura_proyecto()
        
        # Instalar dependencias
        if not instalar_dependencias():
            return
        
        # Crear archivos
        crear_app_py()
        crear_templates()
        crear_readme()
        
        print("\n" + "=" * 50)
        print("✅ ¡SETUP COMPLETADO EXITOSAMENTE!")
        print("=" * 50)
        print("📁 Archivos creados:")
        print("   • app.py")
        print("   • templates/base.html")
        print("   • templates/index.html") 
        print("   • templates/admin.html")
        print("   • README.md")
        print("\n🚀 Para ejecutar:")
        print("   python app.py")
        print("\n🌐 URLs:")
        print("   • http://localhost:5000 (Grafo)")
        print("   • http://localhost:5000/admin (Admin)")
        print("   • http://localhost:5000/api/grafo (API)")
        
        # Preguntar si ejecutar ahora
        ejecutar = input("\n¿Ejecutar el servidor ahora? (s/n): ")
        if ejecutar.lower() == 's':
            print("\n🚀 Iniciando servidor...")
            import subprocess
            subprocess.run([sys.executable, 'app.py'])
        
    except Exception as e:
        print(f"❌ Error durante el setup: {e}")
        print("💡 Revisa que tengas permisos de escritura en la carpeta")
        print("💡 Intenta ejecutar como administrador si es necesario")

if __name__ == "__main__":
    main()