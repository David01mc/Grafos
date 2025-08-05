// static/js/bubble-containment-fix.js - JavaScript para contener burbujas dentro del contenedor

console.log('📦 Cargando sistema de contención de burbujas...');

// ========== FUNCIONES DE UTILIDAD PARA DIMENSIONES ========== 

/**
 * Obtiene las dimensiones reales del contenedor del grafo
 */
function obtenerDimensionesContenedor() {
    const container = document.getElementById('network');
    if (!container) return null;
    
    const rect = container.getBoundingClientRect();
    const styles = getComputedStyle(container);
    
    // Calcular dimensiones internas (sin padding/border)
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    
    const borderLeft = parseFloat(styles.borderLeftWidth) || 0;
    const borderRight = parseFloat(styles.borderRightWidth) || 0;
    const borderTop = parseFloat(styles.borderTopWidth) || 0;
    const borderBottom = parseFloat(styles.borderBottomWidth) || 0;
    
    return {
        total: {
            width: rect.width,
            height: rect.height
        },
        usable: {
            width: rect.width - paddingLeft - paddingRight - borderLeft - borderRight,
            height: rect.height - paddingTop - paddingBottom - borderTop - borderBottom
        },
        margins: {
            left: paddingLeft + borderLeft,
            right: paddingRight + borderRight,
            top: paddingTop + borderTop,
            bottom: paddingBottom + borderBottom
        }
    };
}

/**
 * Verifica si una posición está dentro de los límites del contenedor
 */
function estaDentroDeContenedor(x, y, margen = 20) {
    const dims = obtenerDimensionesContenedor();
    if (!dims) return false;
    
    return (
        x >= margen && 
        x <= dims.usable.width - margen &&
        y >= margen && 
        y <= dims.usable.height - margen
    );
}

/**
 * Ajusta una posición para que esté dentro de los límites
 */
function ajustarPosicionDentroContenedor(x, y, elemento) {
    const dims = obtenerDimensionesContenedor();
    if (!dims) return { x, y };
    
    // Obtener dimensiones del elemento si se proporciona
    let elementWidth = 0;
    let elementHeight = 0;
    
    if (elemento) {
        const elementRect = elemento.getBoundingClientRect();
        elementWidth = elementRect.width;
        elementHeight = elementRect.height;
    }
    
    // Margen de seguridad
    const margen = 20;
    
    // Ajustar X
    const minX = margen;
    const maxX = dims.usable.width - elementWidth - margen;
    const adjustedX = Math.max(minX, Math.min(maxX, x));
    
    // Ajustar Y
    const minY = margen;
    const maxY = dims.usable.height - elementHeight - margen;
    const adjustedY = Math.max(minY, Math.min(maxY, y));
    
    return {
        x: adjustedX,
        y: adjustedY,
        wasAdjusted: adjustedX !== x || adjustedY !== y
    };
}

// ========== FUNCIONES MEJORADAS PARA CREAR BURBUJAS CONTENIDAS ==========

/**
 * Crea una burbuja individual con verificación de límites
 */
