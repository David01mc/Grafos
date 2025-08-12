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