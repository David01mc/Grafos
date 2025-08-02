// static/js/create-node.js - Sistema de creación de nodos con doble clic

let creandoNodo = false;
let modalCrearNodo = null;
let posicionNuevoNodo = { x: 0, y: 0 };

// Función para crear el modal de creación de nodo
function crearModalNodo() {
    // Crear modal HTML dinámicamente
    const modalHTML = `
        <div class="modal fade" id="modalCrearNodo" tabindex="-1" aria-labelledby="modalCrearNodoLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalCrearNodoLabel">
                            <i class="icon icon-plus"></i>
                            Crear Nueva Persona
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formCrearNodo">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Nombre *</label>
                                        <input type="text" class="form-control" id="nombreNodo" name="nombre" required 
                                               placeholder="Ej: Juan Pérez">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Emoji</label>
                                        <input type="text" class="form-control" id="emojiNodo" name="emoji" 
                                               placeholder="😊" maxlength="2">
                                        <small class="text-muted">Opcional - Representa a la persona</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Color</label>
                                        <input type="color" class="form-control" id="colorNodo" name="color" value="#4ecdc4">
                                        <small class="text-muted">Color del nodo en el grafo</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Grupo Social</label>
                                        <select class="form-control" id="grupoNodo" name="grupo">
                                            <option value="amigos">👫 Amigos</option>
                                            <option value="familia_cercana">👨‍👩‍👧‍👦 Familia Cercana</option>
                                            <option value="trabajo">💼 Trabajo</option>
                                            <option value="universidad">🎓 Universidad</option>
                                            <option value="deportes">⚽ Deportes</option>
                                            <option value="vecinos">🏠 Vecinos</option>
                                            <option value="nuevo">✨ Nuevo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="descripcionNodo" name="descripcion" rows="2" 
                                          placeholder="Ej: Compañero de trabajo desde 2020, fan del fútbol"></textarea>
                                <small class="text-muted">Información adicional sobre esta persona</small>
                            </div>
                            
                            <div class="alert alert-info">
                                <i class="icon icon-target"></i>
                                <strong>Posición:</strong> El nodo se creará en la posición donde hiciste doble clic en el grafo.
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="icon icon-close"></i>
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-success btn-custom" onclick="guardarNuevoNodo()">
                            <i class="icon icon-plus icon-white"></i>
                            Crear Persona
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Inicializar modal de Bootstrap
    modalCrearNodo = new bootstrap.Modal(document.getElementById('modalCrearNodo'));
    
    // Configurar eventos del modal
    document.getElementById('modalCrearNodo').addEventListener('shown.bs.modal', function() {
        document.getElementById('nombreNodo').focus();
    });
    
    // Limpiar formulario al cerrar modal
    document.getElementById('modalCrearNodo').addEventListener('hidden.bs.modal', function() {
        limpiarFormularioNodo();
        creandoNodo = false;
    });
    
    // Configurar preview del color
    document.getElementById('colorNodo').addEventListener('change', function() {
        mostrarPreviewColor(this.value);
    });
    
    // Validar formulario en tiempo real
    configurarValidacionFormulario();
}

// Función para configurar la funcionalidad de doble clic
function configurarDobleClickCrearNodo() {
    if (!network) {
        console.warn('⚠️ Red no inicializada, no se puede configurar doble clic');
        return;
    }
    
    // Evento de doble clic en el área vacía del grafo
    network.on("doubleClick", function(params) {
        // Solo crear nodo si no se hizo clic en un nodo existente
        if (params.nodes.length === 0) {
            const canvasPosition = params.pointer.canvas;
            
            // Convertir posición del canvas a coordenadas del grafo
            posicionNuevoNodo = network.canvasToDOM(canvasPosition);
            
            console.log('🎯 Doble clic detectado en posición:', posicionNuevoNodo);
            
            // Mostrar indicador visual temporal
            mostrarIndicadorPosicion(canvasPosition);
            
            // Abrir modal para crear nodo
            abrirModalCrearNodo();
        }
    });
    
    console.log('✅ Funcionalidad de doble clic configurada');
}

// Función para mostrar indicador visual en la posición seleccionada
function mostrarIndicadorPosicion(canvasPos) {
    const container = document.getElementById('network');
    
    // Crear indicador temporal
    const indicador = document.createElement('div');
    indicador.id = 'indicador-posicion';
    indicador.style.cssText = `
        position: absolute;
        left: ${canvasPos.x - 10}px;
        top: ${canvasPos.y - 10}px;
        width: 20px;
        height: 20px;
        border: 3px solid #10b981;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.2);
        animation: pulso 1s infinite;
        z-index: 1000;
        pointer-events: none;
    `;
    
    // Agregar animación CSS si no existe
    if (!document.getElementById('animacion-pulso')) {
        const style = document.createElement('style');
        style.id = 'animacion-pulso';
        style.textContent = `
            @keyframes pulso {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    container.appendChild(indicador);
    
    // Eliminar indicador después de 3 segundos
    setTimeout(() => {
        const indicadorElement = document.getElementById('indicador-posicion');
        if (indicadorElement) {
            indicadorElement.remove();
        }
    }, 3000);
}

// Función para abrir el modal de creación
function abrirModalCrearNodo() {
    creandoNodo = true;
    
    if (!modalCrearNodo) {
        crearModalNodo();
    }
    
    // Limpiar formulario antes de mostrar
    limpiarFormularioNodo();
    
    // Mostrar modal
    modalCrearNodo.show();
    
    // Mostrar notificación
    mostrarNotificacion('info', 'Completa los datos para crear una nueva persona en esta posición');
}

// Función para limpiar el formulario
function limpiarFormularioNodo() {
    document.getElementById('nombreNodo').value = '';
    document.getElementById('emojiNodo').value = '';
    document.getElementById('colorNodo').value = '#4ecdc4';
    document.getElementById('grupoNodo').value = 'amigos';
    document.getElementById('descripcionNodo').value = '';
    
    // Limpiar preview del color
    const preview = document.querySelector('.color-preview-modal');
    if (preview) {
        preview.remove();
    }
    
    // Limpiar estilos de validación
    document.querySelectorAll('#formCrearNodo .form-control').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
}

// Función para mostrar preview del color
function mostrarPreviewColor(color) {
    const colorInput = document.getElementById('colorNodo');
    
    // Remover preview anterior
    const oldPreview = document.querySelector('.color-preview-modal');
    if (oldPreview) {
        oldPreview.remove();
    }
    
    // Crear nuevo preview
    const preview = document.createElement('div');
    preview.className = 'color-preview-modal';
    preview.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${color};
        border-radius: 50%;
        display: inline-block;
        margin-left: 10px;
        border: 2px solid #ccc;
        vertical-align: middle;
    `;
    
    colorInput.parentNode.appendChild(preview);
}

// Función para configurar validación del formulario
function configurarValidacionFormulario() {
    const nombreInput = document.getElementById('nombreNodo');
    const emojiInput = document.getElementById('emojiNodo');
    
    // Validación del nombre
    nombreInput.addEventListener('input', function() {
        if (this.value.trim().length >= 2) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });
    
    // Validación del emoji (máximo 2 caracteres)
    emojiInput.addEventListener('input', function() {
        if (this.value.length > 2) {
            this.value = this.value.slice(0, 2);
        }
    });
}

// Función para guardar el nuevo nodo
async function guardarNuevoNodo() {
    const form = document.getElementById('formCrearNodo');
    const formData = new FormData(form);
    
    // Validar campos requeridos
    const nombre = formData.get('nombre').trim();
    if (!nombre || nombre.length < 2) {
        mostrarNotificacion('error', 'El nombre debe tener al menos 2 caracteres');
        document.getElementById('nombreNodo').focus();
        return;
    }
    
    try {
        // Mostrar estado de carga
        const botonGuardar = document.querySelector('#modalCrearNodo .btn-success');
        const textoOriginal = botonGuardar.innerHTML;
        botonGuardar.innerHTML = '<i class="icon icon-refresh icon-spin"></i> Creando...';
        botonGuardar.disabled = true;
        
        // Enviar datos al servidor
        const response = await fetch('/agregar_persona', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Cerrar modal
            modalCrearNodo.hide();
            
            // Recargar datos del grafo
            await recargarDatos();
            
            // Buscar el nuevo nodo y posicionarlo
            setTimeout(() => {
                posicionarNuevoNodo(nombre);
            }, 500);
            
            mostrarNotificacion('success', `Persona "${nombre}" creada exitosamente`);
            
        } else {
            // Manejar errores del servidor
            const errorText = await response.text();
            mostrarNotificacion('error', 'Error al crear la persona: ' + errorText);
        }
        
    } catch (error) {
        console.error('❌ Error creando nodo:', error);
        mostrarNotificacion('error', 'Error de conexión al crear la persona');
    } finally {
        // Restaurar botón
        const botonGuardar = document.querySelector('#modalCrearNodo .btn-success');
        if (botonGuardar) {
            botonGuardar.innerHTML = textoOriginal;
            botonGuardar.disabled = false;
        }
    }
}

// Función para posicionar el nuevo nodo en la posición del doble clic
function posicionarNuevoNodo(nombrePersona) {
    if (!nodes || !network) return;
    
    // Buscar el nodo recién creado por nombre
    const nodosActuales = nodes.get();
    const nuevoNodo = nodosActuales.find(node => 
        node.label && node.label.includes(nombrePersona)
    );
    
    if (nuevoNodo) {
        // Actualizar posición del nodo
        nodes.update({
            id: nuevoNodo.id,
            x: posicionNuevoNodo.x,
            y: posicionNuevoNodo.y
        });
        
        // Centrar la vista en el nuevo nodo
        network.focus(nuevoNodo.id, {
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
        
        console.log(`✅ Nodo "${nombrePersona}" posicionado en:`, posicionNuevoNodo);
        
        // Eliminar indicador de posición si existe
        const indicador = document.getElementById('indicador-posicion');
        if (indicador) {
            indicador.remove();
        }
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(tipo, mensaje) {
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    // Crear notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notification notification-${tipo}`;
    
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notificacion.innerHTML = `
        <span class="notification-icon">${iconos[tipo] || 'ℹ️'}</span>
        <span class="notification-message">${mensaje}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notificacion);
    
    // Mostrar notificación
    setTimeout(() => {
        notificacion.classList.add('notification-show');
    }, 100);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.classList.remove('notification-show');
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Función para inicializar la funcionalidad
function inicializarCreacionNodos() {
    // Esperar a que la red esté lista
    if (typeof network !== 'undefined' && network) {
        configurarDobleClickCrearNodo();
    } else {
        // Reintentalar después de un momento
        setTimeout(inicializarCreacionNodos, 1000);
    }
}

// Función para manejar tecla ESC para cancelar
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && creandoNodo) {
        if (modalCrearNodo) {
            modalCrearNodo.hide();
        }
    }
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCreacionNodos);
} else {
    inicializarCreacionNodos();
}

// Exportar funciones para uso externo
window.configurarDobleClickCrearNodo = configurarDobleClickCrearNodo;
window.guardarNuevoNodo = guardarNuevoNodo;