function crearBurbujaContenida(nombreGrupo, nodosGrupo, svg, coloresGrupos, index) {
    try {
        const container = document.getElementById('network');
        const dims = obtenerDimensionesContenedor();
        
        if (!dims) {
            console.warn('⚠️ No se pudieron obtener dimensiones del contenedor');
            return false;
        }
        
        console.log(`📦 Creando burbuja contenida para ${nombreGrupo}...`);
        console.log(`📏 Dimensiones usables: ${dims.usable.width}x${dims.usable.height}`);
        
        // Obtener el grupo transformable
        let grupoTransformable = svg.querySelector('.grupo-burbujas-transformable');
        if (!grupoTransformable) {
            grupoTransformable = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            grupoTransformable.classList.add('grupo-burbujas-transformable');
            svg.appendChild(grupoTransformable);
        }
        
        // Obtener posiciones de los nodos
        const posicionesRed = network.getPositions();
        const posiciones = [];
        
        nodosGrupo.forEach(nodo => {
            const pos = posicionesRed[nodo.id];
            if (pos) {
                // Verificar y ajustar posición si es necesaria
                const posAjustada = ajustarPosicionDentroContenedor(pos.x, pos.y);
                posiciones.push({
                    x: posAjustada.x,
                    y: posAjustada.y,
                    original: pos,
                    adjusted: posAjustada.wasAdjusted
                });
                
                if (posAjustada.wasAdjusted) {
                    console.log(`📍 Posición ajustada para nodo ${nodo.id}: (${pos.x}, ${pos.y}) → (${posAjustada.x}, ${posAjustada.y})`);
                }
            }
        });
        
        if (posiciones.length === 0) {
            console.warn(`⚠️ No se encontraron posiciones válidas para el grupo ${nombreGrupo}`);
            return false;
        }
        
        const color = coloresGrupos[nombreGrupo] || `hsl(${index * 45}, 70%, 60%)`;
        
        if (posiciones.length === 1) {
            // Un solo nodo - crear círculo contenido
            crearCirculoContenido(grupoTransformable, posiciones[0], nombreGrupo, color, dims);
        } else {
            // Múltiples nodos - crear elipse contenida
            crearElipseContenida(grupoTransformable, posiciones, nombreGrupo, color, dims);
        }
        
        console.log(`✅ Burbuja contenida creada para ${nombreGrupo}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Error creando burbuja contenida para ${nombreGrupo}:`, error);
        return false;
    }
}

/**
 * Crea un círculo contenido para un solo nodo
 */
