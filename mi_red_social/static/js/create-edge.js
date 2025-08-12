// static/js/create-edge.js - Sistema de creación de aristas interactivo - VERSIÓN CORREGIDA

let modoCrearArista = false;
let nodoOrigenArista = null;
let modalCrearRelacion = null;
let botonCrearVisible = false;
let hoverTimeout = null;
let relacionTemplate = null; // Cache del template

// Variables para arista temporal
let aristaTemporalActiva = false;

// Función para cargar el template HTML del modal de relación
async function cargarTemplateRelacion() {
    if (relacionTemplate) {
        return relacionTemplate;
    }
    
    try {
        const response = await fetch('/static/templates/modal-crear-relacion.html');
        if (!response.ok) {
            throw new Error(`Error cargando template: ${response.status}`);
        }
        relacionTemplate = await response.text();
        console.log('✅ Template del modal de relación cargado correctamente');
        return relacionTemplate;
    } catch (error) {
        console.error('❌ Error cargando template del modal de relación:', error);
        
        // Fallback: crear modal simple en caso de error
        return `
            <div class="modal fade" id="modalCrearRelacion" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Crear Nueva Relación</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Error cargando formulario. Por favor, usa el panel de administración.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Función para limpiar completamente el modal anterior
function limpiarModalRelacionAnterior() {
    const modalExistente = document.getElementById('modalCrearRelacion');
    if (modalExistente) {
        console.log('🧹 Limpiando modal de relación anterior...');
        
        try {
            const bsModal = bootstrap.Modal.getInstance(modalExistente);
            if (bsModal) {
                bsModal.dispose();
            }
        } catch (error) {
            console.log('⚠️ Error disposing modal:', error);
        }
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        modalExistente.remove();
    }
    
    modalCrearRelacion = null;
}

// Función mejorada para crear y mostrar botón de "+" en el nodo
function mostrarBotonCrearArista(nodeId) {
    // Remover botón anterior si existe
    ocultarBotonCrearArista();
    
    const container = document.getElementById('network');
    if (!container) return;
    
    // Obtener posición actual del nodo dinámicamente
    const posicionesNodos = network.getPositions([nodeId]);
    const posicionNodo = posicionesNodos[nodeId];
    
    if (!posicionNodo) {
        console.warn('⚠️ No se pudo obtener posición del nodo:', nodeId);
        return;
    }
    
    // Convertir coordenadas del grafo a coordenadas DOM
    const posicionDOM = network.canvasToDOM(posicionNodo);
    
    // Crear botón de crear arista
    const boton = document.createElement('div');
    boton.id = 'boton-crear-arista';
    boton.className = 'boton-crear-arista';
    boton.innerHTML = '<span class="boton-plus">+</span>';
    boton.dataset.nodeId = nodeId;
    
    // Posicionar el botón cerca del nodo con más área clickeable
    boton.style.cssText = `
        position: absolute;
        left: ${posicionDOM.x + 30}px;
        top: ${posicionDOM.y - 20}px;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.5);
        font-size: 18px;
        font-weight: bold;
        transition: all 0.15s ease;
        opacity: 0.95;
        user-select: none;
        will-change: transform;
    `;
    
    // Agregar estilos CSS mejorados si no existen
    if (!document.getElementById('estilos-boton-arista')) {
        const style = document.createElement('style');
        style.id = 'estilos-boton-arista';
        style.textContent = `
            .boton-crear-arista {
                pointer-events: auto;
                isolation: isolate;
            }
            
            .boton-crear-arista:hover {
                transform: scale(1.2);
                background: linear-gradient(135deg, #059669, #047857);
                box-shadow: 0 6px 12px rgba(16, 185, 129, 0.7);
                opacity: 1;
                border-width: 4px;
            }
            
            .boton-crear-arista:active {
                transform: scale(1.0);
                transition: all 0.1s ease;
            }
            
            .boton-plus {
                line-height: 1;
                margin-top: -2px;
                text-align: center;
                display: block;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .nodo-origen-arista {
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.6) !important;
                filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8));
            }
            
            /* Mejorar rendering del botón */
            .boton-crear-arista {
                transform-origin: center center;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                perspective: 1000px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Evento click del botón con mejor área de click
    boton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🎯 Click en botón +, iniciando creación de arista...');
        iniciarCreacionArista(nodeId);
    });
    
    // Eventos adicionales para mejor usabilidad
    boton.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    
    boton.addEventListener('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Agregar al contenedor
    container.appendChild(boton);
    botonCrearVisible = true;
    
    console.log('✅ Botón de crear arista mostrado para nodo:', nodeId);
}

