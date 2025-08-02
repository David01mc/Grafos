// static/js/group-bubbles.js - Sistema de burbujas de grupos COMPLETO Y FUNCIONAL

let gruposBurbujas = {};
let burbujasActivas = true;
let opacidadBurbujas = 0.15;
let coloresGrupos = {};

// ========== FUNCIONES AUXILIARES ==========

// Función para crear SVG de forma robusta - CON TRANSFORMACIÓN EN TIEMPO REAL
function crearSVGRobusto(container) {
    // Eliminar SVG anterior si existe
    const svgAnterior = container.querySelector('.burbujas-svg');
    if (svgAnterior) {
        svgAnterior.remove();
        console.log('🧹 SVG anterior eliminado');
    }
    
    // Obtener dimensiones reales del contenedor
    const rect = container.getBoundingClientRect();
    
    // Crear nuevo SVG con configuración robusta Y limitado al contenedor
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('burbujas-svg');
    svg.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 1 !important;
        overflow: hidden !important;
        clip-path: inset(0) !important;
    `;
    
    // Establecer viewBox para que coincida con el contenedor
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Crear grupo principal que contendrá todas las burbujas
    const grupoTransformable = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grupoTransformable.classList.add('grupo-burbujas-transformable');
    svg.appendChild(grupoTransformable);
    
    // Insertar SVG al inicio del contenedor para mejor compatibilidad
    container.insertBefore(svg, container.firstChild);
    console.log('✅ SVG robusto creado con grupo transformable');
    
    return svg;
}

// Función para crear círculo para un solo nodo - COORDENADAS FIJAS AL GRAFO
function crearCirculoGrupoFijo(grupoSvg, posicion, nombreGrupo, color) {
    // Usar coordenadas directas del grafo
    const radius = 60; // Radio fijo en coordenadas del grafo
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', posicion.x);
    circle.setAttribute('cy', posicion.y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', opacidadBurbujas);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '3');
    circle.setAttribute('stroke-dasharray', '10,10');
    circle.setAttribute('stroke-opacity', '0.8');
    circle.classList.add('burbuja-grupo');
    circle.setAttribute('data-grupo', nombreGrupo);
    
    grupoSvg.appendChild(circle);
    
    // Crear etiqueta
    crearEtiquetaGrupoFija(grupoSvg, posicion.x, posicion.y - radius - 20, nombreGrupo, color);
}

// Función para crear elipse para múltiples nodos - COORDENADAS FIJAS AL GRAFO
function crearElipseGrupoFijo(grupoSvg, posiciones, nombreGrupo, color) {
    // Calcular área contenedora en coordenadas del grafo
    const margen = 50; // Margen en coordenadas del grafo
    const minX = Math.min(...posiciones.map(p => p.x)) - margen;
    const maxX = Math.max(...posiciones.map(p => p.x)) + margen;
    const minY = Math.min(...posiciones.map(p => p.y)) - margen;
    const maxY = Math.max(...posiciones.map(p => p.y)) + margen;
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', centerX);
    ellipse.setAttribute('cy', centerY);
    ellipse.setAttribute('rx', Math.max(width / 2, 60));
    ellipse.setAttribute('ry', Math.max(height / 2, 45));
    ellipse.setAttribute('fill', color);
    ellipse.setAttribute('fill-opacity', opacidadBurbujas);
    ellipse.setAttribute('stroke', color);
    ellipse.setAttribute('stroke-width', '3');
    ellipse.setAttribute('stroke-dasharray', '10,10');
    ellipse.setAttribute('stroke-opacity', '0.8');
    ellipse.classList.add('burbuja-grupo');
    ellipse.setAttribute('data-grupo', nombreGrupo);
    
    grupoSvg.appendChild(ellipse);
    
    // Crear etiqueta
    const etiquetaY = centerY - Math.max(height / 2, 45) - 25;
    crearEtiquetaGrupoFija(grupoSvg, centerX, etiquetaY, nombreGrupo, color);
}

// Función para crear etiquetas - COORDENADAS FIJAS AL GRAFO
function crearEtiquetaGrupoFija(grupoSvg, x, y, nombreGrupo, color) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.style.cssText = `
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 16px;
        font-weight: 700;
        fill: ${color};
        text-shadow: 2px 2px 4px rgba(255,255,255,0.9);
        text-transform: uppercase;
        letter-spacing: 1px;
        pointer-events: none;
        user-select: none;
    `;
    text.textContent = formatearNombreGrupo(nombreGrupo);
    text.classList.add('etiqueta-grupo');
    text.setAttribute('data-grupo', nombreGrupo);
    
    grupoSvg.appendChild(text);
}

// Función para aplicar transformación en tiempo real
function aplicarTransformacionBurbujas() {
    const container = document.getElementById('network');
    const svg = container.querySelector('.burbujas-svg');
    const grupoTransformable = svg?.querySelector('.grupo-burbujas-transformable');
    
    if (!grupoTransformable || !network) return;
    
    // Obtener transformación actual del grafo
    const scale = network.getScale();
    const viewPosition = network.getViewPosition();
    const rect = container.getBoundingClientRect();
    
    // Calcular transformación CSS que coincida con la del grafo
    const translateX = rect.width / 2 - viewPosition.x * scale;
    const translateY = rect.height / 2 - viewPosition.y * scale;
    
    // Aplicar transformación al grupo
    grupoTransformable.setAttribute('transform', 
        `translate(${translateX}, ${translateY}) scale(${scale})`
    );
}

// Función robusta para crear burbuja individual - POSICIONES FIJAS AL GRAFO
function crearBurbujaGrupoRobusta(nombreGrupo, nodosGrupo, svg, coloresGrupos, index) {
    try {
        // Obtener el grupo transformable donde añadiremos las burbujas
        let grupoTransformable = svg.querySelector('.grupo-burbujas-transformable');
        if (!grupoTransformable) {
            grupoTransformable = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            grupoTransformable.classList.add('grupo-burbujas-transformable');
            svg.appendChild(grupoTransformable);
        }
        
        // Obtener posiciones de los nodos EN COORDENADAS DEL GRAFO (sin transformar)
        const posicionesRed = network.getPositions();
        const posiciones = [];
        
        // Obtener dimensiones del contenedor para referencia
        const container = document.getElementById('network');
        const rect = container.getBoundingClientRect();
        
        nodosGrupo.forEach(nodo => {
            const pos = posicionesRed[nodo.id];
            if (pos) {
                // Usar coordenadas directas del grafo (sin transformar)
                // Estas coordenadas se transformarán automáticamente con el grupo
                posiciones.push({
                    x: pos.x,
                    y: pos.y
                });
            }
        });
        
        if (posiciones.length === 0) {
            console.warn(`⚠️ No se encontraron posiciones para el grupo ${nombreGrupo}`);
            return false;
        }
        
        const color = coloresGrupos[nombreGrupo] || `hsl(${index * 45}, 70%, 60%)`;
        
        if (posiciones.length === 1) {
            // Un solo nodo - crear círculo
            const pos = posiciones[0];
            crearCirculoGrupoFijo(grupoTransformable, pos, nombreGrupo, color);
        } else {
            // Múltiples nodos - crear elipse contenedora
            crearElipseGrupoFijo(grupoTransformable, posiciones, nombreGrupo, color);
        }
        
        // Aplicar transformación inicial
        aplicarTransformacionBurbujas();
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error creando burbuja para ${nombreGrupo}:`, error);
        return false;
    }
}

