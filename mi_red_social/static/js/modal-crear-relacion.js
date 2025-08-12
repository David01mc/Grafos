// static/js/modal-crear-relacion.js - Sistema completo del modal de crear relaciones

console.log('📋 Cargando sistema de modal de crear relaciones...');

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
        const response = await fetch('/api/relaciones', {
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
            if (typeof recargarSoloDatos === 'function') {
                await recargarSoloDatos();
            } else {
                console.warn('⚠️ Función recargarSoloDatos no disponible');
                // Recargar página como fallback
                window.location.reload();
            }
            
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

// Template HTML del modal (fallback si no hay archivo externo)
function obtenerTemplateModalFallback() {
    return `
        <div class="modal fade" id="modalCrearRelacion" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="tituloModalRelacion">
                            <i class="icon icon-link"></i>
                            Crear Nueva Relación
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formCrearRelacion">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Desde:</label>
                                    <div id="infoNodoOrigen" class="p-2 bg-light rounded">
                                        <strong>Nodo Origen</strong>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Hacia:</label>
                                    <div id="infoNodoDestino" class="p-2 bg-light rounded">
                                        <strong>Nodo Destino</strong>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="tipoRelacion" class="form-label">Tipo de Relación</label>
                                    <select class="form-select" id="tipoRelacion" required>
                                        <option value="">Seleccionar tipo...</option>
                                        <option value="familiar">Familiar</option>
                                        <option value="amistad">Amistad</option>
                                        <option value="laboral">Laboral</option>
                                        <option value="academico">Académico</option>
                                        <option value="romantico">Romántico</option>
                                        <option value="profesional">Profesional</option>
                                        <option value="vecinal">Vecinal</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="fortalezaRelacion" class="form-label">
                                        Fortaleza de la Relación 
                                        <span id="fortalezaDisplay" class="badge bg-secondary">5/10</span>
                                    </label>
                                    <input type="range" class="form-range" id="fortalezaRelacion" 
                                           min="1" max="10" value="5" required>
                                    <div class="d-flex justify-content-between">
                                        <small class="text-muted">Débil</small>
                                        <small class="text-muted">Fuerte</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="contextoRelacion" class="form-label">Contexto/Notas</label>
                                <textarea class="form-control" id="contextoRelacion" rows="3" 
                                          placeholder="¿Cómo se conocieron? ¿En qué contexto interactúan?"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="icon icon-x"></i> Cancelar
                        </button>
                        <button type="button" class="btn btn-success" id="btnGuardarRelacion" onclick="guardarNuevaRelacion()">
                            <i class="icon icon-plus"></i> Crear Relación
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función mejorada para cargar template con fallback
async function cargarTemplateRelacion() {
    // Si ya hay template en cache, usarlo
    if (typeof relacionTemplate !== 'undefined' && relacionTemplate) {
        return relacionTemplate;
    }
    
    try {
        const response = await fetch('/static/templates/modal-crear-relacion.html');
        if (!response.ok) {
            throw new Error(`Error cargando template: ${response.status}`);
        }
        const template = await response.text();
        
        // Guardar en cache si la variable global existe
        if (typeof window.relacionTemplate !== 'undefined') {
            window.relacionTemplate = template;
        }
        
        console.log('✅ Template del modal de relación cargado desde archivo');
        return template;
    } catch (error) {
        console.error('❌ Error cargando template del modal de relación:', error);
        console.log('🔄 Usando template fallback incorporado...');
        
        // Usar template fallback
        const fallbackTemplate = obtenerTemplateModalFallback();
        
        // Guardar en cache si la variable global existe
        if (typeof window.relacionTemplate !== 'undefined') {
            window.relacionTemplate = fallbackTemplate;
        }
        
        return fallbackTemplate;
    }
}

// Función de utilidad para obtener nombre del nodo (por si no está definida)
function obtenerNombreNodo(nodo) {
    if (!nodo) return 'Nodo desconocido';
    if (nodo.label && typeof nodo.label === 'string') {
        return nodo.label.replace(/<[^>]*>/g, '').trim();
    }
    return String(nodo.id || 'Sin nombre');
}

// Función de utilidad para mostrar notificaciones (por si no está definida)
function mostrarNotificacion(tipo, mensaje, duracion = 5000) {
    console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    
    // Intentar usar función global si existe
    if (typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion(tipo, mensaje, duracion);
        return;
    }
    
    // Intentar usar toastr si está disponible
    if (typeof toastr !== 'undefined') {
        toastr[tipo](mensaje);
        return;
    }
    
    // Intentar usar SweetAlert si está disponible
    if (typeof Swal !== 'undefined') {
        const iconMap = {
            'success': 'success',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };
        
        Swal.fire({
            icon: iconMap[tipo] || 'info',
            title: mensaje,
            timer: 3000,
            showConfirmButton: false
        });
        return;
    }
    
    // Fallback: alert del navegador para errores importantes
    if (tipo === 'error') {
        alert(`Error: ${mensaje}`);
    }
}

// Función para limpiar modal (por si no está definida en el otro archivo)
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
    
    // Limpiar variable global si existe
    if (typeof window.modalCrearRelacion !== 'undefined') {
        window.modalCrearRelacion = null;
    }
}

// Exportar funciones para uso global
window.abrirModalCrearRelacion = abrirModalCrearRelacion;
window.configurarContenidoModalRelacion = configurarContenidoModalRelacion;
window.configurarValidacionFormularioRelacion = configurarValidacionFormularioRelacion;
window.guardarNuevaRelacion = guardarNuevaRelacion;
window.cargarTemplateRelacion = cargarTemplateRelacion;
window.limpiarModalRelacionAnterior = limpiarModalRelacionAnterior;

// Función de testing para el modal
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

console.log('✅ Sistema de modal de crear relaciones cargado');
console.log('💡 Funciones disponibles:');
console.log('  - abrirModalCrearRelacion(nodoOrigen, nodoDestino)');
console.log('  - guardarNuevaRelacion()');
console.log('  - testModalRelacion() - para testing');