# =================================================================
# api/main.py - Rutas principales (páginas web)
# =================================================================

from flask import Blueprint, render_template, current_app
from models.database import DatabaseManager
from models.persona import PersonaRepository
from models.relacion import RelacionRepository
from services.data_service import DataService
from services.image_service import ImageService

main_bp = Blueprint('main', __name__)

def get_services():
    """Factory para obtener servicios configurados"""
    db_manager = DatabaseManager(current_app.config['DATABASE_PATH'])
    persona_repo = PersonaRepository(db_manager)
    relacion_repo = RelacionRepository(db_manager)
    image_service = ImageService(current_app.config)
    data_service = DataService(persona_repo, relacion_repo, image_service)
    
    return data_service, db_manager, persona_repo, relacion_repo, image_service

@main_bp.route('/')
def index():
    """Página principal con el grafo interactivo"""
    return render_template('index.html')

@main_bp.route('/admin')
def admin():
    """Panel de administración"""
    data_service, _, _, _, _ = get_services()
    admin_data = data_service.get_admin_data()
    
    return render_template('admin.html', 
                         personas=admin_data['personas'], 
                         relaciones=admin_data['relaciones'])

@main_bp.route('/debug')
def debug():
    """Endpoint de debug"""
    data_service, _, _, _, _ = get_services()
    return data_service.get_debug_info()