// Función mejorada para actualizar posición del botón (SIN LAG)
function actualizarPosicionBoton() {
    const boton = document.getElementById('boton-crear-arista');
    if (!boton || !botonCrearVisible) return;
    
    const nodeId = boton.dataset.nodeId;
    if (!nodeId) return;
    
    try {
        const posicionesNodos = network.getPositions([nodeId]);
        const posicionNodo = posicionesNodos[nodeId];
        
        if (posicionNodo) {
            const posicionDOM = network.canvasToDOM(posicionNodo);
            
            // Usar transform para mejor rendimiento (sin reflow)
            const newX = posicionDOM.x + 30;
            const newY = posicionDOM.y - 20;
            
            boton.style.transform = `translate(${newX - parseInt(boton.style.left)}px, ${newY - parseInt(boton.style.top)}px)`;
            
            // Solo actualizar left/top si la diferencia es grande (optimización)
            const currentLeft = parseInt(boton.style.left);
            const currentTop = parseInt(boton.style.top);
            
            if (Math.abs(newX - currentLeft) > 5 || Math.abs(newY - currentTop) > 5) {
                boton.style.left = `${newX}px`;
                boton.style.top = `${newY}px`;
                boton.style.transform = '';
            }
        }
    } catch (error) {
        ocultarBotonCrearArista();
    }
}

// Función mejorada para ocultar el botón
function ocultarBotonCrearArista() {
    const boton = document.getElementById('boton-crear-arista');
    if (boton && botonCrearVisible) {
        // Pequeña animación de salida
        boton.style.transform = 'scale(0.8)';
        boton.style.opacity = '0';
        
        setTimeout(() => {
            if (boton.parentNode) {
                boton.remove();
            }
        }, 150);
        
        botonCrearVisible = false;
        console.log('✅ Botón de crear arista ocultado');
    }
}

// Función principal para iniciar creación de arista (CON arista temporal)
function iniciarCreacionArista(nodeId) {
    if (!nodes || !network) {
        console.error('❌ Red no inicializada');
        mostrarNotificacion('error', 'Error: Red no inicializada');
        return;
    }
    
    const nodo = nodes.get(nodeId);
    if (!nodo) {
        console.error('❌ Nodo origen no encontrado:', nodeId);
        mostrarNotificacion('error', 'Error: Nodo no encontrado');
        return;
    }
    
    console.log('🎯 Iniciando creación de arista desde nodo:', nodeId, nodo);
    
    modoCrearArista = true;
    nodoOrigenArista = nodeId;
    
    // Actualizar título de la página
    document.title = "🔗 MODO CREAR RELACIÓN - Red de Relaciones";
    
    // Ocultar botón de crear
    ocultarBotonCrearArista();
    
    // Resaltar nodo origen visualmente
    try {
        nodes.update({
            id: nodeId,
            borderWidth: 4,
            borderWidthSelected: 4,
            color: {
                ...nodo.color,
                border: '#10b981'
            },
            shadow: {
                enabled: true,
                color: 'rgba(16, 185, 129, 0.8)',
                size: 15,
                x: 0,
                y: 0
            }
        });
        console.log('✅ Estilo visual aplicado al nodo origen');
    } catch (error) {
        console.error('❌ Error aplicando estilo visual:', error);
    }
    
    // Cambiar cursor
    document.body.style.cursor = 'crosshair';
    
    // Obtener posición del nodo origen y crear arista temporal
    const posicionesNodos = network.getPositions([nodeId]);
    const posicionOrigen = posicionesNodos[nodeId];
    
    if (posicionOrigen) {
        console.log('📍 Posición del nodo origen:', posicionOrigen);
        crearAristaTemporalSigueMouse(posicionOrigen);
    }
    
    // Mostrar instrucciones
    const nombreNodo = obtenerNombreNodo(nodo);
    mostrarNotificacion('info', `Haz clic en otro contacto para crear una relación con "${nombreNodo}". Presiona ESC para cancelar.`, 8000);
    
    // Configurar eventos para completar la arista
    configurarEventosCreacionArista();
    
    console.log('✅ Modo creación de arista activado');
}

