# =================================================================
# services/image_service.py - Servicio de manejo de imágenes
# =================================================================

import os
import uuid
from pathlib import Path
from typing import Tuple, Optional
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from PIL import Image
from config import Config

class ImageService:
    """Servicio para el manejo de imágenes"""
    
    def __init__(self, config: Config):
        self.allowed_extensions = config.ALLOWED_EXTENSIONS
        self.max_file_size = config.MAX_FILE_SIZE
        self.image_size = config.IMAGE_SIZE
        self.images_folder = config.IMAGES_FOLDER
    
    def is_allowed_file(self, filename: str) -> bool:
        """Verificar si el archivo tiene una extensión permitida"""
        return ('.' in filename and 
                filename.rsplit('.', 1)[1].lower() in self.allowed_extensions)
    
    def validate_file(self, file: FileStorage) -> Optional[str]:
        """Validar archivo de imagen"""
        if not file or not file.filename:
            return "No se seleccionó ningún archivo"
        
        if not self.is_allowed_file(file.filename):
            return "Tipo de archivo no permitido"
        
        # Verificar tamaño
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > self.max_file_size:
            return f"Archivo demasiado grande. Máximo {self.max_file_size // (1024*1024)}MB"
        
        return None
    
    def resize_and_crop_image(self, image: Image.Image) -> Image.Image:
        """Redimensionar y recortar imagen"""
        # Convertir a RGB si es necesario
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Redimensionar manteniendo aspecto
        image.thumbnail(self.image_size, Image.Resampling.LANCZOS)
        
        # Crear imagen cuadrada con relleno si es necesario
        if image.size != self.image_size:
            background = Image.new('RGB', self.image_size, (255, 255, 255))
            offset = ((self.image_size[0] - image.size[0]) // 2, 
                     (self.image_size[1] - image.size[1]) // 2)
            background.paste(image, offset)
            image = background
        
        return image
    
    def save_image(self, file: FileStorage, persona_id: int) -> Tuple[Optional[str], Optional[str]]:
        """Guardar archivo de imagen procesado"""
        # Validar archivo
        error = self.validate_file(file)
        if error:
            return None, error
        
        try:
            # Crear directorio si no existe
            self.images_folder.mkdir(parents=True, exist_ok=True)
            
            # Generar nombre único
            file_extension = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            filename = f"user_{persona_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            filepath = self.images_folder / filename
            
            # Procesar imagen
            image = Image.open(file.stream)
            processed_image = self.resize_and_crop_image(image)
            
            # Guardar imagen procesada
            processed_image.save(filepath, quality=85, optimize=True)
            
            # Retornar ruta relativa
            relative_path = f"static/images/users/{filename}"
            return relative_path, None
            
        except Exception as e:
            return None, f"Error procesando imagen: {str(e)}"
    
    def delete_image(self, image_path: str) -> bool:
        """Eliminar archivo de imagen"""
        if not image_path:
            return True
        
        try:
            # Construir ruta absoluta desde la ruta relativa
            if image_path.startswith('static/'):
                full_path = Path(__file__).parent.parent / image_path
            else:
                full_path = Path(image_path)
            
            if full_path.exists():
                full_path.unlink()
            return True
        except Exception as e:
            print(f"Error eliminando imagen: {e}")
            return False