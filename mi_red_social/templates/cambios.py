#!/usr/bin/env python3
"""
Script para corregir los url_for en los templates HTML
Ejecutar desde la raíz del proyecto: python fix_templates.py
"""

import os
import re
from pathlib import Path

def fix_url_for_in_file(file_path):
    """Corregir url_for en un archivo específico"""
    print(f"📝 Procesando: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Mapeo de reemplazos exactos
    replacements = {
        # Páginas principales
        'url_for(\'index\')': 'url_for(\'main.index\')',
        'url_for("index")': 'url_for("main.index")',
        'url_for(\'admin\')': 'url_for(\'main.admin\')',
        'url_for("admin")': 'url_for("main.admin")',
        'url_for(\'debug\')': 'url_for(\'main.debug\')',
        'url_for("debug")': 'url_for("main.debug")',
        
        # APIs de personas
        'url_for(\'agregar_persona\')': 'url_for(\'personas.agregar_persona\')',
        'url_for("agregar_persona")': 'url_for("personas.agregar_persona")',
        'url_for(\'eliminar_persona\'': 'url_for(\'personas.eliminar_persona\'',
        'url_for("eliminar_persona"': 'url_for("personas.eliminar_persona"',
        'url_for(\'subir_imagen\'': 'url_for(\'personas.subir_imagen\'',
        'url_for("subir_imagen"': 'url_for("personas.subir_imagen"',
        'url_for(\'eliminar_imagen\'': 'url_for(\'personas.eliminar_imagen\'',
        'url_for("eliminar_imagen"': 'url_for("personas.eliminar_imagen"',
        
        # APIs de relaciones
        'url_for(\'agregar_relacion\')': 'url_for(\'relaciones.agregar_relacion\')',
        'url_for("agregar_relacion")': 'url_for("relaciones.agregar_relacion")',
        'url_for(\'eliminar_relacion\'': 'url_for(\'relaciones.eliminar_relacion\'',
        'url_for("eliminar_relacion"': 'url_for("relaciones.eliminar_relacion"',
        
        # APIs del grafo
        'url_for(\'api_grafo\')': 'url_for(\'grafo.api_grafo\')',
        'url_for("api_grafo")': 'url_for("grafo.api_grafo")',
        'url_for(\'posiciones\')': 'url_for(\'grafo.posiciones\')',
        'url_for("posiciones")': 'url_for("grafo.posiciones")',
        'url_for(\'grupos\')': 'url_for(\'grafo.grupos\')',
        'url_for("grupos")': 'url_for("grafo.grupos")',
    }
    
    # Aplicar reemplazos
    changes_made = 0
    for old, new in replacements.items():
        if old in content:
            content = content.replace(old, new)
            changes_made += 1
            print(f"  ✅ {old} → {new}")
    
    # Escribir archivo solo si hubo cambios
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  💾 Archivo actualizado ({changes_made} cambios)")
        return True
    else:
        print(f"  ℹ️ No se necesitaron cambios")
        return False

def main():
    """Función principal"""
    print("🔧 Iniciando corrección de templates...")
    print("=" * 50)
    
    # Buscar directorio de templates
    templates_dir = Path('.')
    
    if not templates_dir.exists():
        print("❌ No se encontró el directorio 'templates'")
        print("   Asegúrate de ejecutar este script desde la raíz del proyecto")
        return
    
    # Procesar todos los archivos HTML
    html_files = list(templates_dir.glob('*.html'))
    
    if not html_files:
        print("❌ No se encontraron archivos HTML en templates/")
        return
    
    print(f"📁 Encontrados {len(html_files)} archivos HTML")
    print()
    
    files_changed = 0
    total_files = 0
    
    for html_file in html_files:
        total_files += 1
        if fix_url_for_in_file(html_file):
            files_changed += 1
        print()
    
    print("=" * 50)
    print(f"✅ Proceso completado!")
    print(f"   📊 Archivos procesados: {total_files}")
    print(f"   🔄 Archivos modificados: {files_changed}")
    print(f"   ✨ Archivos sin cambios: {total_files - files_changed}")
    
    if files_changed > 0:
        print()
        print("🚀 Cambios aplicados exitosamente!")
        print("   Ahora puedes ejecutar tu aplicación Flask")
        print("   python app.py")
    else:
        print()
        print("ℹ️ No se necesitaron cambios en los templates")

if __name__ == '__main__':
    main()