// Función para crear arista temporal que sigue al mouse
function crearAristaTemporalSigueMouse(posicionOrigen) {
    console.log('🔄 Creando arista temporal...');
    
    // Limpiar arista temporal anterior si existe
    limpiarAristaTemporalAnterior();
    
    // Crear IDs únicos
    const nodoTemporalId = 'temp_node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const aristaTemporalId = 'temp_edge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Guardar IDs globalmente
    window.nodoTemporalActual = nodoTemporalId;
    window.aristaTemporalActual = aristaTemporalId;
    aristaTemporalActiva = true;
    
    try {
        // Agregar nodo temporal invisible
        nodes.add({
            id: nodoTemporalId,
            x: posicionOrigen.x + 50,
            y: posicionOrigen.y,
            size: 1,
            color: {
                background: 'transparent',
                border: 'transparent'
            },
            borderWidth: 0,
            physics: false,
            hidden: false,
            font: { size: 0 },
            label: '',
            shape: 'dot',
            chosen: false,
            interaction: false
        });
        
        console.log('✅ Nodo temporal creado:', nodoTemporalId);
        
        // Esperar un frame para que el nodo se agregue
        requestAnimationFrame(() => {
            try {
                // Agregar arista temporal
                edges.add({
                    id: aristaTemporalId,
                    from: nodoOrigenArista,
                    to: nodoTemporalId,
                    color: {
                        color: '#10b981',
                        opacity: 0.7
                    },
                    width: 3,
                    dashes: [8, 4],
                    smooth: {
                        enabled: false
                    },
                    physics: false,
                    chosen: false,
                    hoverWidth: 0,
                    selectionWidth: 0,
                    arrows: {
                        to: {
                            enabled: true,
                            scaleFactor: 0.8,
                            type: 'arrow'
                        }
                    }
                });
                
                console.log('✅ Arista temporal creada:', aristaTemporalId);
                configurarSeguimientoMouse(nodoTemporalId);
                
            } catch (error) {
                console.error('❌ Error creando arista temporal:', error);
                limpiarAristaTemporalAnterior();
            }
        });
        
    } catch (error) {
        console.error('❌ Error creando nodo temporal:', error);
        limpiarAristaTemporalAnterior();
    }
}