// Función para formatear nombre del grupo para mostrar
function formatearNombreGrupo(nombreGrupo) {
    if (!nombreGrupo || nombreGrupo === 'sin_grupo') return 'Sin grupo';
    
    const nombres = {
        'universidad': '🎓 Universidad',
        'trabajo': '💼 Trabajo',
        'familia_cercana': '👨‍👩‍👧‍👦 Familia',
        'amigos': '👫 Amigos',
        'deportes': '⚽ Deportes',
        'vecinos': '🏠 Vecinos',
        'cadiz': '🏖️ Cádiz',
        'madrid': '🏙️ Madrid',
        'sevilla': '🌞 Sevilla',
        'barcelona': '🏛️ Barcelona',
        'equipo_directo': '👥 Equipo Directo',
        'colaboradores': '🤝 Colaboradores',
        'otros_departamentos': '🏢 Otros Depto',
        'departamento': '🏢 Departamento',
        'externos': '🌐 Externos',
        'nuevo': '✨ Nuevo'
    };
    
    return nombres[nombreGrupo] || nombreGrupo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Función para agrupar nodos por su grupo
function agruparNodosPorGrupo() {
    const grupos = {};
    
    nodes.forEach(nodo => {
        const grupo = nodo.grupo || 'sin_grupo';
        
        if (!grupos[grupo]) {
            grupos[grupo] = [];
        }
        
        grupos[grupo].push(nodo);
    });
    
    // Eliminar grupo 'sin_grupo' si existe
    delete grupos.sin_grupo;
    
    return grupos;
}

// Función para limpiar burbujas anteriores - MEJORADA
function limpiarBurbujasAnteriores() {
    const container = document.getElementById('network');
    if (!container) return;
    
    // Buscar y eliminar todos los SVG de burbujas
    const svgs = container.querySelectorAll('.burbujas-svg');
    svgs.forEach(svg => {
        svg.remove();
        console.log('🧹 SVG de burbujas eliminado');
    });
    
    // También eliminar cualquier SVG suelto que pueda haber quedado
    const svgsSueltos = container.querySelectorAll('svg');
    svgsSueltos.forEach(svg => {
        if (svg.querySelector('.burbuja-grupo') || svg.querySelector('.etiqueta-grupo')) {
            svg.remove();
            console.log('🧹 SVG suelto de burbujas eliminado');
        }
    });
    
    // Limpiar referencia de grupos
    gruposBurbujas = {};
    
    console.log('✅ Limpieza de burbujas completada');
}

// Función para agregar CSS de animaciones
function agregarCSSAnimaciones() {
    if (document.getElementById('burbujas-css-animaciones')) return;
    
    const style = document.createElement('style');
    style.id = 'burbujas-css-animaciones';
    style.textContent = `
        @keyframes pulso-burbuja-suave {
            0%, 100% { 
                stroke-opacity: 0.5;
                fill-opacity: ${opacidadBurbujas};
                transform: scale(1);
            }
            50% { 
                stroke-opacity: 0.9;
                fill-opacity: ${opacidadBurbujas * 1.5};
                transform: scale(1.01);
            }
        }
        
        .burbuja-grupo {
            animation: pulso-burbuja-suave 4s ease-in-out infinite;
            transform-origin: center;
            transition: all 0.3s ease;
        }
        
        .burbuja-grupo:hover {
            stroke-width: 3px !important;
            fill-opacity: ${opacidadBurbujas * 2} !important;
            stroke-opacity: 1 !important;
            transform: scale(1.02) !important;
            animation-play-state: paused;
        }
        
        .etiqueta-grupo {
            pointer-events: none !important;
            user-select: none !important;
        }
        
        /* Estilos específicos para grupos conocidos */
        .burbuja-grupo[data-grupo="universidad"] {
            stroke: #3498DB;
            fill: #3498DB;
        }
        
        .burbuja-grupo[data-grupo="trabajo"] {
            stroke: #2C3E50;
            fill: #2C3E50;
        }
        
        .burbuja-grupo[data-grupo="familia_cercana"] {
            stroke: #E74C3C;
            fill: #E74C3C;
        }
        
        .burbuja-grupo[data-grupo="amigos"] {
            stroke: #1ABC9C;
            fill: #1ABC9C;
        }
    `;
    document.head.appendChild(style);
    console.log('🎨 CSS de animaciones agregado permanentemente');
}

// ========== FUNCIONES PRINCIPALES ==========

// Función principal para crear burbujas de grupos - VERSIÓN ROBUSTA
function crearBurbujasGrupos() {
    if (!burbujasActivas) return;
    
    console.log('🫧 Iniciando creación de burbujas robustas...');
    
    // Verificar dependencias
    if (!network || !nodes) {
        console.warn('⚠️ Network o nodes no disponibles para crear burbujas');
        return;
    }
    
    const container = document.getElementById('network');
    if (!container) {
        console.error('❌ Contenedor network no encontrado');
        return;
    }
    
    // Limpiar burbujas anteriores de forma robusta
    limpiarBurbujasAnteriores();
    
    // Crear SVG de forma robusta
    const svg = crearSVGRobusto(container);
    if (!svg) return;
    
    // Agrupar nodos por grupo
    const nodosPorGrupo = agruparNodosPorGrupo();
    
    // Colores específicos para grupos
    const coloresGrupos = {
        'universidad': '#3498DB',
        'trabajo': '#2C3E50', 
        'familia_cercana': '#E74C3C',
        'amigos': '#1ABC9C',
        'cadiz': '#F39C12',
        'madrid': '#9B59B6',
        'deportes': '#27AE60',
        'vecinos': '#E67E22',
        'equipo_directo': '#FFD700',
        'colaboradores': '#FF8C00',
        'otros_departamentos': '#8A2BE2',
        'departamento': '#00CED1',
        'externos': '#FF6347',
        'nuevo': '#4169E1'
    };
    
    let burbujasCreadas = 0;
    
    // Crear burbuja para cada grupo (incluso con 1 nodo)
    Object.entries(nodosPorGrupo).forEach(([grupo, nodosGrupo], index) => {
        if (nodosGrupo.length > 0) { // Cambié de > 1 a > 0 para mostrar todos los grupos
            console.log(`🔄 Creando burbuja para: ${grupo} (${nodosGrupo.length} nodos)`);
            
            const exito = crearBurbujaGrupoRobusta(grupo, nodosGrupo, svg, coloresGrupos, index);
            if (exito) {
                burbujasCreadas++;
            }
        }
    });
    
    // Agregar CSS de animaciones si no existe
    agregarCSSAnimaciones();
    
    console.log(`✅ ${burbujasCreadas} burbujas creadas exitosamente`);
    
    // Verificación final
    setTimeout(() => {
        const svgVerificacion = container.querySelector('.burbujas-svg');
        if (svgVerificacion) {
            const burbujas = svgVerificacion.querySelectorAll('.burbuja-grupo');
            console.log(`🔍 Verificación: ${burbujas.length} burbujas en el DOM`);
            
            if (typeof mostrarNotificacion === 'function' && burbujas.length > 0) {
                mostrarNotificacion('success', `¡${burbujas.length} burbujas de grupos creadas!`);
            }
        }
    }, 300);
}

// Función para toggle de burbujas
function toggleBurbujas() {
    burbujasActivas = !burbujasActivas;
    
    if (burbujasActivas) {
        crearBurbujasGrupos();
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('success', 'Burbujas de grupos activadas');
        }
    } else {
        limpiarBurbujasAnteriores();
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('info', 'Burbujas de grupos desactivadas');
        }
    }
    
    // Actualizar botón
    const botonBurbujas = document.querySelector('[onclick="toggleBurbujas()"]');
    if (botonBurbujas) {
        const icono = botonBurbujas.querySelector('i');
        botonBurbujas.innerHTML = `${icono.outerHTML} ${burbujasActivas ? 'Ocultar' : 'Mostrar'} Grupos`;
    }
    
    return burbujasActivas;
}

