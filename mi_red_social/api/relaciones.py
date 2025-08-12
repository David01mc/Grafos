# =================================================================
# api/relaciones.py - API de relaciones
# =================================================================

from flask import Blueprint, request, redirect, url_for, flash, current_app
from models.database import DatabaseManager
from models.persona import PersonaRepository
from models.relacion import RelacionRepository
from services.data_service import DataService
from services.image_service import ImageService

relaciones_bp = Blueprint('relaciones', __name__)

def get_relacion_services():
    """Factory para obtener servicios de relaciones"""
    db_manager = DatabaseManager(current_app.config['DATABASE_PATH'])
    persona_repo = PersonaRepository(db_manager)
    relacion_repo = RelacionRepository(db_manager)
    image_service = ImageService(current_app.config)
    data_service = DataService(persona_repo, relacion_repo, image_service)
    
    return data_service, relacion_repo

@relaciones_bp.route('/relaciones', methods=['POST'])
def agregar_relacion():
    """Crear nueva relación"""
    data_service, _ = get_relacion_services()
    
    form_data = {
        'persona1_id': request.form.get('persona1_id'),
        'persona2_id': request.form.get('persona2_id'),
        'tipo': request.form.get('tipo', 'profesional'),
        'fortaleza': request.form.get('fortaleza', 5),
        'contexto': request.form.get('contexto', '')
    }
    
    success, message = data_service.create_relacion_with_validation(form_data)
    
    if success:
        flash(f'✅ {message}')
    else:
        flash(f'❌ {message}')
    
    return redirect(url_for('main.admin'))

@relaciones_bp.route('/relaciones/<int:relacion_id>', methods=['DELETE'])
def eliminar_relacion(relacion_id):
    """Eliminar relación"""
    _, relacion_repo = get_relacion_services()
    
    try:
        success = relacion_repo.delete(relacion_id)
        if success:
            flash('✅ Relación eliminada exitosamente')
        else:
            flash('❌ Relación no encontrada')
    except Exception as e:
        flash(f'❌ Error eliminando relación: {str(e)}')
    
    return redirect(url_for('main.admin'))