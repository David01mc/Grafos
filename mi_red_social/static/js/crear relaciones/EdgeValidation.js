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