function crearCirculoContenido(grupoSvg, posicion, nombreGrupo, color, dims) {
    // Radio adaptativo basado en el tamaño del contenedor
    const baseRadius = 60;
    const maxRadius = Math.min(dims.usable.width, dims.usable.height) / 8;
    const radius = Math.min(baseRadius, maxRadius);
    
    // Ajustar posición del círculo para que no se salga
    const adjustedPos = ajustarPosicionDentroContenedor(
        posicion.x, 
        posicion.y, 
        { getBoundingClientRect: () => ({ width: radius * 2, height: radius * 2 }) }
    );
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', adjustedPos.x);
    circle.setAttribute('cy', adjustedPos.y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', window.opacidadBurbujas || 0.15);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '3');
    circle.setAttribute('stroke-dasharray', '10,10');
    circle.setAttribute('stroke-opacity', '0.8');
    circle.classList.add('burbuja-grupo');
    circle.setAttribute('data-grupo', nombreGrupo);
    
    grupoSvg.appendChild(circle);
    
    // Crear etiqueta contenida
    const etiquetaY = adjustedPos.y - radius - 20;
    const etiquetaYAjustada = Math.max(20, Math.min(dims.usable.height - 20, etiquetaY));
    
    crearEtiquetaContenida(grupoSvg, adjustedPos.x, etiquetaYAjustada, nombreGrupo, color, dims);
    
    console.log(`📍 Círculo creado en posición contenida: (${adjustedPos.x}, ${adjustedPos.y}) radio: ${radius}`);
}

/**
 * Crea una elipse contenida para múltiples nodos
 */
function crearElipseContenida(grupoSvg, posiciones, nombreGrupo, color, dims) {
    const margen = 30; // Margen reducido para mejor contención
    
    // Calcular límites
    const minX = Math.min(...posiciones.map(p => p.x)) - margen;
    const maxX = Math.max(...posiciones.map(p => p.x)) + margen;
    const minY = Math.min(...posiciones.map(p => p.y)) - margen;
    const maxY = Math.max(...posiciones.map(p => p.y)) + margen;
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Ajustar tamaño para que quepa en el contenedor
    const maxWidth = dims.usable.width - 40; // Margen de seguridad
    const maxHeight = dims.usable.height - 40;
    
    const scaledWidth = Math.min(width, maxWidth);
    const scaledHeight = Math.min(height, maxHeight);
    
    // Ajustar centro si es necesario
    const adjustedCenter = ajustarPosicionDentroContenedor(
        centerX, 
        centerY,
        { getBoundingClientRect: () => ({ width: scaledWidth, height: scaledHeight }) }
    );
    
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', adjustedCenter.x);
    ellipse.setAttribute('cy', adjustedCenter.y);
    ellipse.setAttribute('rx', Math.max(scaledWidth / 2, 40));
    ellipse.setAttribute('ry', Math.max(scaledHeight / 2, 30));
    ellipse.setAttribute('fill', color);
    ellipse.setAttribute('fill-opacity', window.opacidadBurbujas || 0.15);
    ellipse.setAttribute('stroke', color);
    ellipse.setAttribute('stroke-width', '3');
    ellipse.setAttribute('stroke-dasharray', '10,10');
    ellipse.setAttribute('stroke-opacity', '0.8');
    ellipse.classList.add('burbuja-grupo');
    ellipse.setAttribute('data-grupo', nombreGrupo);
    
    grupoSvg.appendChild(ellipse);
    
    // Crear etiqueta contenida
    const etiquetaY = adjustedCenter.y - Math.max(scaledHeight / 2, 30) - 25;
    const etiquetaYAjustada = Math.max(20, Math.min(dims.usable.height - 20, etiquetaY));
    
    crearEtiquetaContenida(grupoSvg, adjustedCenter.x, etiquetaYAjustada, nombreGrupo, color, dims);
    
    console.log(`📍 Elipse creada en posición contenida: (${adjustedCenter.x}, ${adjustedCenter.y}) tamaño: ${scaledWidth}x${scaledHeight}`);
}

/**
 * Crea una etiqueta contenida
 */
function crearEtiquetaContenida(grupoSvg, x, y, nombreGrupo, color, dims) {
    // Ajustar posición de la etiqueta
    const adjustedPos = ajustarPosicionDentroContenedor(x, y);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', adjustedPos.x);
    text.setAttribute('y', adjustedPos.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    
    // Tamaño de fuente adaptativo
    const fontSize = Math.min(16, dims.usable.width / 30);
    
    text.style.cssText = `
        font-family: 'Inter', system-ui, sans-serif;
        font-size: ${fontSize}px;
        font-weight: 700;
        fill: ${color};
        text-shadow: 2px 2px 4px rgba(255,255,255,0.9);
        text-transform: uppercase;
        letter-spacing: 1px;
        pointer-events: none;
        user-select: none;
    `;
    
    // Texto limitado en longitud
    const nombreFormateado = formatearNombreGrupo(nombreGrupo);
    const textoLimitado = nombreFormateado.length > 12 ? nombreFormateado.substring(0, 12) + '...' : nombreFormateado;
    
    text.textContent = textoLimitado;
    text.classList.add('etiqueta-grupo');
    text.setAttribute('data-grupo', nombreGrupo);
    
    grupoSvg.appendChild(text);
    
    console.log(`🏷️ Etiqueta contenida creada: "${textoLimitado}" en (${adjustedPos.x}, ${adjustedPos.y})`);
}

// ========== REEMPLAZO DE LA FUNCIÓN PRINCIPAL DE CREACIÓN ==========

/**
 * Función principal mejorada para crear burbujas contenidas
 */
function crearBurbujasGruposContenidas() {
    if (!window.burbujasActivas) return;
    
    console.log('📦 Iniciando creación de burbujas contenidas...');
    
    // Verificar dependencias
    if (!network || !nodes) {
        console.warn('⚠️ Network o nodes no disponibles');
        return;
    }
    
    const container = document.getElementById('network');
    if (!container) {
        console.error('❌ Contenedor network no encontrado');
        return;
    }
    
    // Verificar dimensiones del contenedor
    const dims = obtenerDimensionesContenedor();
    if (!dims || dims.usable.width < 100 || dims.usable.height < 100) {
        console.warn('⚠️ Contenedor demasiado pequeño para burbujas:', dims);
        return;
    }
    
    console.log(`📏 Creando burbujas en contenedor: ${dims.usable.width}x${dims.usable.height}`);
    
    // Limpiar burbujas anteriores
    if (typeof limpiarBurbujasAnteriores === 'function') {
        limpiarBurbujasAnteriores();
    }
    
    // Crear SVG mejorado
    const svg = crearSVGContenido(container, dims);
    if (!svg) return;
    
    // Agrupar nodos por grupo
    const nodosPorGrupo = agruparNodosPorGrupo();
    
    // Colores para grupos
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
    
    // Crear burbujas contenidas para cada grupo
    Object.entries(nodosPorGrupo).forEach(([grupo, nodosGrupo], index) => {
        if (nodosGrupo.length > 0) {
            console.log(`📦 Creando burbuja contenida para: ${grupo} (${nodosGrupo.length} nodos)`);
            
            const exito = crearBurbujaContenida(grupo, nodosGrupo, svg, coloresGrupos, index);
            if (exito) {
                burbujasCreadas++;
            }
        }
    });
    
    console.log(`✅ ${burbujasCreadas} burbujas contenidas creadas exitosamente`);
    
    // Mostrar notificación
    if (typeof mostrarNotificacion === 'function' && burbujasCreadas > 0) {
        mostrarNotificacion('success', `¡${burbujasCreadas} burbujas de grupos creadas y contenidas!`);
    }
}

/**
 * Crea un SVG optimizado para contención
 */
function crearSVGContenido(container, dims) {
    // Eliminar SVG anterior
    const svgAnterior = container.querySelector('.burbujas-svg');
    if (svgAnterior) {
        svgAnterior.remove();
    }
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('burbujas-svg');
    svg.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 2 !important;
        overflow: hidden !important;
    `;
    
    // ViewBox que coincida exactamente con las dimensiones del contenedor
    svg.setAttribute('viewBox', `0 0 ${dims.total.width} ${dims.total.height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Crear área de recorte para asegurar contención
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.id = 'containerClip';
    
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', dims.margins.left);
    clipRect.setAttribute('y', dims.margins.top);
    clipRect.setAttribute('width', dims.usable.width);
    clipRect.setAttribute('height', dims.usable.height);
    
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);
    
    // Crear grupo principal con recorte
    const grupoTransformable = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grupoTransformable.classList.add('grupo-burbujas-transformable');
    grupoTransformable.setAttribute('clip-path', 'url(#containerClip)');
    svg.appendChild(grupoTransformable);
    
    container.appendChild(svg);
    
    console.log(`✅ SVG contenido creado con recorte en: ${dims.usable.width}x${dims.usable.height}`);
    return svg;
}

// ========== FUNCIÓN DE TRANSFORMACIÓN MEJORADA ==========

/**
 * Aplica transformación asegurando que las burbujas permanezcan contenidas
 */
function aplicarTransformacionContenida() {
    const container = document.getElementById('network');
    const svg = container?.querySelector('.burbujas-svg');
    const grupoTransformable = svg?.querySelector('.grupo-burbujas-transformable');
    
    if (!grupoTransformable || !network) return;
    
    try {
        const dims = obtenerDimensionesContenedor();
        if (!dims) return;
        
        // Obtener transformación actual del grafo
        const scale = network.getScale();
        const viewPosition = network.getViewPosition();
        
        // Calcular transformación
        const translateX = dims.total.width / 2 - viewPosition.x * scale;
        const translateY = dims.total.height / 2 - viewPosition.y * scale;
        
        // Limitar la transformación para evitar que las burbujas se salgan
        const maxTranslateX = dims.usable.width * 0.5;
        const maxTranslateY = dims.usable.height * 0.5;
        const minTranslateX = -maxTranslateX;
        const minTranslateY = -maxTranslateY;
        
        const limitedTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, translateX));
        const limitedTranslateY = Math.max(minTranslateY, Math.min(maxTranslateY, translateY));
        
        // Limitar escala para evitar burbujas demasiado grandes
        const maxScale = Math.min(dims.usable.width / 400, dims.usable.height / 400, 3);
        const minScale = 0.3;
        const limitedScale = Math.max(minScale, Math.min(maxScale, scale));
        
        // Aplicar transformación limitada
        const transform = `translate(${limitedTranslateX}, ${limitedTranslateY}) scale(${limitedScale})`;
        grupoTransformable.setAttribute('transform', transform);
        
        // Ajustar opacidad basada en la escala para mejor visibilidad
        const opacity = Math.max(0.05, Math.min(0.3, window.opacidadBurbujas || 0.15));
        const burbujas = grupoTransformable.querySelectorAll('.burbuja-grupo');
        burbujas.forEach(burbuja => {
            burbuja.setAttribute('fill-opacity', opacity);
        });
        
    } catch (error) {
        console.error('❌ Error aplicando transformación contenida:', error);
    }
}

