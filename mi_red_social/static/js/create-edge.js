// static/js/create-edge.js - Sistema de creación de aristas interactivo

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
        
        const bsModal = bootstrap.Modal.getInstance(modalExistente);
        if (bsModal) {
            bsModal.dispose();
        }
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        modalExistente.remove();
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        console.log('✅ Modal de relación anterior limpiado completamente');
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
    
    // Evento click del botón
    boton.addEventListener('click', function(e) {
        e.stopPropagation();
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
        return;
    }
    
    // Obtener información del nodo origen
    const nodo = nodes.get(nodeId);
    if (!nodo) {
        console.error('❌ Nodo origen no encontrado:', nodeId);
        return;
    }
    
    modoCrearArista = true;
    nodoOrigenArista = nodeId;
    
    // Ocultar botón de crear
    ocultarBotonCrearArista();
    
    // Resaltar nodo origen visualmente
    const posicionesNodos = network.getPositions([nodeId]);
    const posicionOrigen = posicionesNodos[nodeId];
    
    // Aplicar estilo visual al nodo origen
    nodes.update({
        id: nodeId,
        borderWidth: 4,
        borderWidthSelected: 4,
        color: {
            ...nodo.color,
            border: '#10b981'
        }
    });
    
    // Cambiar cursor
    document.body.style.cursor = 'crosshair';
    
    // Crear arista temporal que sigue al mouse
    crearAristaTemporalSigueMouse(posicionOrigen);
    
    // Mostrar instrucciones
    mostrarNotificacion('info', `Arrastra hasta otro contacto para crear una relación con "${obtenerNombreNodo(nodo)}"`, 8000);
    
    // Configurar eventos para completar la arista
    configurarEventosCreacionArista();
    
    console.log('🎯 Modo creación de arista iniciado desde nodo:', nodeId);
}

// Función para crear arista temporal que sigue al mouse
function crearAristaTemporalSigueMouse(posicionOrigen) {
    // Eliminar arista temporal anterior si existe
    if (aristaTemporalId && edges.get(aristaTemporalId)) {
        edges.remove(aristaTemporalId);
    }
    
    // Crear nodo temporal invisible para el extremo de la arista
    const nodoTemporalId = 'temp_node_' + Date.now();
    aristaTemporalId = 'temp_edge_' + Date.now();
    
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
    
    // Evento para mover el nodo temporal con el mouse
    const container = document.getElementById('network');
    
    function moverAristaTemporal(event) {
        if (!modoCrearArista) return;
        
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
    }
    
    container.addEventListener('mousemove', moverAristaTemporal);
    
    // Guardar función para poder removerla después
    window.moverAristaTemporal = moverAristaTemporal;
    window.nodoTemporalId = nodoTemporalId;
}

// Función para configurar eventos de creación de arista
function configurarEventosCreacionArista() {
    // Evento para detectar clic en nodo destino
    function onNodeClick(params) {
        if (!modoCrearArista) return;
        
        if (params.nodes.length > 0) {
            const nodeDestino = params.nodes[0];
            
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
        }
    }
    
    // Evento para cancelar con clic en área vacía
    function onBackgroundClick(params) {
        if (!modoCrearArista) return;
        
        if (params.nodes.length === 0) {
            cancelarCreacionArista();
        }
    }
    
    // Evento para cancelar con tecla ESC
    function onEscapeKey(event) {
        if (event.key === 'Escape' && modoCrearArista) {
            cancelarCreacionArista();
        }
    }
    
    // Registrar eventos
    network.on("click", onNodeClick);
    network.on("click", onBackgroundClick);
    document.addEventListener('keydown', onEscapeKey);
    
    // Guardar referencias para poder removerlas después
    window.onNodeClickArista = onNodeClick;
    window.onBackgroundClickArista = onBackgroundClick;
    window.onEscapeKeyArista = onEscapeKey;
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
    
    // Limpiar estado temporal
    limpiarEstadoTemporal();
    
    // Obtener información de ambos nodos
    const nodoOrigen = nodes.get(nodoOrigenArista);
    const nodoDestinoObj = nodes.get(nodeDestino);
    
    if (!nodoOrigen || !nodoDestinoObj) {
        console.error('❌ Error obteniendo nodos para la relación');
        mostrarNotificacion('error', 'Error obteniendo información de los contactos');
        return;
    }
    
    // Abrir modal para configurar la relación
    await abrirModalCrearRelacion(nodoOrigen, nodoDestinoObj);
}