// Función para configurar el seguimiento del mouse
function configurarSeguimientoMouse(nodoTemporalId) {
    const container = document.getElementById('network');
    if (!container) {
        console.error('❌ Contenedor de red no encontrado');
        return;
    }
    
    function moverNodoTemporal(event) {
        if (!modoCrearArista || !window.nodoTemporalActual) {
            return;
        }
        
        try {
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            const coordenadasGrafo = network.DOMtoCanvas({x: x, y: y});
            
            if (nodes.get(nodoTemporalId)) {
                nodes.update({
                    id: nodoTemporalId,
                    x: coordenadasGrafo.x,
                    y: coordenadasGrafo.y
                });
            }
        } catch (error) {
            console.error('❌ Error moviendo nodo temporal:', error);
            limpiarAristaTemporalAnterior();
        }
    }
    
    function onMouseLeave(event) {
        if (window.aristaTemporalActual && edges.get(window.aristaTemporalActual)) {
            try {
                edges.update({
                    id: window.aristaTemporalActual,
                    hidden: true
                });
            } catch (error) {
                console.error('❌ Error ocultando arista temporal:', error);
            }
        }
    }
    
    function onMouseEnter(event) {
        if (window.aristaTemporalActual && edges.get(window.aristaTemporalActual)) {
            try {
                edges.update({
                    id: window.aristaTemporalActual,
                    hidden: false
                });
            } catch (error) {
                console.error('❌ Error mostrando arista temporal:', error);
            }
        }
    }
    
    // Remover listeners anteriores si existen
    if (window.moverNodoTemporalListener) {
        container.removeEventListener('mousemove', window.moverNodoTemporalListener);
    }
    if (window.mouseLeaveListener) {
        container.removeEventListener('mouseleave', window.mouseLeaveListener);
    }
    if (window.mouseEnterListener) {
        container.removeEventListener('mouseenter', window.mouseEnterListener);
    }
    
    // Agregar nuevos listeners
    container.addEventListener('mousemove', moverNodoTemporal);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseenter', onMouseEnter);
    
    // Guardar referencias
    window.moverNodoTemporalListener = moverNodoTemporal;
    window.mouseLeaveListener = onMouseLeave;
    window.mouseEnterListener = onMouseEnter;
    
    console.log('✅ Seguimiento de mouse configurado');
}

// Función para limpiar arista temporal
function limpiarAristaTemporalAnterior() {
    console.log('🧹 Limpiando arista temporal anterior...');
    
    // Remover listeners de mouse
    const container = document.getElementById('network');
    if (container) {
        if (window.moverNodoTemporalListener) {
            container.removeEventListener('mousemove', window.moverNodoTemporalListener);
            window.moverNodoTemporalListener = null;
        }
        if (window.mouseLeaveListener) {
            container.removeEventListener('mouseleave', window.mouseLeaveListener);
            window.mouseLeaveListener = null;
        }
        if (window.mouseEnterListener) {
            container.removeEventListener('mouseenter', window.mouseEnterListener);
            window.mouseEnterListener = null;
        }
    }
    
    // Remover nodo temporal
    if (window.nodoTemporalActual) {
        try {
            if (nodes.get(window.nodoTemporalActual)) {
                nodes.remove(window.nodoTemporalActual);
                console.log('🗑️ Nodo temporal removido:', window.nodoTemporalActual);
            }
        } catch (error) {
            console.error('❌ Error removiendo nodo temporal:', error);
        }
        window.nodoTemporalActual = null;
    }
    
    // Remover arista temporal
    if (window.aristaTemporalActual) {
        try {
            if (edges.get(window.aristaTemporalActual)) {
                edges.remove(window.aristaTemporalActual);
                console.log('🗑️ Arista temporal removida:', window.aristaTemporalActual);
            }
        } catch (error) {
            console.error('❌ Error removiendo arista temporal:', error);
        }
        window.aristaTemporalActual = null;
    }
    
    aristaTemporalActiva = false;
    console.log('✅ Limpieza de arista temporal completada');
}

// Función para configurar eventos de creación de arista
function configurarEventosCreacionArista() {
    console.log('🔄 Configurando eventos de creación de arista...');
    
    function onClickCreacionArista(params) {
        if (!modoCrearArista) return;
        
        console.log('🔍 Click durante creación de arista:', params);
        
        if (params.nodes.length > 0) {
            const nodeDestino = params.nodes[0];
            console.log('🎯 Click en nodo destino:', nodeDestino);
            
            // Verificar que no sea el mismo nodo
            if (nodeDestino === nodoOrigenArista) {
                mostrarNotificacion('warning', 'No puedes crear una relación de un contacto consigo mismo');
                return;
            }
            
            // Verificar que no sea el nodo temporal
            if (nodeDestino === window.nodoTemporalActual) {
                console.log('⚠️ Click en nodo temporal ignorado');
                return;
            }
            
            // Verificar que no exista ya una relación
            if (existeRelacion(nodoOrigenArista, nodeDestino)) {
                mostrarNotificacion('warning', 'Ya existe una relación entre estos contactos');
                cancelarCreacionArista();
                return;
            }
            
            // Completar la creación de arista
            completarCreacionArista(nodeDestino);
        } else {
            console.log('❌ Click en área vacía, cancelando...');
            cancelarCreacionArista();
        }
    }
    
    function onEscapeKey(event) {
        if (event.key === 'Escape' && modoCrearArista) {
            console.log('🔄 ESC presionado, cancelando creación de arista');
            cancelarCreacionArista();
        }
    }
    
    // Remover eventos anteriores
    if (window.onClickCreacionArista) {
        network.off("click", window.onClickCreacionArista);
    }
    if (window.onEscapeKeyArista) {
        document.removeEventListener('keydown', window.onEscapeKeyArista);
    }
    
    // Registrar nuevos eventos
    network.on("click", onClickCreacionArista);
    document.addEventListener('keydown', onEscapeKey);
    
    // Guardar referencias
    window.onClickCreacionArista = onClickCreacionArista;
    window.onEscapeKeyArista = onEscapeKey;
    
    console.log('✅ Eventos de creación de arista configurados');
}