// ========== DETECTAR Y CORREGIR OVERFLOW ==========

/**
 * Detecta si hay burbujas que se salen del contenedor
 */
function detectarOverflowBurbujas() {
    const container = document.getElementById('network');
    const svg = container?.querySelector('.burbujas-svg');
    
    if (!svg) return [];
    
    const dims = obtenerDimensionesContenedor();
    if (!dims) return [];
    
    const burbujas = svg.querySelectorAll('.burbuja-grupo');
    const elementosOverflow = [];
    
    burbujas.forEach(burbuja => {
        const bbox = burbuja.getBBox();
        const transform = burbuja.getScreenCTM();
        
        if (transform) {
            const x = transform.e;
            const y = transform.f;
            const width = bbox.width * transform.a;
            const height = bbox.height * transform.d;
            
            // Verificar si se sale de los límites
            if (x < 0 || y < 0 || 
                x + width > dims.total.width || 
                y + height > dims.total.height) {
                
                elementosOverflow.push({
                    elemento: burbuja,
                    grupo: burbuja.getAttribute('data-grupo'),
                    posicion: { x, y, width, height },
                    overflow: {
                        left: x < 0,
                        top: y < 0,
                        right: x + width > dims.total.width,
                        bottom: y + height > dims.total.height
                    }
                });
            }
        }
    });
    
    return elementosOverflow;
}