// Función para cambiar opacidad de las burbujas
function cambiarOpacidadBurbujas(nuevaOpacidad) {
    opacidadBurbujas = Math.max(0.05, Math.min(0.5, nuevaOpacidad));
    
    const burbujas = document.querySelectorAll('.burbuja-grupo');
    burbujas.forEach(burbuja => {
        burbuja.style.fillOpacity = opacidadBurbujas;
    });
    
    console.log('🫧 Opacidad de burbujas cambiada a:', opacidadBurbujas);
}

// Función para obtener estadísticas de grupos
function obtenerEstadisticasGrupos() {
    const nodosPorGrupo = agruparNodosPorGrupo();
    const estadisticas = {};
    
    Object.entries(nodosPorGrupo).forEach(([grupo, nodosGrupo]) => {
        // Contar conexiones internas del grupo
        let conexionesInternas = 0;
        let conexionesExternas = 0;
        
        nodosGrupo.forEach(nodo => {
            edges.forEach(edge => {
                if (edge.from === nodo.id || edge.to === nodo.id) {
                    const otroNodoId = edge.from === nodo.id ? edge.to : edge.from;
                    const otroNodo = nodes.get(otroNodoId);
                    
                    if (otroNodo && otroNodo.grupo === grupo) {
                        conexionesInternas++;
                    } else {
                        conexionesExternas++;
                    }
                }
            });
        });
        
        // Dividir por 2 porque contamos cada conexión interna dos veces
        conexionesInternas = conexionesInternas / 2;
        
        estadisticas[grupo] = {
            nodos: nodosGrupo.length,
            conexionesInternas,
            conexionesExternas,
            densidad: nodosGrupo.length > 1 ? 
                (conexionesInternas / ((nodosGrupo.length * (nodosGrupo.length - 1)) / 2) * 100).toFixed(1) + '%' : 
                'N/A',
            color: coloresGrupos[grupo]
        };
    });
    
    return estadisticas;
}

