# =================================================================
# api/__init__.py - Registro de blueprints
# =================================================================

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
    
    # ✅ RUTAS DE COMPATIBILIDAD - SIN PREFIJO PARA JAVASCRIPT EXISTENTE
    
    @app.route('/obtener_grupos_personas')
    def obtener_grupos_personas_compat():
        from api.grafo import obtener_grupos_personas
        return obtener_grupos_personas()
    
    @app.route('/obtener_imagenes')
    def obtener_imagenes_compat():
        from api.grafo import obtener_imagenes
        return obtener_imagenes()
    
    @app.route('/obtener_posiciones')
    def obtener_posiciones_compat():
        from api.grafo import posiciones
        return posiciones()
    
    @app.route('/guardar_posiciones', methods=['POST'])
    def guardar_posiciones_compat():
        from api.grafo import posiciones
        return posiciones()
    
    @app.route('/actualizar_grupos', methods=['POST'])
    def actualizar_grupos_compat():
        from api.grafo import grupos
        return grupos()
    
    # ✅ RUTAS ADICIONALES PARA COMPATIBILIDAD CON FORMULARIOS HTML
    @app.route('/agregar_persona', methods=['POST'])
    def agregar_persona_compat():
        from api.personas import agregar_persona
        return agregar_persona()
    
    @app.route('/agregar_relacion', methods=['POST'])  
    def agregar_relacion_compat():
        from api.relaciones import agregar_relacion
        return agregar_relacion()
    
    @app.route('/eliminar_persona/<int:persona_id>')
    def eliminar_persona_compat(persona_id):
        from api.personas import eliminar_persona
        return eliminar_persona(persona_id)
    
    @app.route('/eliminar_relacion/<int:relacion_id>')
    def eliminar_relacion_compat(relacion_id):
        from api.relaciones import eliminar_relacion
        return eliminar_relacion(relacion_id)
    
    # Ruta adicional para API del grafo
    @app.route('/api_grafo')
    def api_grafo_compat():
        from api.grafo import api_grafo
        return api_grafo()
    
    print("✅ Todas las rutas de compatibilidad registradas")