/**
 * Corrige elementos que se salen del contenedor
 */
function corregirOverflowBurbujas() {
    const elementosOverflow = detectarOverflowBurbujas();
    
    if (elementosOverflow.length > 0) {
        console.log(`🔧 Corrigiendo ${elementosOverflow.length} burbujas que se salen del contenedor...`);
        
        elementosOverflow.forEach(item => {
            const { elemento, grupo, overflow } = item;
            
            // Reducir tamaño si es necesario
            if (elemento.tagName === 'circle') {
                const radio = parseFloat(elemento.getAttribute('r'));
                const nuevoRadio = Math.max(20, radio * 0.8);
                elemento.setAttribute('r', nuevoRadio);
                console.log(`📏 Radio reducido para ${grupo}: ${radio} → ${nuevoRadio}`);
                
            } else if (elemento.tagName === 'ellipse') {
                const rx = parseFloat(elemento.getAttribute('rx'));
                const ry = parseFloat(elemento.getAttribute('ry'));
                const nuevoRx = Math.max(30, rx * 0.8);
                const nuevoRy = Math.max(20, ry * 0.8);
                elemento.setAttribute('rx', nuevoRx);
                elemento.setAttribute('ry', nuevoRy);
                console.log(`📏 Tamaño reducido para ${grupo}: ${rx}x${ry} → ${nuevoRx}x${nuevoRy}`);
            }
        });
        
        return true;
    }
    
    return false;
}

// ========== MONITOREO Y AJUSTE AUTOMÁTICO ==========

/**
 * Inicia el monitoreo automático de contención
 */
function iniciarMonitoreoContencion() {
    let ultimaVerificacion = 0;
    
    function verificarContencion() {
        const ahora = performance.now();
        
        // Throttling: verificar máximo cada 2 segundos
        if (ahora - ultimaVerificacion < 2000) return;
        ultimaVerificacion = ahora;
        
        const overflow = detectarOverflowBurbujas();
        
        if (overflow.length > 0) {
            console.log(`⚠️ Detectado overflow en ${overflow.length} burbujas, corrigiendo...`);
            const corregido = corregirOverflowBurbujas();
            
            if (corregido) {
                // Aplicar transformación para asegurar contención
                setTimeout(aplicarTransformacionContenida, 100);
            }
        }
    }
    
    // Verificar en eventos de cambio
    if (network) {
        network.on('zoom', verificarContencion);
        network.on('dragEnd', verificarContencion);
    }
    
    // Verificación periódica
    setInterval(verificarContencion, 5000);
    
    console.log('👁️ Monitoreo de contención iniciado');
}

