# =================================================================
# app.py - Punto de entrada principal
# =================================================================

from flask import Flask
from config import Config
from models.database import init_db, create_images_directory
from api import register_blueprints
import os

def create_app(config_class=Config):
    """Factory pattern para crear la aplicación Flask"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Inicializar base de datos
    if not os.path.exists(app.config['DATABASE_PATH']):
        init_db(app.config['DATABASE_PATH'])
    
    # Crear directorio de imágenes
    create_images_directory(app.config['IMAGES_FOLDER'])
    
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