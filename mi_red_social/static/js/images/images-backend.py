# static/js/images-backend.py
# Sistema de gestión de imágenes para nodos - Endpoints Flask

import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
import base64
from io import BytesIO
from flask import request, jsonify, current_app

# Configuración de imágenes
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
IMAGE_SIZE = (150, 150)  # Tamaño estándar para nodos
IMAGES_FOLDER = 'static/images/users'

def allowed_file(filename):
    """Verificar si el archivo tiene una extensión permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_images_directory():
    """Crear directorio de imágenes si no existe"""
    images_path = os.path.join(current_app.root_path, IMAGES_FOLDER)
    os.makedirs(images_path, exist_ok=True)
    return images_path

def resize_and_crop_image(image, size=IMAGE_SIZE):
    """Redimensionar y recortar imagen para hacerla circular"""
    # Convertir a RGB si es necesario
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    # Redimensionar manteniendo aspecto
    image.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Crear imagen cuadrada con relleno si es necesario
    if image.size != size:
        background = Image.new('RGB', size, (255, 255, 255))
        offset = ((size[0] - image.size[0]) // 2, (size[1] - image.size[1]) // 2)
        background.paste(image, offset)
        image = background
    
    return image

def save_image_file(file, persona_id):
    """Guardar archivo de imagen procesado"""
    if not file or not allowed_file(file.filename):
        return None, "Tipo de archivo no permitido"
    
    try:
        # Verificar tamaño del archivo
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return None, f"Archivo demasiado grande. Máximo {MAX_FILE_SIZE // (1024*1024)}MB"
        
        # Crear directorio si no existe
        images_path = create_images_directory()
        
        # Generar nombre único para el archivo
        file_extension = secure_filename(file.filename).rsplit('.', 1)[1].lower()
        filename = f"user_{persona_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        filepath = os.path.join(images_path, filename)
        
        # Procesar imagen
        image = Image.open(file.stream)
        processed_image = resize_and_crop_image(image)
        
        # Guardar imagen procesada
        processed_image.save(filepath, quality=85, optimize=True)
        
        # Retornar ruta relativa para la base de datos
        relative_path = f"{IMAGES_FOLDER}/{filename}"
        return relative_path, None
        
    except Exception as e:
        return None, f"Error procesando imagen: {str(e)}"

def delete_image_file(image_path):
    """Eliminar archivo de imagen"""
    if not image_path:
        return True
    
    try:
        full_path = os.path.join(current_app.root_path, image_path)
        if os.path.exists(full_path):
            os.remove(full_path)
        return True
    except Exception as e:
        print(f"Error eliminando imagen: {e}")
        return False

# Agregar estas rutas a app.py

@app.route('/subir_imagen/<int:persona_id>', methods=['POST'])
def subir_imagen(persona_id):
    """Subir imagen para una persona"""
    try:
        # Verificar que la persona existe
        conn = get_db_connection()
        persona = conn.execute('SELECT * FROM personas WHERE id = ?', (persona_id,)).fetchone()
        
        if not persona:
            conn.close()
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        # Verificar que se envió un archivo
        if 'imagen' not in request.files:
            conn.close()
            return jsonify({'error': 'No se envió ningún archivo'}), 400
        
        file = request.files['imagen']
        if file.filename == '':
            conn.close()
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        # Eliminar imagen anterior si existe
        if persona['imagen_url']:
            delete_image_file(persona['imagen_url'])
        
        # Guardar nueva imagen
        image_path, error = save_image_file(file, persona_id)
        
        if error:
            conn.close()
            return jsonify({'error': error}), 400
        
        # Actualizar base de datos
        conn.execute(
            'UPDATE personas SET imagen_url = ? WHERE id = ?',
            (image_path, persona_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Imagen subida exitosamente',
            'imagen_url': image_path,
            'persona_id': persona_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@app.route('/eliminar_imagen/<int:persona_id>', methods=['DELETE'])
def eliminar_imagen(persona_id):
    """Eliminar imagen de una persona"""
    try:
        conn = get_db_connection()
        persona = conn.execute('SELECT * FROM personas WHERE id = ?', (persona_id,)).fetchone()
        
        if not persona:
            conn.close()
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        # Eliminar archivo de imagen
        if persona['imagen_url']:
            delete_image_file(persona['imagen_url'])
        
        # Actualizar base de datos
        conn.execute(
            'UPDATE personas SET imagen_url = NULL WHERE id = ?',
            (persona_id,)
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Imagen eliminada exitosamente',
            'persona_id': persona_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

@app.route('/obtener_imagenes', methods=['GET'])
def obtener_imagenes():
    """Obtener todas las URLs de imágenes"""
    try:
        conn = get_db_connection()
        personas = conn.execute(
            'SELECT id, nombre, imagen_url FROM personas WHERE imagen_url IS NOT NULL'
        ).fetchall()
        conn.close()
        
        imagenes = {}
        for persona in personas:
            imagenes[persona['id']] = {
                'nombre': persona['nombre'],
                'imagen_url': persona['imagen_url']
            }
        
        return jsonify({
            'success': True,
            'imagenes': imagenes
        })
        
    except Exception as e:
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

# Modificar la función init_db() para agregar el campo imagen_url
def init_db_with_images():
    """Inicializar la base de datos con soporte para imágenes"""
    print("🔧 Inicializando base de datos con soporte para imágenes...")
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Verificar si la columna imagen_url existe
    cursor.execute("PRAGMA table_info(personas)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'imagen_url' not in columns:
        print("➕ Agregando columna imagen_url a la tabla personas...")
        cursor.execute('ALTER TABLE personas ADD COLUMN imagen_url TEXT')
        conn.commit()
        print("✅ Columna imagen_url agregada exitosamente")
    else:
        print("✅ La columna imagen_url ya existe")
    
    conn.close()
    
    # Crear directorio de imágenes
    create_images_directory()
    print("✅ Directorio de imágenes configurado")

# Llamar esta función al inicio de la aplicación
# init_db_with_images()