# app.py - Fix para configuración

from flask import Flask
from config import Config
from models.database import init_db, create_images_directory
from api import register_blueprints
import os
from pathlib import Path

def create_app(config_class=Config):
    """Factory pattern para crear la aplicación Flask"""
    
    # Obtener el directorio base del proyecto
    base_dir = Path(__file__).parent.absolute()
    
    # Crear app con rutas correctas para templates y static
    app = Flask(__name__,
                template_folder=str(base_dir / 'templates'),
                static_folder=str(base_dir / 'static'))
    
    app.config.from_object(config_class)
    
    # CORREGIDO: Asegurar que las configuraciones estén disponibles
    # Convertir Path a string si es necesario
    if hasattr(config_class, 'DATABASE_PATH') and isinstance(config_class.DATABASE_PATH, Path):
        app.config['DATABASE_PATH'] = str(config_class.DATABASE_PATH)
    
    if hasattr(config_class, 'IMAGES_FOLDER') and isinstance(config_class.IMAGES_FOLDER, Path):
        app.config['IMAGES_FOLDER'] = str(config_class.IMAGES_FOLDER)
    
    # Debug: Imprimir configuraciones para verificar
    print("🔧 Configuraciones de la app:")
    print(f"  - DATABASE_PATH: {app.config.get('DATABASE_PATH')}")
    print(f"  - IMAGES_FOLDER: {app.config.get('IMAGES_FOLDER')}")
    print(f"  - ALLOWED_EXTENSIONS: {app.config.get('ALLOWED_EXTENSIONS')}")
    print(f"  - MAX_FILE_SIZE: {app.config.get('MAX_FILE_SIZE')}")
    
    # Inicializar base de datos
    if not os.path.exists(app.config['DATABASE_PATH']):
        init_db(app.config['DATABASE_PATH'])
    
    # Crear directorio de imágenes
    create_images_directory(Path(app.config['IMAGES_FOLDER']))
    
    # Registrar blueprints
    register_blueprints(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    print("🚀 Iniciando servidor empresarial...")
    print(f"📊 Base de datos: {app.config['DATABASE_PATH']}")
    print("🌐 Análisis en: http://localhost:5000")
    print("⚙️ Administración en: http://localhost:5000/admin")
    print("📱 API en: http://localhost:5000/api/grafo")
    print("🔍 Debug en: http://localhost:5000/debug")
    print("🖼️ Sistema de imágenes: Activado")
    print("🛑 Para detener: Ctrl+C")
    
    app.run(debug=True, port=5000)