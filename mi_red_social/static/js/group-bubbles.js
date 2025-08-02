// static/js/group-bubbles.js - Sistema de burbujas de grupos para agrupar nodos visualmente

let gruposBurbujas = {};
let burbujasActivas = true;
let opacidadBurbujas = 0.15;
let coloresGrupos = {};

// Función para inicializar el sistema de burbujas
function inicializarSistemaBurbujas() {
    if (!network || !nodes) {
        console.warn('⚠️ Red no inicializada, no se pueden crear burbujas');
        return;
    }
    
    console.log('🫧 Inicializando sistema de burbujas de grupos...');
    
    // Configurar colores por defecto para grupos
    configurarColoresGrupos();
    
    // Crear burbujas iniciales
    crearBurbujasGrupos();
    
    // Configurar eventos para actualizar burbujas
    configurarEventosBurbujas();
    
    console.log('✅ Sistema de burbujas inicializado');
}

// Función para configurar colores únicos para cada grupo
function configurarColoresGrupos() {
    const coloresPredefinidos = [
        '#FF6B6B', // Rojo coral
        '#4ECDC4', // Turquesa
        '#45B7D1', // Azul cielo
        '#96CEB4', // Verde menta
        '#FFEAA7', // Amarillo suave
        '#DDA0DD', // Violeta suave
        '#F39C12', // Naranja
        '#E74C3C', // Rojo
        '#9B59B6', // Púrpura
        '#2ECC71', // Verde
        '#3498DB', // Azul
        '#F1C40F'  // Amarillo
    ];
    
    let colorIndex = 0;
    
    // Obtener todos los grupos únicos
    const grupos = obtenerGruposUnicos();
    
    grupos.forEach(grupo => {
        if (!coloresGrupos[grupo]) {
            coloresGrupos[grupo] = coloresPredefinidos[colorIndex % coloresPredefinidos.length];
            colorIndex++;
        }
    });
    
    console.log('🎨 Colores de grupos configurados:', coloresGrupos);
}

// Función para obtener grupos únicos de los nodos
function obtenerGruposUnicos() {
    const grupos = new Set();
    
    nodes.forEach(nodo => {
        if (nodo.grupo && nodo.grupo !== 'sin_grupo') {
            grupos.add(nodo.grupo);
        }
    });
    
    return Array.from(grupos);
}

