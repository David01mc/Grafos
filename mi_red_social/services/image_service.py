# services/image_service.py - Servicio corregido para Flask

import os
import uuid
from pathlib import Path
from typing import Tuple, Optional
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from PIL import Image

class ImageService:
    """Servicio para el manejo de imágenes"""
    
    def __init__(self, config):
        print(f"🔧 [DEBUG] Inicializando ImageService con config: {type(config)}")
        
        # CORREGIDO: Manejar tanto objetos Config como diccionarios de Flask
        if hasattr(config, 'get'):  # Es un diccionario (Flask config)
            self.allowed_extensions = config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp'})
            self.max_file_size = config.get('MAX_FILE_SIZE', 5 * 1024 * 1024)
            self.image_size = config.get('IMAGE_SIZE', (150, 150))
            images_folder = config.get('IMAGES_FOLDER', 'static/images/users')
        else:  # Es un objeto Config
            self.allowed_extensions = getattr(config, 'ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp'})
            self.max_file_size = getattr(config, 'MAX_FILE_SIZE', 5 * 1024 * 1024)
            self.image_size = getattr(config, 'IMAGE_SIZE', (150, 150))
            images_folder = getattr(config, 'IMAGES_FOLDER', 'static/images/users')
        
        # Convertir a Path
        if isinstance(images_folder, str):
            self.images_folder = Path(images_folder)
        else:
            self.images_folder = images_folder
        
        print(f"✅ [DEBUG] ImageService configurado:")
        print(f"  - allowed_extensions: {self.allowed_extensions}")
        print(f"  - max_file_size: {self.max_file_size}")
        print(f"  - image_size: {self.image_size}")
        print(f"  - images_folder: {self.images_folder}")
    
    def is_allowed_file(self, filename: str) -> bool:
        """Verificar si el archivo tiene una extensión permitida"""
        return ('.' in filename and 
                filename.rsplit('.', 1)[1].lower() in self.allowed_extensions)
    
    def validate_file(self, file: FileStorage) -> Optional[str]:
        """Validar archivo de imagen"""
        if not file or not file.filename:
            return "No se seleccionó ningún archivo"
        
        if not self.is_allowed_file(file.filename):
            return f"Tipo de archivo no permitido. Permitidos: {', '.join(self.allowed_extensions)}"
        
        # Verificar tamaño
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        print(f"📏 [DEBUG] Tamaño del archivo: {file_size} bytes (max: {self.max_file_size})")
        
        if file_size > self.max_file_size:
            return f"Archivo demasiado grande. Máximo {self.max_file_size // (1024*1024)}MB"
        
        return None
    
    def resize_and_crop_image(self, image: Image.Image) -> Image.Image:
        """Redimensionar y recortar imagen"""
        print(f"🖼️ [DEBUG] Redimensionando imagen de {image.size} a {self.image_size}")
        
        # Convertir a RGB si es necesario
        if image.mode in ('RGBA', 'LA', 'P'):
            print(f"🔄 [DEBUG] Convirtiendo de {image.mode} a RGB")
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
            print(f"🔄 [DEBUG] Imagen centrada en {self.image_size}")
        
        return image
    
    def save_image(self, file: FileStorage, persona_id: int) -> Tuple[Optional[str], Optional[str]]:
        """Guardar archivo de imagen procesado"""
        print(f"💾 [DEBUG] Guardando imagen para persona {persona_id}")
        
        # Validar archivo
        error = self.validate_file(file)
        if error:
            print(f"❌ [DEBUG] Validación falló: {error}")
            return None, error
        
        try:
            # Crear directorio si no existe
            print(f"📁 [DEBUG] Creando directorio: {self.images_folder}")
            self.images_folder.mkdir(parents=True, exist_ok=True)
            
            # Generar nombre único
            file_extension = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            filename = f"user_{persona_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            filepath = self.images_folder / filename
            
            print(f"📝 [DEBUG] Nombre de archivo generado: {filename}")
            print(f"📍 [DEBUG] Ruta completa: {filepath}")
            
            # Procesar imagen
            print("🖼️ [DEBUG] Abriendo imagen con PIL...")
            image = Image.open(file.stream)
            print(f"✅ [DEBUG] Imagen abierta: {image.format}, {image.size}, {image.mode}")
            
            processed_image = self.resize_and_crop_image(image)
            
            # Guardar imagen procesada
            print(f"💾 [DEBUG] Guardando imagen procesada en: {filepath}")
            processed_image.save(filepath, quality=85, optimize=True)
            
            # Verificar que se guardó
            if filepath.exists():
                file_size = filepath.stat().st_size
                print(f"✅ [DEBUG] Imagen guardada exitosamente, tamaño: {file_size} bytes")
            else:
                print("❌ [DEBUG] La imagen no se guardó correctamente")
                return None, "Error: La imagen no se guardó"
            
            # Retornar ruta relativa
            relative_path = f"static/images/users/{filename}"
            print(f"📍 [DEBUG] Ruta relativa: {relative_path}")
            
            return relative_path, None
            
        except Exception as e:
            print(f"❌ [DEBUG] Excepción guardando imagen: {str(e)}")
            import traceback
            print(f"🔍 [DEBUG] Traceback completo: {traceback.format_exc()}")
            return None, f"Error procesando imagen: {str(e)}"
    
    def delete_image(self, image_path: str) -> bool:
        """Eliminar archivo de imagen"""
        if not image_path:
            return True
        
        try:
            print(f"🗑️ [DEBUG] Eliminando imagen: {image_path}")
            
            # Construir ruta absoluta desde la ruta relativa
            if image_path.startswith('static/'):
                full_path = Path(__file__).parent.parent / image_path
            else:
                full_path = Path(image_path)
            
            print(f"📍 [DEBUG] Ruta completa para eliminar: {full_path}")
            
            if full_path.exists():
                full_path.unlink()
                print(f"✅ [DEBUG] Imagen eliminada exitosamente")
                return True
            else:
                print(f"⚠️ [DEBUG] Archivo no existe: {full_path}")
                return True  # No es un error si el archivo ya no existe
                
        except Exception as e:
            print(f"❌ [DEBUG] Error eliminando imagen: {e}")
            return False