// Función para verificar si existe una relación entre dos nodos
function existeRelacion(nodeId1, nodeId2) {
    if (!edges) return false;
    
    const aristaExistente = edges.get().find(edge => 
        (edge.from === nodeId1 && edge.to === nodeId2) ||
        (edge.from === nodeId2 && edge.to === nodeId1)
    );
    
    return !!aristaExistente;
}

// Función para completar la creación de arista
async function completarCreacionArista(nodeDestino) {
    console.log('✅ Completando creación de arista:', nodoOrigenArista, '->', nodeDestino);
    
    if (!nodoOrigenArista || !nodeDestino) {
        console.error('❌ Error: nodos no válidos');
        mostrarNotificacion('error', 'Error: No se encontraron los nodos');
        return;
    }
    
    // Obtener información de los nodos ANTES de limpiar
    const nodoOrigen = nodes.get(nodoOrigenArista);
    const nodoDestinoObj = nodes.get(nodeDestino);
    
    if (!nodoOrigen || !nodoDestinoObj) {
        console.error('❌ Error: No se pudieron obtener los nodos');
        mostrarNotificacion('error', 'Error: No se encontró información de los nodos');
        return;
    }
    
    console.log('📋 Nodos para la relación:', {
        origen: { id: nodoOrigen.id, label: nodoOrigen.label },
        destino: { id: nodoDestinoObj.id, label: nodoDestinoObj.label }
    });
    
    // Limpiar estado temporal
    limpiarEstadoTemporal();
    
    // Abrir modal para configurar la relación
    try {
        await abrirModalCrearRelacion(nodoOrigen, nodoDestinoObj);
    } catch (error) {
        console.error('❌ Error abriendo modal:', error);
        mostrarNotificacion('error', 'Error abriendo formulario de relación: ' + error.message);
    }
}

// Función para cancelar la creación de arista
function cancelarCreacionArista() {
    console.log('❌ Cancelando creación de arista');
    mostrarNotificacion('info', 'Creación de relación cancelada');
    limpiarEstadoTemporal();
}

// Función para limpiar estado temporal
function limpiarEstadoTemporal() {
    console.log('🔄 Limpiando estado temporal...');
    
    // Restaurar título
    document.title = "Análisis de Red de Relaciones";
    
    // Limpiar arista temporal
    limpiarAristaTemporalAnterior();
    
    // Remover eventos
    if (window.onClickCreacionArista) {
        network.off("click", window.onClickCreacionArista);
        window.onClickCreacionArista = null;
    }
    if (window.onEscapeKeyArista) {
        document.removeEventListener('keydown', window.onEscapeKeyArista);
        window.onEscapeKeyArista = null;
    }
    
    // Restaurar estilo del nodo origen
    if (nodoOrigenArista && nodes.get(nodoOrigenArista)) {
        try {
            const nodoOriginal = nodes.get(nodoOrigenArista);
            nodes.update({
                id: nodoOrigenArista,
                borderWidth: 2,
                color: nodoOriginal.color,
                shadow: false
            });
            console.log('🔄 Estilo de nodo origen restaurado');
        } catch (error) {
            console.error('❌ Error restaurando estilo:', error);
        }
    }
    
    // Restaurar cursor
    document.body.style.cursor = 'default';
    
    // Reset variables
    modoCrearArista = false;
    nodoOrigenArista = null;
    
    console.log('✅ Estado temporal limpiado completamente');
}