// ========== UTILIDADES DE REDIMENSIONAMIENTO ==========

/**
 * Ajusta las burbujas cuando cambia el tamaño del contenedor
 */
function ajustarBurbujasARedimensionamiento() {
    const dims = obtenerDimensionesContenedor();
    if (!dims) return;
    
    console.log(`📏 Redimensionamiento detectado: ${dims.usable.width}x${dims.usable.height}`);
    
    // Si el contenedor es muy pequeño, ocultar burbujas
    if (dims.usable.width < 200 || dims.usable.height < 150) {
        const svg = document.querySelector('.burbujas-svg');
        if (svg) {
            svg.style.display = 'none';
            console.log('📱 Contenedor muy pequeño, ocultando burbujas');
        }
        return;
    } else {
        const svg = document.querySelector('.burbujas-svg');
        if (svg) {
            svg.style.display = 'block';
        }
    }
    
    // Recrear burbujas con nuevas dimensiones
    setTimeout(() => {
        if (typeof crearBurbujasGruposContenidas === 'function') {
            crearBurbujasGruposContenidas();
        }
    }, 100);
}

// ========== FUNCIONES DE DEBUG Y UTILIDAD ==========

/**
 * Muestra información de debug sobre la contención
 */
window.debugContencionBurbujas = function() {
    console.log('🔍 DEBUG DE CONTENCIÓN DE BURBUJAS:');
    console.log('===================================');
    
    const dims = obtenerDimensionesContenedor();
    if (dims) {
        console.log('📏 Dimensiones del contenedor:');
        console.log('  Total:', dims.total);
        console.log('  Usable:', dims.usable);
        console.log('  Márgenes:', dims.margins);
    } else {
        console.log('❌ No se pudieron obtener dimensiones');
    }
    
    const overflow = detectarOverflowBurbujas();
    console.log(`🚨 Elementos con overflow: ${overflow.length}`);
    
    if (overflow.length > 0) {
        console.log('Detalles del overflow:');
        overflow.forEach((item, index) => {
            console.log(`  ${index + 1}. Grupo: ${item.grupo}`);
            console.log(`     Posición: (${item.posicion.x.toFixed(1)}, ${item.posicion.y.toFixed(1)})`);
            console.log(`     Tamaño: ${item.posicion.width.toFixed(1)}x${item.posicion.height.toFixed(1)}`);
            console.log(`     Overflow: ${Object.entries(item.overflow).filter(([k,v]) => v).map(([k]) => k).join(', ')}`);
        });
    }
    
    const svg = document.querySelector('.burbujas-svg');
    const burbujas = svg?.querySelectorAll('.burbuja-grupo');
    console.log(`🫧 Total de burbujas: ${burbujas?.length || 0}`);
    
    console.log('===================================');
    console.log('💡 Funciones disponibles:');
    console.log('- corregirOverflowBurbujas() - Corregir overflow manualmente');
    console.log('- ajustarBurbujasARedimensionamiento() - Ajustar a nuevo tamaño');
    console.log('- toggleMostrarLimitesContenedor() - Mostrar/ocultar límites');
};

/**
 * Toggle para mostrar/ocultar los límites del contenedor
 */
window.toggleMostrarLimitesContenedor = function() {
    const container = document.getElementById('network');
    if (!container) return;
    
    if (container.classList.contains('show-container-bounds')) {
        container.classList.remove('show-container-bounds');
        console.log('👁️ Límites del contenedor ocultados');
    } else {
        container.classList.add('show-container-bounds');
        console.log('👁️ Límites del contenedor mostrados');
        
        // Ocultar automáticamente después de 5 segundos
        setTimeout(() => {
            container.classList.remove('show-container-bounds');
        }, 5000);
    }
};

/**
 * Test completo del sistema de contención
 */
