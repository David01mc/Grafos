# =================================================================
# services/data_service.py - Servicio de operaciones de datos
# =================================================================

from typing import Dict, List, Any, Optional, Tuple
from models.persona import PersonaRepository, Persona
from models.relacion import RelacionRepository, Relacion
from services.image_service import ImageService

class DataService:
    """Servicio para operaciones de datos complejas"""
    
    def __init__(self, persona_repo: PersonaRepository, relacion_repo: RelacionRepository, 
                 image_service: ImageService):
        self.persona_repo = persona_repo
        self.relacion_repo = relacion_repo
        self.image_service = image_service
    
    def create_persona_with_validation(self, data: Dict[str, Any]) -> Tuple[bool, str, Optional[int]]:
        """Crear persona con validación"""
        try:
            persona = Persona(
                nombre=data.get('nombre', '').strip(),
                icono=data.get('icono', 'user'),
                grupo=data.get('grupo', 'contactos'),
                color=data.get('color', '#3b82f6'),
                descripcion=data.get('descripcion', '')
            )
            
            if not persona.nombre:
                return False, "El nombre es requerido", None
            
            persona_id = self.persona_repo.create(persona)
            return True, f'Persona "{persona.nombre}" agregada exitosamente', persona_id
            
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                return False, f'Ya existe un contacto llamado "{data.get("nombre", "")}"', None
            return False, f'Error interno: {str(e)}', None
    
    def create_relacion_with_validation(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """Crear relación con validación"""
        try:
            persona1_id = int(data.get('persona1_id', 0))
            persona2_id = int(data.get('persona2_id', 0))
            
            if persona1_id == persona2_id:
                return False, "No puedes crear una relación de un contacto consigo mismo"
            
            relacion = Relacion(
                persona1_id=persona1_id,
                persona2_id=persona2_id,
                tipo=data.get('tipo', 'profesional'),
                fortaleza=int(data.get('fortaleza', 5)),
                contexto=data.get('contexto', '')
            )
            
            self.relacion_repo.create(relacion)
            return True, "Relación agregada exitosamente"
            
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                return False, "Ya existe una relación entre estos contactos"
            return False, f'Error interno: {str(e)}'
    
    def delete_persona_with_cleanup(self, persona_id: int) -> Tuple[bool, str]:
        """Eliminar persona y limpiar relaciones e imágenes"""
        try:
            persona = self.persona_repo.get_by_id(persona_id)
            if not persona:
                return False, "Persona no encontrada"
            
            # Eliminar imagen si existe
            if persona.imagen_url:
                self.image_service.delete_image(persona.imagen_url)
            
            # Eliminar relaciones asociadas
            self.relacion_repo.delete_by_persona(persona_id)
            
            # Eliminar persona
            self.persona_repo.delete(persona_id)
            
            return True, f'Contacto "{persona.nombre}" eliminado exitosamente'
            
        except Exception as e:
            return False, f'Error eliminando persona: {str(e)}'
    
    def get_admin_data(self) -> Dict[str, Any]:
        """Obtener todos los datos para el panel de administración"""
        return {
            'personas': [p.to_dict() for p in self.persona_repo.get_all()],
            'relaciones': [r.to_dict() for r in self.relacion_repo.get_all_with_names()]
        }
    
    def get_debug_info(self) -> Dict[str, Any]:
        """Obtener información de debug"""
        personas = self.persona_repo.get_all()
        relaciones = self.relacion_repo.get_all_with_names()
        
        return {
            'personas_count': len(personas),
            'relaciones_count': len(relaciones),
            'personas': [p.to_dict() for p in personas],
            'relaciones': [r.to_dict() for r in relaciones]
        }