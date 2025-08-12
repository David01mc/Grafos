# =================================================================
# models/database.py - Manejo centralizado de base de datos
# =================================================================

import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Optional, List, Dict, Any

class DatabaseManager:
    """Gestor centralizado de base de datos"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    @contextmanager
    def get_connection(self):
        """Context manager para conexiones a la base de datos"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def execute_query(self, query: str, params: tuple = ()) -> List[sqlite3.Row]:
        """Ejecutar consulta SELECT"""
        with self.get_connection() as conn:
            return conn.execute(query, params).fetchall()
    
    def execute_single(self, query: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        """Ejecutar consulta que devuelve un solo resultado"""
        with self.get_connection() as conn:
            return conn.execute(query, params).fetchone()
    
    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """Ejecutar INSERT y devolver el ID generado"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """Ejecutar UPDATE/DELETE y devolver filas afectadas"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount
    
    def execute_many(self, query: str, params_list: List[tuple]) -> None:
        """Ejecutar múltiples operaciones"""
        with self.get_connection() as conn:
            conn.executemany(query, params_list)
            conn.commit()

def init_db(db_path: str) -> None:
    """Inicializar la base de datos con las tablas necesarias"""
    print("🔧 Inicializando base de datos empresarial...")
    
    # Eliminar archivo de base de datos si existe (solo para desarrollo)
    if Path(db_path).exists():
        Path(db_path).unlink()
        print("🗑️ Base de datos anterior eliminada")
    
    db_manager = DatabaseManager(db_path)
    
    with db_manager.get_connection() as conn:
        cursor = conn.cursor()
        
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
                imagen_url TEXT,
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
        
        # Datos iniciales
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
    
    print("✅ Base de datos inicializada con datos profesionales")

def create_images_directory(images_folder: Path) -> None:
    """Crear directorio de imágenes si no existe"""
    images_folder.mkdir(parents=True, exist_ok=True)
    print("✅ Sistema de imágenes configurado")
