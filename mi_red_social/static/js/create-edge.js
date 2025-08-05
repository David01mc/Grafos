// static/js/create-edge.js - Sistema de creación de aristas interactivo - VERSIÓN COMPLETA CORREGIDA

let modoCrearArista = false;
let nodoOrigenArista = null;
let modalCrearRelacion = null;
let aristaTemporalId = null;
let botonCrearVisible = false;
let hoverTimeout = null;
let relacionTemplate = null; // Cache del template

// Función para cargar el template HTML del modal de relación
async function cargarTemplateRelacion() {
    if (relacionTemplate) {
        return relacionTemplate; // Usar cache si ya existe
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

// Función para crear y mostrar botón de "+" en el nodo
function mostrarBotonCrearArista(nodeId, posicion) {
    // Remover botón anterior si existe
    ocultarBotonCrearArista();
    
    const container = document.getElementById('network');
    if (!container) return;
    
    // Crear botón de crear arista
    const boton = document.createElement('div');
    boton.id = 'boton-crear-arista';
    boton.className = 'boton-crear-arista';
    boton.innerHTML = '<i class="icon icon-plus"></i>';
    
    // Posicionar el botón cerca del nodo
    boton.style.cssText = `
        position: absolute;
        left: ${posicion.x + 20}px;
        top: ${posicion.y - 10}px;
        width: 30px;
        height: 30px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        font-size: 14px;
        font-weight: bold;
        transition: all 0.3s ease;
        animation: aparecerBoton 0.3s ease-out;
    `;
    
    // Agregar animación CSS si no existe
    if (!document.getElementById('animacion-boton-arista')) {
        const style = document.createElement('style');
        style.id = 'animacion-boton-arista';
        style.textContent = `
            @keyframes aparecerBoton {
                0% { 
                    transform: scale(0) rotate(180deg); 
                    opacity: 0; 
                }
                100% { 
                    transform: scale(1) rotate(0deg); 
                    opacity: 1; 
                }
            }
            
            @keyframes desaparecerBoton {
                0% { 
                    transform: scale(1) rotate(0deg); 
                    opacity: 1; 
                }
                100% { 
                    transform: scale(0) rotate(-180deg); 
                    opacity: 0; 
                }
            }
            
            .boton-crear-arista:hover {
                transform: scale(1.2);
                background: linear-gradient(135deg, #059669, #047857);
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            }
            
            .arista-temporal {
                stroke: #10b981 !important;
                stroke-width: 3px !important;
                stroke-dasharray: 5,5 !important;
                animation: pulsarArista 1s infinite;
            }
            
            @keyframes pulsarArista {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 0.4; }
            }
            
            .nodo-origen-arista {
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.5) !important;
                animation: brillarNodo 1s infinite alternate;
            }
            
            @keyframes brillarNodo {
                0% { filter: brightness(1); }
                100% { filter: brightness(1.3); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Evento click del botón - CORREGIDO para evitar propagación
    boton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🎯 Click en botón +, iniciando creación de arista...');
        iniciarCreacionArista(nodeId);
    });
    
    // Agregar al contenedor
    container.appendChild(boton);
    botonCrearVisible = true;
    
    console.log('✅ Botón de crear arista mostrado para nodo:', nodeId);
}

// Función para ocultar el botón de crear arista
function ocultarBotonCrearArista() {
    const boton = document.getElementById('boton-crear-arista');
    if (boton && botonCrearVisible) {
        boton.style.animation = 'desaparecerBoton 0.3s ease-in';
        setTimeout(() => {
            if (boton.parentNode) {
                boton.remove();
            }
        }, 300);
        botonCrearVisible = false;
        console.log('✅ Botón de crear arista ocultado');
    }
}

// Función para iniciar el modo de creación de arista
function iniciarCreacionArista(nodeId) {
    if (!nodes || !network) {
        console.error('❌ Red no inicializada');
        mostrarNotificacion('error', 'Error: Red no inicializada');
        return;
    }
    
    // Obtener información del nodo origen
    const nodo = nodes.get(nodeId);
    if (!nodo) {
        console.error('❌ Nodo origen no encontrado:', nodeId);
        mostrarNotificacion('error', 'Error: Nodo no encontrado');
        return;
    }
    
    console.log('🎯 Iniciando creación de arista desde nodo:', nodeId, nodo);
    
    modoCrearArista = true;
    nodoOrigenArista = nodeId;
    
    // DEBUG: Actualizar título de la página para confirmar el modo
    document.title = "🔗 MODO CREAR RELACIÓN - Red de Relaciones";
    
    // Ocultar botón de crear
    ocultarBotonCrearArista();
    
    // Resaltar nodo origen visualmente
    const posicionesNodos = network.getPositions([nodeId]);
    const posicionOrigen = posicionesNodos[nodeId];
    
    console.log('📍 Posición del nodo origen:', posicionOrigen);
    
    // Aplicar estilo visual al nodo origen
    try {
        nodes.update({
            id: nodeId,
            borderWidth: 4,
            borderWidthSelected: 4,
            color: {
                ...nodo.color,
                border: '#10b981'
            }
        });
        console.log('✅ Estilo visual aplicado al nodo origen');
    } catch (error) {
        console.error('❌ Error aplicando estilo visual:', error);
    }
    
    // Cambiar cursor
    document.body.style.cursor = 'crosshair';
    console.log('✅ Cursor cambiado a crosshair');
    
    // Crear arista temporal que sigue al mouse
    crearAristaTemporalSigueMouse(posicionOrigen);
    
    // Mostrar instrucciones
    const nombreNodo = obtenerNombreNodo(nodo);
    mostrarNotificacion('info', `Haz clic en otro contacto para crear una relación con "${nombreNodo}". Presiona ESC para cancelar.`, 10000);
    
    // Configurar eventos para completar la arista
    configurarEventosCreacionArista();
    
    console.log('✅ Modo creación de arista activado completamente. modoCrearArista =', modoCrearArista);
}

// Función para crear arista temporal que sigue al mouse
function crearAristaTemporalSigueMouse(posicionOrigen) {
    console.log('🔄 Creando arista temporal...');
    
    // Eliminar arista temporal anterior si existe
    if (aristaTemporalId && edges.get(aristaTemporalId)) {
        edges.remove(aristaTemporalId);
    }
    
    // Crear nodo temporal invisible para el extremo de la arista
    const nodoTemporalId = 'temp_node_' + Date.now();
    aristaTemporalId = 'temp_edge_' + Date.now();
    
    try {
        // Agregar nodo temporal invisible
        nodes.add({
            id: nodoTemporalId,
            x: posicionOrigen.x + 50,
            y: posicionOrigen.y,
            size: 0.1,
            opacity: 0,
            physics: false,
            hidden: true
        });
        
        // Agregar arista temporal
        edges.add({
            id: aristaTemporalId,
            from: nodoOrigenArista,
            to: nodoTemporalId,
            color: {
                color: '#10b981',
                opacity: 0.8
            },
            width: 3,
            dashes: [5, 5],
            smooth: false,
            physics: false
        });
        
        console.log('✅ Arista temporal creada');
    } catch (error) {
        console.error('❌ Error creando arista temporal:', error);
    }
    
    // Evento para mover el nodo temporal con el mouse
    const container = document.getElementById('network');
    
    function moverAristaTemporal(event) {
        if (!modoCrearArista) return;
        
        try {
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Convertir coordenadas de pantalla a coordenadas del grafo
            const coordenadasGrafo = network.DOMtoCanvas({x, y});
            
            // Actualizar posición del nodo temporal
            nodes.update({
                id: nodoTemporalId,
                x: coordenadasGrafo.x,
                y: coordenadasGrafo.y
            });
        } catch (error) {
            console.error('❌ Error moviendo arista temporal:', error);
        }
    }
    
    container.addEventListener('mousemove', moverAristaTemporal);
    
    // Guardar función para poder removerla después
    window.moverAristaTemporal = moverAristaTemporal;
    window.nodoTemporalId = nodoTemporalId;
    
    console.log('✅ Eventos de mouse configurados para arista temporal');
}

// Función para configurar eventos de creación de arista
function configurarEventosCreacionArista() {
    console.log('🔄 Configurando eventos de creación de arista...');
    
    // Evento UNIFICADO para manejar todos los clics durante la creación de arista
    function onClickCreacionArista(params) {
        if (!modoCrearArista) return;
        
        console.log('🔍 Click durante creación de arista:', params);
        
        // Si se hizo clic en un nodo
        if (params.nodes.length > 0) {
            const nodeDestino = params.nodes[0];
            console.log('🎯 Click en nodo destino:', nodeDestino);
            
            // Verificar que no sea el mismo nodo
            if (nodeDestino === nodoOrigenArista) {
                mostrarNotificacion('warning', 'No puedes crear una relación de un contacto consigo mismo');
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
            // Si se hizo clic en área vacía, cancelar
            console.log('❌ Click en área vacía, cancelando...');
            cancelarCreacionArista();
        }
    }
    
    // Evento para cancelar con tecla ESC
    function onEscapeKey(event) {
        if (event.key === 'Escape' && modoCrearArista) {
            console.log('🔄 ESC presionado, cancelando creación de arista');
            cancelarCreacionArista();
        }
    }
    
    // Remover eventos anteriores primero
    if (window.onClickCreacionArista) {
        network.off("click", window.onClickCreacionArista);
        console.log('🔄 Evento click anterior removido');
    }
    if (window.onEscapeKeyArista) {
        document.removeEventListener('keydown', window.onEscapeKeyArista);
        console.log('🔄 Evento ESC anterior removido');
    }
    
    // Registrar evento unificado
    network.on("click", onClickCreacionArista);
    document.addEventListener('keydown', onEscapeKey);
    
    // Guardar referencias para poder removerlas después
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
    
    // Validar que tenemos los IDs
    if (!nodoOrigenArista) {
        console.error('❌ Error: nodoOrigenArista es null o undefined');
        mostrarNotificacion('error', 'Error: No se encontró el nodo origen');
        return;
    }
    
    if (!nodeDestino) {
        console.error('❌ Error: nodeDestino es null o undefined');
        mostrarNotificacion('error', 'Error: No se encontró el nodo destino');
        return;
    }
    
    // IMPORTANTE: Obtener la información de los nodos ANTES de limpiar el estado
    console.log('🔍 Buscando nodo origen con ID:', nodoOrigenArista);
    const nodoOrigen = nodes.get(nodoOrigenArista);
    console.log('🔍 Nodo origen encontrado:', nodoOrigen);
    
    console.log('🔍 Buscando nodo destino con ID:', nodeDestino);
    const nodoDestinoObj = nodes.get(nodeDestino);
    console.log('🔍 Nodo destino encontrado:', nodoDestinoObj);
    
    if (!nodoOrigen) {
        console.error('❌ Error: No se pudo obtener el nodo origen con ID:', nodoOrigenArista);
        mostrarNotificacion('error', 'Error: No se encontró información del nodo origen');
        return;
    }
    
    if (!nodoDestinoObj) {
        console.error('❌ Error: No se pudo obtener el nodo destino con ID:', nodeDestino);
        mostrarNotificacion('error', 'Error: No se encontró información del nodo destino');
        return;
    }
    
    console.log('📋 Nodos para la relación:', {
        origen: { id: nodoOrigen.id, label: nodoOrigen.label },
        destino: { id: nodoDestinoObj.id, label: nodoDestinoObj.label }
    });
    
    // AHORA sí limpiar el estado temporal (después de obtener los nodos)
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
    
    // DEBUG: Restaurar título de la página
    document.title = "Análisis de Red de Relaciones";
    
    // Remover eventos
    if (window.onClickCreacionArista) {
        network.off("click", window.onClickCreacionArista);
        console.log('🔄 Evento de click removido');
    }
    if (window.onEscapeKeyArista) {
        document.removeEventListener('keydown', window.onEscapeKeyArista);
        console.log('🔄 Evento ESC removido');
    }
    
    // Remover evento de mouse
    const container = document.getElementById('network');
    if (container && window.moverAristaTemporal) {
        container.removeEventListener('mousemove', window.moverAristaTemporal);
        console.log('🔄 Evento mouse removido');
    }
    
    // Remover nodo y arista temporal
    if (window.nodoTemporalId && nodes.get(window.nodoTemporalId)) {
        nodes.remove(window.nodoTemporalId);
        console.log('🔄 Nodo temporal removido');
    }
    if (aristaTemporalId && edges.get(aristaTemporalId)) {
        edges.remove(aristaTemporalId);
        console.log('🔄 Arista temporal removida');
    }
    
    // Restaurar estilo del nodo origen
    if (nodoOrigenArista && nodes.get(nodoOrigenArista)) {
        try {
            const nodoOriginal = nodes.get(nodoOrigenArista);
            nodes.update({
                id: nodoOrigenArista,
                borderWidth: 2,
                color: nodoOriginal.color
            });
            console.log('🔄 Estilo de nodo origen restaurado');
        } catch (error) {
            console.error('❌ Error restaurando estilo:', error);
        }
    }
    
    // Restaurar cursor
    document.body.style.cursor = 'default';
    console.log('🔄 Cursor restaurado');
    
    // Reset variables
    modoCrearArista = false;
    nodoOrigenArista = null;
    aristaTemporalId = null;
    window.nodoTemporalId = null;
    window.moverAristaTemporal = null;
    window.onClickCreacionArista = null;
    window.onEscapeKeyArista = null;
    
    console.log('✅ Estado temporal limpiado completamente. modoCrearArista =', modoCrearArista);
}

// Función para abrir modal de crear relación
async function abrirModalCrearRelacion(nodoOrigen, nodoDestino) {
    console.log('🔄 Iniciando apertura de modal de relación...');
    
    // Limpiar modal anterior
    limpiarModalRelacionAnterior();
    console.log('✅ Modal anterior limpiado');
    
    // Cargar template
    console.log('🔄 Cargando template del modal...');
    const modalHTML = await cargarTemplateRelacion();
    console.log('✅ Template cargado, longitud:', modalHTML.length);
    
    // Agregar modal al DOM
    console.log('🔄 Agregando modal al DOM...');
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Modal agregado al DOM');
    
    // Verificar que el modal se creó correctamente
    const modalElement = document.getElementById('modalCrearRelacion');
    if (!modalElement) {
        console.error('❌ Error: No se pudo crear el modal de relación');
        mostrarNotificacion('error', 'Error creando el formulario de relación');
        return false;
    }
    console.log('✅ Elemento modal encontrado:', modalElement);
    
    // Verificar que Bootstrap está disponible
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Error: Bootstrap no está disponible');
        mostrarNotificacion('error', 'Error: Bootstrap no disponible');
        return false;
    }
    console.log('✅ Bootstrap confirmado disponible');
    
    // Inicializar modal de Bootstrap
    console.log('🔄 Inicializando modal de Bootstrap...');
    try {
        modalCrearRelacion = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: true
        });
        console.log('✅ Modal de Bootstrap inicializado');
    } catch (error) {
        console.error('❌ Error inicializando modal de Bootstrap:', error);
        mostrarNotificacion('error', 'Error inicializando modal: ' + error.message);
        return false;
    }
    
    // Configurar contenido del modal
    console.log('🔄 Configurando contenido del modal...');
    configurarContenidoModalRelacion(nodoOrigen, nodoDestino);
    console.log('✅ Contenido del modal configurado');
    
    // Configurar eventos del modal
    modalElement.addEventListener('shown.bs.modal', function() {
        console.log('✅ Modal de relación mostrado correctamente');
        const tipoInput = document.getElementById('tipoRelacion');
        if (tipoInput) {
            tipoInput.focus();
        }
    });
    
    // Limpiar al cerrar modal
    modalElement.addEventListener('hidden.bs.modal', function() {
        console.log('🔄 Modal de relación ocultado, limpiando estado...');
        setTimeout(() => {
            limpiarModalRelacionAnterior();
        }, 100);
    });
    
    // Mostrar modal
    console.log('🔄 Intentando mostrar modal...');
    try {
        modalCrearRelacion.show();
        console.log('✅ Comando show() ejecutado correctamente');
        
        // Verificar si el modal se está mostrando después de un pequeño delay
        setTimeout(() => {
            const isShowing = modalElement.classList.contains('show');
            console.log('🔍 ¿Modal visible después de 500ms?', isShowing);
            if (!isShowing) {
                console.warn('⚠️ El modal no parece estar visible, intentando forzar...');
                // Intentar forzar la visualización
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                document.body.classList.add('modal-open');
                console.log('🔧 Forzando visualización del modal');
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Error mostrando modal de relación:', error);
        limpiarModalRelacionAnterior();
        mostrarNotificacion('error', 'Error al mostrar el formulario de relación: ' + error.message);
        return false;
    }
    
    return true;
}

// Función para configurar contenido del modal
function configurarContenidoModalRelacion(nodoOrigen, nodoDestino) {
    const nombreOrigen = obtenerNombreNodo(nodoOrigen);
    const nombreDestino = obtenerNombreNodo(nodoDestino);
    
    console.log('🔄 Configurando modal para:', nombreOrigen, '↔', nombreDestino);
    
    // Actualizar título
    const titulo = document.getElementById('tituloModalRelacion');
    if (titulo) {
        titulo.innerHTML = `
            <i class="icon icon-link"></i>
            Crear Relación: ${nombreOrigen} ↔ ${nombreDestino}
        `;
        console.log('✅ Título actualizado');
    } else {
        console.warn('⚠️ Elemento título no encontrado');
    }
    
    // Configurar información de los nodos
    const infoOrigen = document.getElementById('infoNodoOrigen');
    const infoDestino = document.getElementById('infoNodoDestino');
    
    if (infoOrigen) {
        infoOrigen.innerHTML = `
            <div class="d-flex align-items-center">
                <div style="width: 20px; height: 20px; background-color: ${nodoOrigen.color}; border-radius: 50%; margin-right: 10px;"></div>
                <strong>${nombreOrigen}</strong>
            </div>
        `;
        console.log('✅ Info origen configurada');
    } else {
        console.warn('⚠️ Elemento infoOrigen no encontrado');
    }
    
    if (infoDestino) {
        infoDestino.innerHTML = `
            <div class="d-flex align-items-center">
                <div style="width: 20px; height: 20px; background-color: ${nodoDestino.color}; border-radius: 50%; margin-right: 10px;"></div>
                <strong>${nombreDestino}</strong>
            </div>
        `;
        console.log('✅ Info destino configurada');
    } else {
        console.warn('⚠️ Elemento infoDestino no encontrado');
    }
    
    // Guardar IDs para uso posterior
    const form = document.getElementById('formCrearRelacion');
    if (form) {
        form.dataset.origenId = nodoOrigen.id;
        form.dataset.destinoId = nodoDestino.id;
        console.log('✅ IDs guardados en el formulario:', nodoOrigen.id, '->', nodoDestino.id);
    } else {
        console.warn('⚠️ Formulario no encontrado');
    }
    
    // Configurar validación
    configurarValidacionFormularioRelacion();
    console.log('✅ Configuración del modal completada');
}

// Función para obtener nombre limpio del nodo
function obtenerNombreNodo(nodo) {
    // Validar que el nodo existe
    if (!nodo) {
        console.error('❌ obtenerNombreNodo: nodo es undefined o null');
        return 'Nodo desconocido';
    }
    
    // Validar que tiene las propiedades esperadas
    if (typeof nodo !== 'object') {
        console.error('❌ obtenerNombreNodo: nodo no es un objeto:', nodo);
        return String(nodo);
    }
    
    // Intentar obtener el label
    if (nodo.label && typeof nodo.label === 'string') {
        return nodo.label.replace(/<[^>]*>/g, '').trim();
    }
    
    // Fallback al ID
    if (nodo.id !== undefined) {
        return String(nodo.id);
    }
    
    // Último fallback
    console.warn('⚠️ obtenerNombreNodo: no se pudo determinar nombre para:', nodo);
    return 'Nodo sin nombre';
}

// Función para configurar validación del formulario de relación
function configurarValidacionFormularioRelacion() {
    const fortalezaInput = document.getElementById('fortalezaRelacion');
    const fortalezaDisplay = document.getElementById('fortalezaDisplay');
    
    if (fortalezaInput && fortalezaDisplay) {
        // Actualizar display de fortaleza en tiempo real
        fortalezaInput.addEventListener('input', function() {
            const valor = this.value;
            fortalezaDisplay.textContent = `${valor}/10`;
            
            // Cambiar color según fortaleza
            if (valor >= 8) {
                fortalezaDisplay.className = 'badge bg-success';
            } else if (valor >= 6) {
                fortalezaDisplay.className = 'badge bg-warning';
            } else if (valor >= 4) {
                fortalezaDisplay.className = 'badge bg-info';
            } else {
                fortalezaDisplay.className = 'badge bg-secondary';
            }
        });
        
        // Disparar evento inicial
        fortalezaInput.dispatchEvent(new Event('input'));
    }
}

// Función para guardar la nueva relación
async function guardarNuevaRelacion() {
    const form = document.getElementById('formCrearRelacion');
    if (!form) {
        console.error('❌ Formulario de relación no encontrado');
        return;
    }
    
    const formData = new FormData();
    formData.append('persona1_id', form.dataset.origenId);
    formData.append('persona2_id', form.dataset.destinoId);
    formData.append('tipo', document.getElementById('tipoRelacion').value);
    formData.append('fortaleza', document.getElementById('fortalezaRelacion').value);
    formData.append('contexto', document.getElementById('contextoRelacion').value);
    
    const botonGuardar = document.getElementById('btnGuardarRelacion');
    if (!botonGuardar) {
        console.error('❌ Botón guardar relación no encontrado');
        return;
    }
    
    const textoOriginal = botonGuardar.innerHTML;
    
    try {
        // Mostrar estado de carga
        botonGuardar.innerHTML = '<i class="icon icon-refresh icon-spin"></i> Creando relación...';
        botonGuardar.disabled = true;
        
        console.log('📤 Enviando datos de relación:', Object.fromEntries(formData));
        
        // Enviar datos al servidor
        const response = await fetch('/agregar_relacion', {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        if (response.ok) {
            console.log('✅ Relación creada exitosamente');
            
            // Cerrar modal
            if (modalCrearRelacion) {
                modalCrearRelacion.hide();
            }
            
            // Esperar un poco para que el modal se cierre
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Recargar datos del grafo
            await recargarSoloDatos();
            
            mostrarNotificacion('success', 'Relación creada exitosamente');
            
        } else {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            mostrarNotificacion('error', 'Error al crear la relación: ' + errorText);
            
            // Restaurar botón en caso de error
            botonGuardar.innerHTML = textoOriginal;
            botonGuardar.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Error creando relación:', error);
        mostrarNotificacion('error', 'Error de conexión al crear la relación');
        
        // Restaurar botón en caso de error
        botonGuardar.innerHTML = textoOriginal;
        botonGuardar.disabled = false;
    }
}

// Función para configurar eventos de hover en nodos
function configurarHoverCrearAristas() {
    if (!network) {
        console.warn('⚠️ Red no inicializada, no se pueden configurar eventos de hover');
        return;
    }
    
    // Evento cuando el mouse entra en un nodo
    network.on("hoverNode", function(params) {
        // No mostrar botón si estamos en modo creación de arista
        if (modoCrearArista) return;
        
        const nodeId = params.node;
        
        // Cancelar timeout anterior si existe
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        
        // Mostrar botón después de un pequeño delay
        hoverTimeout = setTimeout(() => {
            // Verificar nuevamente que no estamos en modo creación de arista
            if (modoCrearArista) return;
            
            const posicionesNodos = network.getPositions([nodeId]);
            const posicionNodo = posicionesNodos[nodeId];
            
            if (posicionNodo) {
                // Convertir coordenadas del grafo a coordenadas DOM
                const posicionDOM = network.canvasToDOM(posicionNodo);
                mostrarBotonCrearArista(nodeId, posicionDOM);
            }
        }, 500); // Delay de 500ms para evitar mostrar el botón accidentalmente
    });
    
    // Evento cuando el mouse sale del nodo
    network.on("blurNode", function(params) {
        // Cancelar timeout si existe
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        // Ocultar botón después de un pequeño delay
        setTimeout(() => {
            // Solo ocultar si no estamos en modo creación de arista
            if (!modoCrearArista) {
                ocultarBotonCrearArista();
            }
        }, 200);
    });
    
    // Evento cuando se hace clic en cualquier parte
    network.on("click", function(params) {
        // Solo procesar si NO estamos en modo creación de arista
        if (modoCrearArista) return;
        
        // Ocultar botón si no se hizo clic en un nodo
        if (params.nodes.length === 0) {
            ocultarBotonCrearArista();
        }
    });
    
    console.log('✅ Eventos de hover para crear aristas configurados');
}

// Función principal para inicializar la funcionalidad
function inicializarCreacionAristas() {
    // Esperar a que la red esté lista
    if (typeof network !== 'undefined' && network) {
        configurarHoverCrearAristas();
        console.log('🔗 Sistema de creación de aristas inicializado');
    } else {
        // Reintentar después de un momento
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

// Exportar funciones para uso externo
window.configurarHoverCrearAristas = configurarHoverCrearAristas;
window.guardarNuevaRelacion = guardarNuevaRelacion;
window.cancelarCreacionArista = cancelarCreacionArista;

// Exportar variables de estado para otros scripts
Object.defineProperty(window, 'modoCrearArista', {
    get: function() { return modoCrearArista; },
    configurable: true
});

// Función de debug manual
window.debugCrearArista = function() {
    console.log('🔍 Estado actual del sistema de creación de aristas:');
    console.log('- modoCrearArista:', modoCrearArista);
    console.log('- nodoOrigenArista:', nodoOrigenArista);
    console.log('- botonCrearVisible:', botonCrearVisible);
    console.log('- modalCrearRelacion:', modalCrearRelacion);
    console.log('- aristaTemporalId:', aristaTemporalId);
    console.log('- Bootstrap disponible:', typeof bootstrap !== 'undefined');
    console.log('- Network disponible:', typeof network !== 'undefined');
    console.log('- Nodes disponible:', typeof nodes !== 'undefined');
    console.log('- Edges disponible:', typeof edges !== 'undefined');
    
    // Verificar si hay modal en el DOM
    const modalElement = document.getElementById('modalCrearRelacion');
    console.log('- Modal en DOM:', !!modalElement);
    if (modalElement) {
        console.log('- Modal visible:', modalElement.classList.contains('show'));
        console.log('- Modal display:', modalElement.style.display);
    }
};

// Función para test manual del modal
window.testModalRelacion = async function() {
    console.log('🧪 Test manual del modal de relación');
    
    // Crear nodos de prueba
    const nodoTest1 = { id: 'test1', label: 'Nodo Test 1', color: '#ff0000' };
    const nodoTest2 = { id: 'test2', label: 'Nodo Test 2', color: '#00ff00' };
    
    try {
        await abrirModalCrearRelacion(nodoTest1, nodoTest2);
        console.log('✅ Test completado');
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
};

// Función para test directo del botón +
window.testBotonMas = function(nodeId) {
    if (!nodeId) nodeId = 1; // Usar nodo 1 por defecto
    console.log('🧪 Test manual del botón + para nodo:', nodeId);
    iniciarCreacionArista(nodeId);
};

// Función para verificar los nodos disponibles
window.verificarNodos = function() {
    console.log('🔍 Verificando nodos disponibles...');
    if (!nodes) {
        console.error('❌ Variable nodes no disponible');
        return;
    }
    
    const todosLosNodos = nodes.get();
    console.log('📊 Total de nodos:', todosLosNodos.length);
    
    todosLosNodos.forEach((nodo, index) => {
        console.log(`Nodo ${index + 1}:`, {
            id: nodo.id,
            label: nodo.label,
            color: nodo.color,
            tipo: typeof nodo
        });
    });
    
    return todosLosNodos;
};

// Función para test completo paso a paso
window.testCreacionCompleta = function(origenId, destinoId) {
    if (!origenId) origenId = 1;
    if (!destinoId) destinoId = 2;
    
    console.log('🧪 Test completo de creación de arista:', origenId, '->', destinoId);
    
    // Verificar nodos
    const nodos = verificarNodos();
    const nodoOrigen = nodes.get(origenId);
    const nodoDestino = nodes.get(destinoId);
    
    console.log('🔍 Nodo origen:', nodoOrigen);
    console.log('🔍 Nodo destino:', nodoDestino);
    
    if (!nodoOrigen) {
        console.error('❌ No se encontró nodo origen con ID:', origenId);
        return;
    }
    
    if (!nodoDestino) {
        console.error('❌ No se encontró nodo destino con ID:', destinoId);
        return;
    }
    
    // Simular el proceso completo
    console.log('🎯 Simulando completarCreacionArista...');
    completarCreacionArista(destinoId);
};