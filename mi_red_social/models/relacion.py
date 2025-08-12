# =================================================================
# models/relacion.py - Modelo Relación
# =================================================================

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from models.database import DatabaseManager

@dataclass
class Relacion:
    """Modelo de datos para Relación"""
    id: Optional[int] = None
    persona1_id: int = 0
    persona2_id: int = 0
    tipo: str = "profesional"
    fortaleza: int = 5
    contexto: str = ""
    fecha_creacion: Optional[str] = None
    persona1_nombre: Optional[str] = None
    persona2_nombre: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            'id': self.id,
            'persona1_id': self.persona1_id,
            'persona2_id': self.persona2_id,
            'tipo': self.tipo,
            'fortaleza': self.fortaleza,
            'contexto': self.contexto,
            'fecha_creacion': self.fecha_creacion,
            'persona1_nombre': self.persona1_nombre,
            'persona2_nombre': self.persona2_nombre
        }
    
    @classmethod
    def from_row(cls, row: Any) -> 'Relacion':
        """Crear instancia desde fila de base de datos - VERSIÓN SEGURA"""
        if not row:
            return cls()
        
        try:
            return cls(
                id=row['id'],
                persona1_id=row['persona1_id'] or 0,
                persona2_id=row['persona2_id'] or 0,
                tipo=row['tipo'] or "profesional",
                fortaleza=row['fortaleza'] or 5,
                contexto=row['contexto'] or "",
                fecha_creacion=row['fecha_creacion'],
                # Para las consultas con JOIN, usar acceso directo con manejo de errores
                persona1_nombre=row['persona1_nombre'] if 'persona1_nombre' in row.keys() else None,
                persona2_nombre=row['persona2_nombre'] if 'persona2_nombre' in row.keys() else None
            )
        except (KeyError, TypeError) as e:
            print(f"⚠️ Error creando Relación desde row: {e}")
            return cls()

class RelacionRepository:
    """Repositorio para operaciones con Relaciones"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def get_all_with_names(self) -> List[Relacion]:
        """Obtener todas las relaciones con nombres de personas"""
        rows = self.db.execute_query('''
            SELECT r.*, p1.nombre as persona1_nombre, p2.nombre as persona2_nombre
            FROM relaciones r
            JOIN personas p1 ON r.persona1_id = p1.id
            JOIN personas p2 ON r.persona2_id = p2.id
            ORDER BY r.fecha_creacion DESC
        ''')
        return [Relacion.from_row(row) for row in rows]
    
    def get_by_id(self, relacion_id: int) -> Optional[Relacion]:
        """Obtener relación por ID"""
        row = self.db.execute_single('SELECT * FROM relaciones WHERE id = ?', (relacion_id,))
        return Relacion.from_row(row) if row else None
    
    def create(self, relacion: Relacion) -> int:
        """Crear nueva relación"""
        return self.db.execute_insert('''
            INSERT INTO relaciones (persona1_id, persona2_id, tipo, fortaleza, contexto)
            VALUES (?, ?, ?, ?, ?)
        ''', (relacion.persona1_id, relacion.persona2_id, relacion.tipo, 
              relacion.fortaleza, relacion.contexto))
    
    def delete(self, relacion_id: int) -> bool:
        """Eliminar relación"""
        affected = self.db.execute_update('DELETE FROM relaciones WHERE id = ?', (relacion_id,))
        return affected > 0
    
    def delete_by_persona(self, persona_id: int) -> int:
        """Eliminar todas las relaciones de una persona"""
        affected = self.db.execute_update(
            'DELETE FROM relaciones WHERE persona1_id = ? OR persona2_id = ?',
            (persona_id, persona_id)
        )
        return affected