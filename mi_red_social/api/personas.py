# =================================================================
# api/personas.py - API de personas
# =================================================================

from flask import Blueprint, request, jsonify, redirect, url_for, flash, current_app
from werkzeug.datastructures import FileStorage
from models.database import DatabaseManager
from models.persona import PersonaRepository
from models.relacion import RelacionRepository
from services.data_service import DataService
from services.image_service import ImageService

personas_bp = Blueprint('personas', __name__)

def get_persona_services():
    """Factory para obtener servicios de personas"""
    db_manager = DatabaseManager(current_app.config['DATABASE_PATH'])
    persona_repo = PersonaRepository(db_manager)
    relacion_repo = RelacionRepository(db_manager)
    image_service = ImageService(current_app.config)
    data_service = DataService(persona_repo, relacion_repo, image_service)
    
    return data_service, persona_repo, image_service

@personas_bp.route('/personas', methods=['POST'])
def agregar_persona():
    """Crear nueva persona"""
    data_service, _, _ = get_persona_services()
    
    form_data = {
        'nombre': request.form.get('nombre', ''),
        'icono': request.form.get('icono', 'user'),
        'grupo': request.form.get('grupo', 'contactos'),
        'color': request.form.get('color', '#3b82f6'),
        'descripcion': request.form.get('descripcion', '')
    }
    
    success, message, persona_id = data_service.create_persona_with_validation(form_data)
    
    # Determinar tipo de respuesta
    is_json_request = request.is_json or 'application/json' in request.headers.get('Accept', '')
    
    if success:
        if is_json_request:
            return jsonify({
                'success': True,
                'message': message,
                'persona_id': persona_id
            })
        else:
            flash(f'✅ {message}')
            return redirect(url_for('main.admin'))
    else:
        if is_json_request:
            return jsonify({'error': message}), 400
        else:
            flash(f'❌ {message}')
            return redirect(url_for('main.admin'))

@personas_bp.route('/personas/<int:persona_id>', methods=['DELETE'])
def eliminar_persona(persona_id):
    """Eliminar persona"""
    data_service, _, _ = get_persona_services()
    
    success, message = data_service.delete_persona_with_cleanup(persona_id)
    
    if success:
        flash(f'✅ {message}')
        return redirect(url_for('main.admin'))
    else:
        flash(f'❌ {message}')
        return redirect(url_for('main.admin'))

@personas_bp.route('/personas/<int:persona_id>/imagen', methods=['POST'])
def subir_imagen(persona_id):
    """Subir imagen para una persona"""
    data_service, persona_repo, image_service = get_persona_services()
    
    try:
        # Verificar que la persona existe
        persona = persona_repo.get_by_id(persona_id)
        if not persona:
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        # Verificar archivo
        if 'imagen' not in request.files:
            return jsonify({'error': 'No se envió ningún archivo'}), 400
        
        file = request.files['imagen']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        # Eliminar imagen anterior si existe
        if persona.imagen_url:
            image_service.delete_image(persona.imagen_url)
        
        # Guardar nueva imagen
        image_path, error = image_service.save_image(file, persona_id)
        if error:
            return jsonify({'error': error}), 400
        
        # Actualizar base de datos
        persona_repo.update_image(persona_id, image_path)
        
        return jsonify({
            'success': True,
            'message': 'Imagen subida exitosamente',
            'imagen_url': image_path,
            'persona_id': persona_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@personas_bp.route('/personas/<int:persona_id>/imagen', methods=['DELETE'])
def eliminar_imagen(persona_id):
    """Eliminar imagen de una persona"""
    data_service, persona_repo, image_service = get_persona_services()
    
    try:
        persona = persona_repo.get_by_id(persona_id)
        if not persona:
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        # Eliminar archivo de imagen
        if persona.imagen_url:
            image_service.delete_image(persona.imagen_url)
        
        # Actualizar base de datos
        persona_repo.update_image(persona_id, None)
        
        return jsonify({
            'success': True,
            'message': 'Imagen eliminada exitosamente',
            'persona_id': persona_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@personas_bp.route('/imagenes', methods=['GET'])
def obtener_imagenes():
    """Obtener todas las URLs de imágenes"""
    try:
        _, persona_repo, _ = get_persona_services()
        personas = persona_repo.get_all()
        
        imagenes = {
            p.id: {'nombre': p.nombre, 'imagen_url': p.imagen_url}
            for p in personas if p.imagen_url
        }
        
        return jsonify({'success': True, 'imagenes': imagenes})
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500