// Función principal para crear burbujas de grupos
function crearBurbujasGrupos() {
    if (!burbujasActivas) return;
    
    // Limpiar burbujas anteriores
    limpiarBurbujasAnteriores();
    
    // Agrupar nodos por grupo
    const nodosPorGrupo = agruparNodosPorGrupo();
    
    // Crear burbuja para cada grupo
    Object.entries(nodosPorGrupo).forEach(([grupo, nodosGrupo]) => {
        if (nodosGrupo.length > 1) { // Solo crear burbuja si hay más de 1 nodo
            crearBurbujaGrupo(grupo, nodosGrupo);
        }
    });
    
    console.log('🫧 Burbujas de grupos creadas');
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

// Función para crear una burbuja individual para un grupo
function crearBurbujaGrupo(nombreGrupo, nodosGrupo) {
    // Obtener posiciones de los nodos
    const posiciones = obtenerPosicionesNodos(nodosGrupo);
    
    if (posiciones.length < 2) return;
    
    // Calcular convex hull (envolvente convexa)
    const puntosHull = calcularConvexHull(posiciones);
    
    if (puntosHull.length < 3) return;
    
    // Expandir la burbuja para que sea más grande que los nodos
    const puntosExpandidos = expandirPuntos(puntosHull, 50); // 50px de margen
    
    // Crear elemento SVG para la burbuja
    crearElementoBurbuja(nombreGrupo, puntosExpandidos);
}

// Función para obtener posiciones actuales de los nodos
function obtenerPosicionesNodos(nodosGrupo) {
    const posiciones = [];
    const posicionesActuales = network.getPositions();
    
    nodosGrupo.forEach(nodo => {
        const pos = posicionesActuales[nodo.id];
        if (pos) {
            // Convertir coordenadas del grafo a coordenadas DOM
            const posDOM = network.canvasToDOM(pos);
            posiciones.push({
                x: posDOM.x,
                y: posDOM.y,
                id: nodo.id
            });
        }
    });
    
    return posiciones;
}

// Función para calcular convex hull usando algoritmo de Graham
function calcularConvexHull(puntos) {
    if (puntos.length < 3) return puntos;
    
    // Encontrar el punto más abajo y más a la izquierda
    let inicio = 0;
    for (let i = 1; i < puntos.length; i++) {
        if (puntos[i].y < puntos[inicio].y || 
            (puntos[i].y === puntos[inicio].y && puntos[i].x < puntos[inicio].x)) {
            inicio = i;
        }
    }
    
    // Ordenar puntos por ángulo polar respecto al punto inicial
    const puntoInicio = puntos[inicio];
    const otrosPuntos = puntos.filter((_, i) => i !== inicio);
    
    otrosPuntos.sort((a, b) => {
        const anguloA = Math.atan2(a.y - puntoInicio.y, a.x - puntoInicio.x);
        const anguloB = Math.atan2(b.y - puntoInicio.y, b.x - puntoInicio.x);
        return anguloA - anguloB;
    });
    
    // Algoritmo de Graham scan simplificado
    const hull = [puntoInicio];
    
    for (let i = 0; i < otrosPuntos.length; i++) {
        // Eliminar puntos que crean giros en sentido horario
        while (hull.length > 1 && 
               orientacion(hull[hull.length - 2], hull[hull.length - 1], otrosPuntos[i]) <= 0) {
            hull.pop();
        }
        hull.push(otrosPuntos[i]);
    }
    
    return hull;
}

// Función auxiliar para determinar orientación de tres puntos
function orientacion(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// Función para expandir los puntos del hull para crear margen
function expandirPuntos(puntos, margen) {
    if (puntos.length < 3) return puntos;
    
    // Calcular centroide
    const centroide = {
        x: puntos.reduce((sum, p) => sum + p.x, 0) / puntos.length,
        y: puntos.reduce((sum, p) => sum + p.y, 0) / puntos.length
    };
    
    // Expandir cada punto alejándolo del centroide
    return puntos.map(punto => {
        const dx = punto.x - centroide.x;
        const dy = punto.y - centroide.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia === 0) return punto;
        
        const factor = (distancia + margen) / distancia;
        
        return {
            x: centroide.x + dx * factor,
            y: centroide.y + dy * factor
        };
    });
}

// Función para crear el elemento SVG de la burbuja
function crearElementoBurbuja(nombreGrupo, puntos) {
    const container = document.getElementById('network');
    
    // Crear SVG si no existe
    let svg = container.querySelector('.burbujas-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('burbujas-svg');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        container.appendChild(svg);
    }
    
    // Crear path para la burbuja
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('burbuja-grupo');
    path.setAttribute('data-grupo', nombreGrupo);
    
    // Crear path data con curvas suaves
    const pathData = crearPathSuave(puntos);
    path.setAttribute('d', pathData);
    
    // Estilo de la burbuja
    const color = coloresGrupos[nombreGrupo] || '#4ECDC4';
    path.style.cssText = `
        fill: ${color};
        fill-opacity: ${opacidadBurbujas};
        stroke: ${color};
        stroke-width: 2;
        stroke-opacity: 0.6;
        stroke-dasharray: 5,5;
        animation: burbuja-pulso 3s ease-in-out infinite alternate;
    `;
    
    svg.appendChild(path);
    
    // Crear etiqueta del grupo
    crearEtiquetaGrupo(nombreGrupo, puntos, color, svg);
    
    // Guardar referencia
    if (!gruposBurbujas[nombreGrupo]) {
        gruposBurbujas[nombreGrupo] = [];
    }
    gruposBurbujas[nombreGrupo].push(path);
}

// Función para crear path suave con curvas
function crearPathSuave(puntos) {
    if (puntos.length < 3) return '';
    
    let path = `M ${puntos[0].x} ${puntos[0].y}`;
    
    for (let i = 1; i < puntos.length; i++) {
        const punto = puntos[i];
        const siguientePunto = puntos[(i + 1) % puntos.length];
        
        // Crear curva suave hacia el siguiente punto
        const cpx = (punto.x + siguientePunto.x) / 2;
        const cpy = (punto.y + siguientePunto.y) / 2;
        
        path += ` Q ${punto.x} ${punto.y} ${cpx} ${cpy}`;
    }
    
    path += ' Z'; // Cerrar el path
    
    return path;
}

// Función para crear etiqueta del grupo
function crearEtiquetaGrupo(nombreGrupo, puntos, color, svg) {
    // Calcular posición central
    const centroX = puntos.reduce((sum, p) => sum + p.x, 0) / puntos.length;
    const centroY = puntos.reduce((sum, p) => sum + p.y, 0) / puntos.length;
    
    // Crear texto
    const texto = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    texto.classList.add('etiqueta-grupo');
    texto.setAttribute('data-grupo', nombreGrupo);
    texto.setAttribute('x', centroX);
    texto.setAttribute('y', centroY - 10);
    texto.setAttribute('text-anchor', 'middle');
    texto.textContent = formatearNombreGrupo(nombreGrupo);
    
    texto.style.cssText = `
        font-family: var(--font-primary);
        font-size: 14px;
        font-weight: 600;
        fill: ${color};
        filter: drop-shadow(1px 1px 2px rgba(255,255,255,0.8));
        pointer-events: none;
    `;
    
    svg.appendChild(texto);
}

// Función para formatear nombre del grupo para mostrar
function formatearNombreGrupo(nombreGrupo) {
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
        'barcelona': '🏛️ Barcelona'
    };
    
    return nombres[nombreGrupo] || nombreGrupo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Función para limpiar burbujas anteriores
function limpiarBurbujasAnteriores() {
    const container = document.getElementById('network');
    const svg = container.querySelector('.burbujas-svg');
    
    if (svg) {
        svg.remove();
    }
    
    gruposBurbujas = {};
}

// Función para configurar eventos de actualización
function configurarEventosBurbujas() {
    if (!network) return;
    
    // Actualizar burbujas cuando se mueven los nodos
    network.on('dragEnd', function() {
        if (burbujasActivas) {
            setTimeout(crearBurbujasGrupos, 100);
        }
    });
    
    // Actualizar burbujas cuando cambia la vista
    network.on('zoom', function() {
        if (burbujasActivas) {
            setTimeout(crearBurbujasGrupos, 100);
        }
    });
    
    // Actualizar burbujas cuando se estabiliza la física
    network.on('stabilizationIterationsDone', function() {
        if (burbujasActivas) {
            setTimeout(crearBurbujasGrupos, 200);
        }
    });
    
    console.log('✅ Eventos de burbujas configurados');
}

// Función para toggle de burbujas
function toggleBurbujas() {
    burbujasActivas = !burbujasActivas;
    
    if (burbujasActivas) {
        crearBurbujasGrupos();
        mostrarNotificacion('success', 'Burbujas de grupos activadas');
    } else {
        limpiarBurbujasAnteriores();
        mostrarNotificacion('info', 'Burbujas de grupos desactivadas');
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

// Función para mostrar panel de control de burbujas
function mostrarPanelControlBurbujas() {
    const estadisticas = obtenerEstadisticasGrupos();
    
    let html = `
        <div class="modal fade" id="modalControlBurbujas" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="icon icon-chart"></i>
                            Control de Burbujas de Grupos
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Opacidad de Burbujas</label>
                                <input type="range" class="form-range" min="0.05" max="0.5" step="0.05" 
                                       value="${opacidadBurbujas}" onchange="cambiarOpacidadBurbujas(this.value)">
                                <small class="text-muted">Transparencia de las burbujas de grupos</small>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Estado</label>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" ${burbujasActivas ? 'checked' : ''} 
                                           onchange="toggleBurbujas()">
                                    <label class="form-check-label">Mostrar burbujas de grupos</label>
                                </div>
                            </div>
                        </div>
                        
                        <h6><i class="icon icon-chart"></i> Estadísticas por Grupo:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Grupo</th>
                                        <th>Nodos</th>
                                        <th>Conexiones Internas</th>
                                        <th>Conexiones Externas</th>
                                        <th>Densidad Interna</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    Object.entries(estadisticas).forEach(([grupo, stats]) => {
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 15px; height: 15px; background: ${stats.color}; border-radius: 50%; margin-right: 8px;"></div>
                        ${formatearNombreGrupo(grupo)}
                    </div>
                </td>
                <td><span class="badge bg-primary">${stats.nodos}</span></td>
                <td><span class="badge bg-success">${stats.conexionesInternas}</span></td>
                <td><span class="badge bg-info">${stats.conexionesExternas}</span></td>
                <td><span class="badge bg-warning">${stats.densidad}</span></td>
            </tr>
        `;
    });
    
    html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="crearBurbujasGrupos()">
                            <i class="icon icon-refresh"></i> Actualizar Burbujas
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Limpiar modal anterior
    const modalAnterior = document.getElementById('modalControlBurbujas');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalControlBurbujas'));
    modal.show();
}

// Función para añadir CSS de animaciones si no existe
function añadirCSSBurbujas() {
    if (document.getElementById('css-burbujas')) return;
    
    const style = document.createElement('style');
    style.id = 'css-burbujas';
    style.textContent = `
        @keyframes burbuja-pulso {
            0% { 
                stroke-opacity: 0.4;
                fill-opacity: ${opacidadBurbujas * 0.8};
            }
            100% { 
                stroke-opacity: 0.8;
                fill-opacity: ${opacidadBurbujas * 1.2};
            }
        }
        
        .burbujas-svg {
            pointer-events: none;
        }
        
        .burbuja-grupo {
            transition: all 0.3s ease;
        }
        
        .etiqueta-grupo {
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
        }
    `;
    document.head.appendChild(style);
}

// Función principal de inicialización
function inicializarSistemaBurbujasCompleto() {
    // Esperar a que la red esté lista
    if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
        añadirCSSBurbujas();
        inicializarSistemaBurbujas();
        console.log('🫧 Sistema completo de burbujas inicializado');
    } else {
        // Reintentar después de un momento
        setTimeout(inicializarSistemaBurbujasCompleto, 1000);
    }
}

// Funciones para debugging
window.debugBurbujas = function() {
    console.log('🔍 Estado del sistema de burbujas:');
    console.log('- Burbujas activas:', burbujasActivas);
    console.log('- Opacidad:', opacidadBurbujas);
    console.log('- Grupos detectados:', obtenerGruposUnicos());
    console.log('- Colores de grupos:', coloresGrupos);
    console.log('- Estadísticas:', obtenerEstadisticasGrupos());
};

window.testBurbujas = function() {
    console.log('🧪 Test manual de burbujas');
    crearBurbujasGrupos();
};

// Exportar funciones
window.toggleBurbujas = toggleBurbujas;
window.cambiarOpacidadBurbujas = cambiarOpacidadBurbujas;
window.mostrarPanelControlBurbujas = mostrarPanelControlBurbujas;
window.crearBurbujasGrupos = crearBurbujasGrupos;
window.obtenerEstadisticasGrupos = obtenerEstadisticasGrupos;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistemaBurbujasCompleto);
} else {
    inicializarSistemaBurbujasCompleto();
}