// Función para configurar eventos de actualización - MOVIMIENTO EN TIEMPO REAL
function configurarEventosBurbujas() {
    if (!network) return;
    
    // Variables para el control de movimiento en tiempo real
    let animationFrameId = null;
    let isMoving = false;
    
    // Función para actualizar transformación en tiempo real
    function actualizarTransformacionEnTiempoReal() {
        aplicarTransformacionBurbujas();
        
        if (isMoving) {
            animationFrameId = requestAnimationFrame(actualizarTransformacionEnTiempoReal);
        }
    }
    
    // Función para iniciar movimiento en tiempo real
    function iniciarMovimientoTiempoReal() {
        if (!isMoving) {
            isMoving = true;
            actualizarTransformacionEnTiempoReal();
        }
    }
    
    // Función para detener movimiento en tiempo real
    function detenerMovimientoTiempoReal() {
        isMoving = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        // Una actualización final para asegurar posición correcta
        setTimeout(() => aplicarTransformacionBurbujas(), 50);
    }
    
    // Eventos para zoom (movimiento en tiempo real)
    network.on('zoom', function() {
        if (!burbujasActivas) return;
        iniciarMovimientoTiempoReal();
    });
    
    // Eventos para pan/drag de vista (movimiento en tiempo real)
    network.on('dragStart', function(params) {
        if (!burbujasActivas) return;
        if (params.nodes.length === 0) { // Es un drag de la vista
            iniciarMovimientoTiempoReal();
        }
    });
    
    network.on('dragging', function(params) {
        if (!burbujasActivas) return;
        if (params.nodes.length === 0) { // Es un drag de la vista
            // El movimiento ya está activo, no necesitamos hacer nada aquí
        } else {
            // Es un drag de nodos, recrear burbujas después
            detenerMovimientoTiempoReal();
        }
    });
    
    network.on('dragEnd', function(params) {
        if (!burbujasActivas) return;
        detenerMovimientoTiempoReal();
        
        // Si se movieron nodos, recrear las burbujas
        if (params.nodes.length > 0) {
            setTimeout(() => crearBurbujasGrupos(), 100);
        }
    });
    
    // Eventos para cuando el usuario hace scroll o usa el mouse wheel
    let zoomTimeout = null;
    network.on('zoom', function() {
        if (!burbujasActivas) return;
        
        // Limpiar timeout anterior
        if (zoomTimeout) {
            clearTimeout(zoomTimeout);
        }
        
        // Detener movimiento después de que pare el zoom
        zoomTimeout = setTimeout(() => {
            detenerMovimientoTiempoReal();
        }, 150); // 150ms sin zoom para considerar que paró
    });
    
    // Actualizar burbujas cuando se estabiliza la física
    network.on('stabilizationIterationsDone', function() {
        if (burbujasActivas) {
            setTimeout(() => {
                crearBurbujasGrupos();
            }, 200);
        }
    });
    
    // Actualizar burbujas cuando se ajusta la vista (fit)
    network.on('afterDrawing', function() {
        if (burbujasActivas) {
            setTimeout(() => {
                aplicarTransformacionBurbujas();
            }, 100);
        }
    });
    
    // Actualizar burbujas cuando cambia el tamaño de la ventana
    window.addEventListener('resize', function() {
        if (burbujasActivas) {
            detenerMovimientoTiempoReal();
            setTimeout(() => {
                crearBurbujasGrupos();
            }, 300);
        }
    });
    
    // Eventos de teclado para zoom suave
    document.addEventListener('keydown', function(e) {
        if (!burbujasActivas) return;
        
        // Detectar zoom con teclado (+ y -)
        if (e.key === '+' || e.key === '=' || e.key === '-') {
            iniciarMovimientoTiempoReal();
            
            // Detener después de un momento
            setTimeout(() => {
                detenerMovimientoTiempoReal();
            }, 500);
        }
    });
    
    console.log('✅ Eventos de burbujas configurados con movimiento en tiempo real');
}

