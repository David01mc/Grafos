# 🌐 Mi Red Social - Sistema de Grafos Interactivo

## 🚀 Instalación y Uso

### 1. Requisitos
- Python 3.7 o superior
- Flask (se instala automáticamente)

### 2. Instalación
```bash
# Ejecutar el script de setup
python setup.py

# O manualmente:
pip install flask
python app.py
```

### 3. Uso
1. Abre tu navegador en: http://localhost:5000
2. Ve al panel de administración: http://localhost:5000/admin
3. Agrega personas y relaciones
4. Visualiza tu red social interactiva

## 📊 Funcionalidades

### Grafo Interactivo
- 🎯 Visualización en tiempo real
- 🖱️ Arrastrar y reorganizar nodos
- 🔍 Zoom y navegación
- 📊 Estadísticas automáticas
- 🎨 Colores por grupos sociales

### Panel de Administración
- ➕ Agregar personas con emojis y colores
- 🔗 Crear relaciones con diferentes tipos y fortalezas
- 🗑️ Eliminar personas y relaciones
- 📋 Ver listas completas de datos

### Base de Datos
- 💾 SQLite local (sin configuración)
- 🔄 Persistencia automática
- 📈 Escalable para cientos de personas

## 🎮 Controles del Grafo

- **Arrastrar**: Mueve nodos
- **Rueda del ratón**: Zoom in/out
- **Click en nodo**: Ver información
- **Hover en conexión**: Ver detalles de relación
- **Botones**: Centrar, física, aleatorio, recargar

## 🛠️ Estructura del Proyecto

```
mi_red_social/
├── app.py              # Servidor Flask principal
├── red_social.db       # Base de datos SQLite
├── templates/
│   ├── base.html       # Plantilla base
│   ├── index.html      # Página del grafo
│   └── admin.html      # Panel de administración
└── README.md           # Este archivo
```

---
Creado con ❤️ usando Python, Flask, SQLite y vis.js
