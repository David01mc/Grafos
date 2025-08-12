# =================================================================
# models/persona.py - Modelo Persona
# =================================================================

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from models.database import DatabaseManager

@dataclass
class Persona:
    """Modelo de datos para Persona"""
    id: Optional[int] = None
    nombre: str = ""
    icono: str = "user"
    grupo: str = "contactos"
    color: str = "#3b82f6"
    descripcion: str = ""
    posicion_x: Optional[float] = None
    posicion_y: Optional[float] = None
    imagen_url: Optional[str] = None
    fecha_creacion: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            'id': self.id,
            'nombre': self.nombre,
            'icono': self.icono,
            'grupo': self.grupo,
            'color': self.color,
            'descripcion': self.descripcion,
            'posicion_x': self.posicion_x,
            'posicion_y': self.posicion_y,
            'imagen_url': self.imagen_url,
            'fecha_creacion': self.fecha_creacion
        }
    
    @classmethod
    def from_row(cls, row: Any) -> 'Persona':
        """Crear instancia desde fila de base de datos"""
        return cls(
            id=row['id'] if row else None,
            nombre=row['nombre'] if row else "",
            icono=row['icono'] if row else "user",
            grupo=row['grupo'] if row else "contactos",
            color=row['color'] if row else "#3b82f6",
            descripcion=row['descripcion'] if row else "",
            posicion_x=row['posicion_x'] if row and row['posicion_x'] is not None else None,
            posicion_y=row['posicion_y'] if row and row['posicion_y'] is not None else None,
            imagen_url=row['imagen_url'] if row else None,
            fecha_creacion=row['fecha_creacion'] if row else None
        )

class PersonaRepository:
    """Repositorio para operaciones con Personas"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def get_all(self) -> List[Persona]:
        """Obtener todas las personas"""
        rows = self.db.execute_query('SELECT * FROM personas ORDER BY nombre')
        return [Persona.from_row(row) for row in rows]
    
    def get_by_id(self, persona_id: int) -> Optional[Persona]:
        """Obtener persona por ID"""
        row = self.db.execute_single('SELECT * FROM personas WHERE id = ?', (persona_id,))
        return Persona.from_row(row) if row else None
    
    def create(self, persona: Persona) -> int:
        """Crear nueva persona"""
        return self.db.execute_insert('''
            INSERT INTO personas (nombre, icono, grupo, color, descripcion)
            VALUES (?, ?, ?, ?, ?)
        ''', (persona.nombre, persona.icono, persona.grupo, persona.color, persona.descripcion))
    
    def update(self, persona: Persona) -> bool:
        """Actualizar persona"""
        affected = self.db.execute_update('''
            UPDATE personas 
            SET nombre = ?, icono = ?, grupo = ?, color = ?, descripcion = ?, 
                posicion_x = ?, posicion_y = ?, imagen_url = ?
            WHERE id = ?
        ''', (persona.nombre, persona.icono, persona.grupo, persona.color, 
              persona.descripcion, persona.posicion_x, persona.posicion_y, 
              persona.imagen_url, persona.id))
        return affected > 0
    
    def delete(self, persona_id: int) -> bool:
        """Eliminar persona"""
        affected = self.db.execute_update('DELETE FROM personas WHERE id = ?', (persona_id,))
        return affected > 0
    
    def update_positions(self, positions: Dict[int, Dict[str, float]]) -> int:
        """Actualizar posiciones de múltiples personas"""
        params = [(pos['x'], pos['y'], node_id) for node_id, pos in positions.items()]
        self.db.execute_many('UPDATE personas SET posicion_x = ?, posicion_y = ? WHERE id = ?', params)
        return len(params)
    
    def update_groups(self, updates: List[Dict[str, Any]]) -> int:
        """Actualizar grupos de múltiples personas"""
        params = [(update['grupo'], update['id']) for update in updates if 'id' in update]
        self.db.execute_many('UPDATE personas SET grupo = ? WHERE id = ?', params)
        return len(params)
    
    def update_image(self, persona_id: int, image_url: Optional[str]) -> bool:
        """Actualizar imagen de persona"""
        affected = self.db.execute_update(
            'UPDATE personas SET imagen_url = ? WHERE id = ?',
            (image_url, persona_id)
        )
        return affected > 0