// Función para inicializar el sistema de burbujas
function inicializarSistemaBurbujas() {
    if (!network || !nodes) {
        console.warn('⚠️ Red no inicializada, no se pueden crear burbujas');
        return;
    }
    
    console.log('🫧 Inicializando sistema de burbujas...');
    
    // Crear burbujas iniciales
    crearBurbujasGrupos();
    
    // Configurar eventos para actualizar burbujas
    configurarEventosBurbujas();
    
    console.log('✅ Sistema de burbujas inicializado');
}

// ========== INICIALIZACIÓN ==========

// Función principal de inicialización
function inicializarSistemaBurbujasCompleto() {
    // Esperar a que la red esté lista
    if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
        inicializarSistemaBurbujas();
        console.log('🫧 Sistema completo de burbujas inicializado');
    } else {
        // Reintentar después de un momento
        setTimeout(inicializarSistemaBurbujasCompleto, 1000);
    }
}

// ========== EXPORTAR FUNCIONES ==========

// Exportar funciones principales
window.toggleBurbujas = toggleBurbujas;
window.cambiarOpacidadBurbujas = cambiarOpacidadBurbujas;
window.crearBurbujasGrupos = crearBurbujasGrupos;
window.obtenerEstadisticasGrupos = obtenerEstadisticasGrupos;
window.limpiarBurbujasAnteriores = limpiarBurbujasAnteriores;

// Funciones para debugging
window.debugBurbujas = function() {
    console.log('🔍 Estado del sistema de burbujas:');
    console.log('- Burbujas activas:', burbujasActivas);
    console.log('- Opacidad:', opacidadBurbujas);
    console.log('- Estadísticas:', obtenerEstadisticasGrupos());
};

window.testBurbujas = function() {
    console.log('🧪 Test manual de burbujas');
    crearBurbujasGrupos();
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistemaBurbujasCompleto);
} else {
    inicializarSistemaBurbujasCompleto();
}

console.log('🫧 Sistema de burbujas de grupos cargado completamente');