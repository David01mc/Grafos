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