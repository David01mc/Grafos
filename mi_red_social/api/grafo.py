# =================================================================
# api/grafo.py - API del grafo
# =================================================================

from flask import Blueprint, jsonify, request, current_app
from models.database import DatabaseManager
from models.persona import PersonaRepository
from models.relacion import RelacionRepository
from services.graph_service import GraphService

grafo_bp = Blueprint('grafo', __name__)

def get_graph_service():
    """Factory para obtener el servicio de grafo"""
    db_manager = DatabaseManager(current_app.config['DATABASE_PATH'])
    persona_repo = PersonaRepository(db_manager)
    relacion_repo = RelacionRepository(db_manager)
    return GraphService(persona_repo, relacion_repo)

@grafo_bp.route('/grafo')
def api_grafo():
    """API que devuelve los datos del grafo en formato JSON"""
    try:
        graph_service = get_graph_service()
        resultado = graph_service.get_graph_data()
        
        print(f"🔍 API devolviendo: {len(resultado['nodes'])} nodos, {len(resultado['edges'])} conexiones")
        return jsonify(resultado)
        
    except Exception as e:
        print(f"❌ Error en API: {e}")
        return jsonify({'error': str(e), 'nodes': [], 'edges': []}), 500

@grafo_bp.route('/posiciones', methods=['GET', 'POST'])
def posiciones():
    """Obtener/guardar posiciones de los nodos"""
    db_manager = DatabaseManager(current_app.config['DATABASE_PATH'])
    persona_repo = PersonaRepository(db_manager)
    
    try:
        if request.method == 'GET':
            # Obtener posiciones
            ids_param = request.args.get('ids', '').strip()
            
            if ids_param:
                try:
                    ids = [int(x) for x in ids_param.split(',') if x.strip().isdigit()]
                except ValueError:
                    return jsonify({'error': 'ids inválidos'}), 400
                
                if not ids:
                    return jsonify({'posiciones': {}})
                
                # Obtener personas específicas
                personas = [persona_repo.get_by_id(pid) for pid in ids]
                personas = [p for p in personas if p and p.posicion_x is not None and p.posicion_y is not None]
            else:
                # Obtener todas las personas con posición
                all_personas = persona_repo.get_all()
                personas = [p for p in all_personas if p.posicion_x is not None and p.posicion_y is not None]
            
            posiciones = {
                p.id: {'x': p.posicion_x, 'y': p.posicion_y}
                for p in personas
            }
            
            return jsonify({'posiciones': posiciones})
        
        # POST: guardar posiciones
        data = request.get_json(silent=True) or {}
        pos = data.get('posiciones', {})
        
        if not isinstance(pos, dict) or not pos:
            return jsonify({'error': 'JSON inválido o vacío'}), 400
        
        # Validar y convertir datos
        valid_positions = {}
        for node_id, xy in pos.items():
            try:
                nid = int(node_id)
                x = float(xy['x'])
                y = float(xy['y'])
                valid_positions[nid] = {'x': x, 'y': y}
            except (ValueError, KeyError, TypeError):
                continue
        
        if valid_positions:
            guardadas = persona_repo.update_positions(valid_positions)
            return jsonify({'success': True, 'guardadas': guardadas})
        else:
            return jsonify({'error': 'No hay posiciones válidas para guardar'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@grafo_bp.route('/grupos', methods=['GET', 'POST'])
def grupos():
    """Obtener/actualizar grupos de personas"""
    db_manager = DatabaseManager(current_app.config['DATABASE_PATH'])
    persona_repo = PersonaRepository(db_manager)
    
    try:
        if request.method == 'GET':
            # Obtener grupos actuales
            personas = persona_repo.get_all()
            grupos_actuales = {
                p.id: {'nombre': p.nombre, 'grupo': p.grupo}
                for p in personas
            }
            
            return jsonify({'success': True, 'grupos': grupos_actuales})
        
        # POST: actualizar grupos
        data = request.get_json()
        if not data or 'updates' not in data:
            return jsonify({'error': 'Datos de actualización no válidos'}), 400
        
        updates = data['updates']
        if not isinstance(updates, list):
            return jsonify({'error': 'Updates debe ser una lista'}), 400
        
        actualizados = persona_repo.update_groups(updates)
        
        return jsonify({
            'success': True,
            'message': f'{actualizados} grupos actualizados exitosamente',
            'actualizados': actualizados
        })
    except Exception as e:
        print(f"❌ Error en grupos: {e}")
        return jsonify({'error': str(e)}), 500
    
@grafo_bp.route('/obtener_grupos_personas', methods=['GET'])
def obtener_grupos_personas():
            """Obtener grupos actuales de todas las personas"""
            return grupos()  # Redirigir a la función grupos existente

@grafo_bp.route('/obtener_imagenes', methods=['GET'])
def obtener_imagenes():
            """Obtener todas las URLs de imágenes"""
            try:
                db_manager = DatabaseManager(current_app.config['DATABASE_PATH'])
                persona_repo = PersonaRepository(db_manager)
                personas = persona_repo.get_all()
                
                imagenes = {
                    p.id: {'nombre': p.nombre, 'imagen_url': p.imagen_url}
                    for p in personas if p.imagen_url
                }
                
                return jsonify({'success': True, 'imagenes': imagenes})
                
            except Exception as e:
                return jsonify({'error': f'Error interno: {str(e)}'}), 500


    