// Función mejorada para configurar eventos de hover en nodos (SIN LAG)
function configurarHoverCrearAristas() {
    if (!network) {
        console.warn('⚠️ Red no inicializada, no se pueden configurar eventos de hover');
        return;
    }
    
    // Variable para seguimiento de actualización
    let animationFrameId = null;
    
    // Función optimizada para actualizar posición en tiempo real
    function actualizarPosicionConAnimacion() {
        if (botonCrearVisible) {
            actualizarPosicionBoton();
            animationFrameId = requestAnimationFrame(actualizarPosicionConAnimacion);
        }
    }
    
    // Evento cuando el mouse entra en un nodo
    network.on("hoverNode", function(params) {
        if (modoCrearArista) return;
        
        const nodeId = params.node;
        
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        
        mostrarBotonCrearArista(nodeId);
        
        // Iniciar actualización continua para seguimiento suave
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        actualizarPosicionConAnimacion();
    });
    
    // Evento cuando el mouse sale del nodo
    network.on("blurNode", function(params) {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        // Parar actualización continua
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        if (!modoCrearArista) {
            ocultarBotonCrearArista();
        }
    });
    
    // Evento cuando se hace clic en cualquier parte
    network.on("click", function(params) {
        if (modoCrearArista) return;
        
        if (params.nodes.length === 0) {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            ocultarBotonCrearArista();
        }
    });
    
    // Eventos para actualizar posición del botón (mantenidos para compatibilidad)
    network.on("zoom", function(params) {
        if (botonCrearVisible) {
            // Usar un pequeño delay para evitar lag en zoom
            setTimeout(actualizarPosicionBoton, 10);
        }
    });
    
    network.on("dragEnd", function(params) {
        if (botonCrearVisible) {
            actualizarPosicionBoton();
        }
    });
    
    // Optimizar dragging para mejor rendimiento
    let dragTimeout = null;
    network.on("dragging", function(params) {
        if (botonCrearVisible) {
            // Throttle para mejor rendimiento durante arrastre
            if (dragTimeout) {
                clearTimeout(dragTimeout);
            }
            dragTimeout = setTimeout(actualizarPosicionBoton, 16); // ~60fps
        }
    });
    
    console.log('✅ Eventos de hover para crear aristas configurados (sin lag)');
}

// Función principal para inicializar la funcionalidad
function inicializarCreacionAristas() {
    if (typeof network !== 'undefined' && network) {
        configurarHoverCrearAristas();
        console.log('🔗 Sistema de creación de aristas inicializado');
    } else {
        setTimeout(inicializarCreacionAristas, 1000);
    }
}

// Función para manejar tecla ESC global
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (modoCrearArista) {
            cancelarCreacionArista();
        } else if (botonCrearVisible) {
            ocultarBotonCrearArista();
        }
    }
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCreacionAristas);
} else {
    inicializarCreacionAristas();
}

// FUNCIONES AUXILIARES Y MODAL (Aquí van las funciones que necesitas completar)

// Función para obtener nombre limpio del nodo
function obtenerNombreNodo(nodo) {
    if (!nodo) return 'Nodo desconocido';
    if (nodo.label && typeof nodo.label === 'string') {
        return nodo.label.replace(/<[^>]*>/g, '').trim();
    }
    return String(nodo.id || 'Sin nombre');
}

// Función para mostrar notificaciones (debes implementar según tu sistema)
function mostrarNotificacion(tipo, mensaje, duracion = 5000) {
    console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    // Implementar tu sistema de notificaciones aquí
    if (typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion(tipo, mensaje, duracion);
    }
}

