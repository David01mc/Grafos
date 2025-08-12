# =================================================================
# services/graph_service.py - Servicio de lógica del grafo
# =================================================================

from typing import Dict, List, Any
from models.persona import PersonaRepository
from models.relacion import RelacionRepository

class GraphService:
    """Servicio para la lógica del grafo"""
    
    def __init__(self, persona_repo: PersonaRepository, relacion_repo: RelacionRepository):
        self.persona_repo = persona_repo
        self.relacion_repo = relacion_repo
    
    def get_graph_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Obtener datos del grafo para vis.js"""
        personas = self.persona_repo.get_all()
        relaciones = self.relacion_repo.get_all_with_names()
        
        # Formatear nodos
        nodes = []
        for persona in personas:
            size = 50 if 'Usuario Principal' in persona.nombre else 30
            
            node_data = {
                'id': persona.id,
                'label': persona.nombre,
                'color': persona.color,
                'size': size,
                'grupo': persona.grupo
            }
            
            # Configurar imagen o forma por defecto
            if persona.imagen_url:
                node_data.update({
                    'shape': 'image',
                    'image': persona.imagen_url,
                    'size': 80,
                    'borderWidth': 3,
                    'borderWidthSelected': 5,
                    'color': {
                        'border': persona.color,
                        'background': 'white'
                    }
                })
            else:
                node_data.update({
                    'shape': 'dot',
                    'borderWidth': 2
                })
            
            # Agregar posiciones si existen
            if persona.posicion_x is not None and persona.posicion_y is not None:
                node_data.update({
                    'x': float(persona.posicion_x),
                    'y': float(persona.posicion_y),
                    'physics': True
                })
            else:
                node_data['physics'] = True
            
            nodes.append(node_data)
        
        # Formatear aristas
        edges = []
        for relacion in relaciones:
            color = self._get_edge_color(relacion.fortaleza)
            edges.append({
                'from': relacion.persona1_id,
                'to': relacion.persona2_id,
                'width': relacion.fortaleza,
                'color': color,
                'label': relacion.tipo.replace('_', ' ').title(),
                'title': self._get_edge_tooltip(relacion)
            })
        
        return {'nodes': nodes, 'edges': edges}
    
    def _get_edge_color(self, fortaleza: int) -> str:
        """Obtener color del edge basado en la fortaleza"""
        if fortaleza >= 8:
            return '#10b981'  # Verde
        elif fortaleza >= 6:
            return '#f59e0b'  # Amarillo
        else:
            return '#6b7280'  # Gris
    
    def _get_edge_tooltip(self, relacion) -> str:
        """Generar tooltip para el edge"""
        return (f"<b>{relacion.persona1_nombre} ↔ {relacion.persona2_nombre}</b><br>"
                f"Tipo: {relacion.tipo.replace('_', ' ').title()}<br>"
                f"Fortaleza: {relacion.fortaleza}/10<br>"
                f"Contexto: {relacion.contexto or 'Sin contexto'}")