// Función para cancelar la creación de arista
function cancelarCreacionArista() {
    console.log('❌ Cancelando creación de arista');
    
    mostrarNotificacion('info', 'Creación de relación cancelada');
    limpiarEstadoTemporal();
}

// Función para limpiar estado temporal
function limpiarEstadoTemporal() {
    // Remover eventos
    if (window.onNodeClickArista) {
        network.off("click", window.onNodeClickArista);
        network.off("click", window.onBackgroundClickArista);
        document.removeEventListener('keydown', window.onEscapeKeyArista);
    }
    
    // Remover evento de mouse
    const container = document.getElementById('network');
    if (container && window.moverAristaTemporal) {
        container.removeEventListener('mousemove', window.moverAristaTemporal);
    }
    
    // Remover nodo y arista temporal
    if (window.nodoTemporalId && nodes.get(window.nodoTemporalId)) {
        nodes.remove(window.nodoTemporalId);
    }
    if (aristaTemporalId && edges.get(aristaTemporalId)) {
        edges.remove(aristaTemporalId);
    }
    
    // Restaurar estilo del nodo origen
    if (nodoOrigenArista && nodes.get(nodoOrigenArista)) {
        const nodoOriginal = nodes.get(nodoOrigenArista);
        nodes.update({
            id: nodoOrigenArista,
            borderWidth: 2,
            color: nodoOriginal.color
        });
    }
    
    // Restaurar cursor
    document.body.style.cursor = 'default';
    
    // Reset variables
    modoCrearArista = false;
    nodoOrigenArista = null;
    aristaTemporalId = null;
    window.nodoTemporalId = null;
    window.moverAristaTemporal = null;
    window.onNodeClickArista = null;
    window.onBackgroundClickArista = null;
    window.onEscapeKeyArista = null;
}

// Función para abrir modal de crear relación
async function abrirModalCrearRelacion(nodoOrigen, nodoDestino) {
    // Limpiar modal anterior
    limpiarModalRelacionAnterior();
    
    // Cargar template
    const modalHTML = await cargarTemplateRelacion();
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Verificar que el modal se creó correctamente
    const modalElement = document.getElementById('modalCrearRelacion');
    if (!modalElement) {
        console.error('❌ Error: No se pudo crear el modal de relación');
        return false;
    }
    
    // Inicializar modal de Bootstrap
    modalCrearRelacion = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: true
    });
    
    // Configurar contenido del modal
    configurarContenidoModalRelacion(nodoOrigen, nodoDestino);
    
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
    try {
        modalCrearRelacion.show();
        console.log('✅ Modal de relación mostrado correctamente');
        
    } catch (error) {
        console.error('❌ Error mostrando modal de relación:', error);
        limpiarModalRelacionAnterior();
        mostrarNotificacion('error', 'Error al mostrar el formulario de relación');
    }
}

// Función para configurar contenido del modal
function configurarContenidoModalRelacion(nodoOrigen, nodoDestino) {
    const nombreOrigen = obtenerNombreNodo(nodoOrigen);
    const nombreDestino = obtenerNombreNodo(nodoDestino);
    
    // Actualizar título
    const titulo = document.getElementById('tituloModalRelacion');
    if (titulo) {
        titulo.innerHTML = `
            <i class="icon icon-link"></i>
            Crear Relación: ${nombreOrigen} ↔ ${nombreDestino}
        `;
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
    }
    
    if (infoDestino) {
        infoDestino.innerHTML = `
            <div class="d-flex align-items-center">
                <div style="width: 20px; height: 20px; background-color: ${nodoDestino.color}; border-radius: 50%; margin-right: 10px;"></div>
                <strong>${nombreDestino}</strong>
            </div>
        `;
    }
    
    // Guardar IDs para uso posterior
    document.getElementById('formCrearRelacion').dataset.origenId = nodoOrigen.id;
    document.getElementById('formCrearRelacion').dataset.destinoId = nodoDestino.id;
    
    // Configurar validación
    configurarValidacionFormularioRelacion();
}

// Función para obtener nombre limpio del nodo
function obtenerNombreNodo(nodo) {
    if (nodo.label) {
        return nodo.label.replace(/<[^>]*>/g, '').trim();
    }
    return nodo.id.toString();
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
    
    // Evento cuando se hace clic en cualquier parte (para ocultar botón)
    network.on("click", function(params) {
        // Solo ocultar si no se hizo clic en un nodo y no estamos creando arista
        if (params.nodes.length === 0 && !modoCrearArista) {
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