window.testSistemaContencion = function() {
    console.log('🧪 Iniciando test del sistema de contención...');
    
    // Mostrar límites temporalmente
    toggleMostrarLimitesContenedor();
    
    // Recrear burbujas con contención
    setTimeout(() => {
        if (typeof crearBurbujasGruposContenidas === 'function') {
            crearBurbujasGruposContenidas();
        }
        
        // Debug después de crear
        setTimeout(() => {
            debugContencionBurbujas();
            
            // Test de zoom
            if (network) {
                console.log('🔍 Probando zoom para verificar contención...');
                
                const zoomOriginal = network.getScale();
                
                // Zoom alto
                network.moveTo({ scale: 2.5, animation: { duration: 1000 } });
                
                setTimeout(() => {
                    const overflow1 = detectarOverflowBurbujas();
                    console.log(`📊 Overflow en zoom alto: ${overflow1.length} elementos`);
                    
                    // Zoom bajo
                    network.moveTo({ scale: 0.5, animation: { duration: 1000 } });
                    
                    setTimeout(() => {
                        const overflow2 = detectarOverflowBurbujas();
                        console.log(`📊 Overflow en zoom bajo: ${overflow2.length} elementos`);
                        
                        // Volver al zoom original
                        network.moveTo({ scale: zoomOriginal, animation: { duration: 1000 } });
                        
                        console.log('✅ Test de contención completado');
                        
                    }, 1500);
                }, 1500);
            }
        }, 1000);
    }, 500);
};

// ========== INTEGRACIÓN CON EL SISTEMA EXISTENTE ==========

// Reemplazar la función original de aplicar transformación
if (typeof window.aplicarTransformacionBurbujas === 'function') {
    const originalFunction = window.aplicarTransformacionBurbujas;
    
    window.aplicarTransformacionBurbujas = function() {
        // Usar la versión contenida si está disponible
        if (typeof aplicarTransformacionContenida === 'function') {
            aplicarTransformacionContenida();
        } else {
            // Fallback a la función original
            originalFunction.apply(this, arguments);
        }
    };
    
    console.log('🔄 Función de transformación reemplazada con versión contenida');
}

// Reemplazar la función de creación de burbujas
if (typeof window.crearBurbujasGrupos === 'function') {
    // Guardar referencia a la función original como fallback
    window.crearBurbujasGruposOriginal = window.crearBurbujasGrupos;
    
    // Reemplazar con la versión contenida
    window.crearBurbujasGrupos = function() {
        console.log('📦 Usando creación de burbujas contenidas...');
        crearBurbujasGruposContenidas();
    };
    
    console.log('🔄 Función de creación de burbujas reemplazada con versión contenida');
}

// ========== INICIALIZACIÓN ==========

/**
 * Inicializa el sistema de contención de burbujas
 */
function inicializarSistemaContencion() {
    console.log('📦 Inicializando sistema de contención de burbujas...');
    
    // Verificar dependencias
    if (!document.getElementById('network')) {
        console.warn('⚠️ Contenedor network no encontrado');
        return false;
    }
    
    // Aplicar CSS de contención
    const linkCSS = document.createElement('link');
    linkCSS.rel = 'stylesheet';
    linkCSS.href = '/static/css/bubble-containment-fix.css';
    document.head.appendChild(linkCSS);
    
    // Configurar eventos de redimensionamiento
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(ajustarBurbujasARedimensionamiento, 300);
    });
    
    // Iniciar monitoreo
    setTimeout(iniciarMonitoreoContencion, 2000);
    
    console.log('✅ Sistema de contención de burbujas inicializado');
    return true;
}

// ========== AUTO-INICIALIZACIÓN ==========

// Esperar a que otros sistemas estén listos
function esperarSistemasYConfigurar() {
    if (typeof network !== 'undefined' && network) {
        inicializarSistemaContencion();
        console.log('📦 Sistema de contención de burbujas listo');
    } else {
        setTimeout(esperarSistemasYConfigurar, 1000);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', esperarSistemasYConfigurar);
} else {
    setTimeout(esperarSistemasYConfigurar, 1000);
}

// Exportar funciones principales
window.crearBurbujasGruposContenidas = crearBurbujasGruposContenidas;
window.aplicarTransformacionContenida = aplicarTransformacionContenida;
window.detectarOverflowBurbujas = detectarOverflowBurbujas;
window.corregirOverflowBurbujas = corregirOverflowBurbujas;
window.obtenerDimensionesContenedor = obtenerDimensionesContenedor;

console.log('📦 Sistema de contención de burbujas cargado completamente');