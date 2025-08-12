# config.py - Configuración corregida
import os
from pathlib import Path

class Config:
    """Configuración base"""
    
    # Configuraciones básicas
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'empresa_red_relaciones_2024'
    
    # Base de datos
    BASE_DIR = Path(__file__).parent
    DATABASE_PATH = BASE_DIR / 'red_social.db'
    
    # Imágenes - CORREGIDO: Convertir Path a string para Flask
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    IMAGE_SIZE = (150, 150)
    IMAGES_FOLDER = str(BASE_DIR / 'static' / 'images' / 'users')  # ← Convertir a string
    
    # Configuraciones de Flask
    JSON_AS_ASCII = False
    JSONIFY_PRETTYPRINT_REGULAR = True

class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    
class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False
    
class TestingConfig(Config):
    """Configuración para testing"""
    TESTING = True
    DATABASE_PATH = ':memory:'