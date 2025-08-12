# api/__init__.py - Registro de blueprints con rutas de imágenes

from flask import Flask
from api.personas import personas_bp
from api.relaciones import relaciones_bp
from api.grafo import grafo_bp
from api.main import main_bp

def register_blueprints(app: Flask) -> None:
    """Registrar todos los blueprints"""
    app.register_blueprint(main_bp)
    app.register_blueprint(grafo_bp, url_prefix='/api')
    app.register_blueprint(personas_bp, url_prefix='/api')
    app.register_blueprint(relaciones_bp, url_prefix='/api')
    
    # AGREGAR: Rutas de compatibilidad para imágenes directamente en la app
    @app.route('/subir_imagen/<int:persona_id>', methods=['POST'])
    def subir_imagen_compat(persona_id):
        """Ruta de compatibilidad para subir imagen"""
        # Importar la función desde el blueprint
        from api.personas import subir_imagen
        return subir_imagen(persona_id)
    
    @app.route('/eliminar_imagen/<int:persona_id>', methods=['DELETE'])  
    def eliminar_imagen_compat(persona_id):
        """Ruta de compatibilidad para eliminar imagen"""
        from api.personas import eliminar_imagen
        return eliminar_imagen(persona_id)
    
    @app.route('/obtener_imagenes', methods=['GET'])
    def obtener_imagenes_compat():
        """Ruta de compatibilidad para obtener imágenes"""
        from api.personas import obtener_imagenes
        return obtener_imagenes()
    
    print("✅ Blueprints y rutas de compatibilidad registrados")
    print("🖼️ Rutas de imágenes disponibles:")
    print("   - POST /subir_imagen/<id>")
    print("   - DELETE /eliminar_imagen/<id>") 
    print("   - GET /obtener_imagenes")
    print("   - POST /api/personas/<id>/imagen")
    print("   - DELETE /api/personas/<id>/imagen")