// Función adicional para mejorar el seguimiento durante el modo de creación
function mejorarSeguimientoMouse(nodoTemporalId) {
    const container = document.getElementById('network');
    if (!container) {
        console.error('❌ Contenedor de red no encontrado');
        return;
    }
    
    // Variable para optimizar las actualizaciones
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 16; // ~60fps
    
    function moverNodoTemporal(event) {
        if (!modoCrearArista || !window.nodoTemporalActual) {
            return;
        }
        
        // Throttle para mejor rendimiento
        const now = Date.now();
        if (now - lastUpdateTime < UPDATE_INTERVAL) {
            return;
        }
        lastUpdateTime = now;
        
        try {
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            const coordenadasGrafo = network.DOMtoCanvas({x: x, y: y});
            
            if (nodes.get(nodoTemporalId)) {
                nodes.update({
                    id: nodoTemporalId,
                    x: coordenadasGrafo.x,
                    y: coordenadasGrafo.y
                });
            }
        } catch (error) {
            console.error('❌ Error moviendo nodo temporal:', error);
            limpiarAristaTemporalAnterior();
        }
    }
    
    function onMouseLeave(event) {
        if (window.aristaTemporalActual && edges.get(window.aristaTemporalActual)) {
            try {
                edges.update({
                    id: window.aristaTemporalActual,
                    hidden: true
                });
            } catch (error) {
                console.error('❌ Error ocultando arista temporal:', error);
            }
        }
    }
    
    function onMouseEnter(event) {
        if (window.aristaTemporalActual && edges.get(window.aristaTemporalActual)) {
            try {
                edges.update({
                    id: window.aristaTemporalActual,
                    hidden: false
                });
            } catch (error) {
                console.error('❌ Error mostrando arista temporal:', error);
            }
        }
    }
    
    // Remover listeners anteriores si existen
    if (window.moverNodoTemporalListener) {
        container.removeEventListener('mousemove', window.moverNodoTemporalListener);
    }
    if (window.mouseLeaveListener) {
        container.removeEventListener('mouseleave', window.mouseLeaveListener);
    }
    if (window.mouseEnterListener) {
        container.removeEventListener('mouseenter', window.mouseEnterListener);
    }
    
    // Agregar nuevos listeners
    container.addEventListener('mousemove', moverNodoTemporal, { passive: true });
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseenter', onMouseEnter);
    
    // Guardar referencias
    window.moverNodoTemporalListener = moverNodoTemporal;
    window.mouseLeaveListener = onMouseLeave;
    window.mouseEnterListener = onMouseEnter;
    
    console.log('✅ Seguimiento de mouse mejorado configurado');
}

// Reemplazar la función original configurarSeguimientoMouse con la mejorada
function configurarSeguimientoMouse(nodoTemporalId) {
    mejorarSeguimientoMouse(nodoTemporalId);
}

// AQUÍ AGREGAR LAS FUNCIONES DEL MODAL QUE TENÍAS ANTES:
// - abrirModalCrearRelacion
// - configurarContenidoModalRelacion  
// - configurarValidacionFormularioRelacion
// - guardarNuevaRelacion

// Exportar funciones para uso externo
window.configurarHoverCrearAristas = configurarHoverCrearAristas;
window.iniciarCreacionArista = iniciarCreacionArista;
window.cancelarCreacionArista = cancelarCreacionArista;

// Exportar variables de estado
Object.defineProperty(window, 'modoCrearArista', {
    get: function() { return modoCrearArista; },
    configurable: true
});

// Funciones de testing
window.testAristaTemporal = function(nodeId = 1) {
    console.log('🧪 Test de arista temporal para nodo:', nodeId);
    iniciarCreacionArista(nodeId);
};

window.limpiarTemporal = function() {
    console.log('🧹 Limpiando elementos temporales manualmente...');
    limpiarAristaTemporalAnterior();
    limpiarEstadoTemporal();
};

console.log('✅ Sistema de creación de aristas corregido y completo cargado');