// static/js/create-node.js - Sistema de creación de nodos con template HTML externo

let creandoNodo = false;
let modalCrearNodo = null;
let posicionNuevoNodo = { x: 0, y: 0 };
let modalTemplate = null; // Cache del template

// Función para cargar el template HTML del modal
async function cargarTemplateModal() {
    if (modalTemplate) {
        return modalTemplate; // Usar cache si ya existe
    }
    
    try {
        const response = await fetch('/static/templates/modal-crear-nodo.html');
        if (!response.ok) {
            throw new Error(`Error cargando template: ${response.status}`);
        }
        modalTemplate = await response.text();
        console.log('✅ Template del modal cargado correctamente');
        return modalTemplate;
    } catch (error) {
        console.error('❌ Error cargando template del modal:', error);
        
        // Fallback: crear modal simple en caso de error
        return `
            <div class="modal fade" id="modalCrearNodo" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Crear Nueva Persona</h5>
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

// Función para crear el modal de creación de nodo
async function crearModalNodo() {
    // Verificar si ya existe el modal
    const modalExistente = document.getElementById('modalCrearNodo');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Cargar template HTML
    const modalHTML = await cargarTemplateModal();
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Verificar que el modal se creó correctamente
    const modalElement = document.getElementById('modalCrearNodo');
    if (!modalElement) {
        console.error('❌ Error: No se pudo crear el modal');
        return;
    }
    
    // Inicializar modal de Bootstrap
    modalCrearNodo = new bootstrap.Modal(modalElement);
    
    // Configurar eventos del modal
    modalElement.addEventListener('shown.bs.modal', function() {
        const nombreInput = document.getElementById('nombreNodo');
        if (nombreInput) {
            nombreInput.focus();
        }
    });
    
    // Limpiar formulario al cerrar modal
    modalElement.addEventListener('hidden.bs.modal', function() {
        limpiarFormularioNodo();
        creandoNodo = false;
        
        // Asegurar que el botón vuelva a su estado original
        const botonGuardar = document.getElementById('btnGuardarNodo');
        if (botonGuardar) {
            botonGuardar.innerHTML = '<i class="icon icon-plus icon-white"></i> Crear Persona';
            botonGuardar.disabled = false;
        }
    });
    
    // Configurar preview del color
    const colorInput = document.getElementById('colorNodo');
    if (colorInput) {
        colorInput.addEventListener('change', function() {
            mostrarPreviewColor(this.value);
        });
    }
    
    // Validar formulario en tiempo real
    configurarValidacionFormulario();
    
    console.log('✅ Modal creado y configurado correctamente');
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
    
    // Eliminar indicador anterior si existe
    const indicadorAnterior = document.getElementById('indicador-posicion');
    if (indicadorAnterior) {
        indicadorAnterior.remove();
    }
    
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
async function abrirModalCrearNodo() {
    creandoNodo = true;
    
    // Crear el modal cargando el template
    await crearModalNodo();
    
    // Verificar que el modal se creó correctamente
    if (!modalCrearNodo) {
        console.error('❌ Error: No se pudo crear el modal');
        mostrarNotificacion('error', 'Error al abrir el formulario. Usa el panel de administración.');
        return;
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
    const nombreInput = document.getElementById('nombreNodo');
    const emojiInput = document.getElementById('emojiNodo');
    const colorInput = document.getElementById('colorNodo');
    const grupoInput = document.getElementById('grupoNodo');
    const descripcionInput = document.getElementById('descripcionNodo');
    
    if (nombreInput) nombreInput.value = '';
    if (emojiInput) emojiInput.value = '';
    if (colorInput) colorInput.value = '#4ecdc4';
    if (grupoInput) grupoInput.value = 'amigos';
    if (descripcionInput) descripcionInput.value = '';
    
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
    if (!colorInput) return;
    
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
    
    if (nombreInput) {
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
    }
    
    if (emojiInput) {
        // Validación del emoji (máximo 2 caracteres)
        emojiInput.addEventListener('input', function() {
            if (this.value.length > 2) {
                this.value = this.value.slice(0, 2);
            }
        });
    }
}

// Función para guardar el nuevo nodo
async function guardarNuevoNodo() {
    const form = document.getElementById('formCrearNodo');
    if (!form) {
        console.error('❌ Formulario no encontrado');
        return;
    }
    
    const formData = new FormData(form);
    
    // Validar campos requeridos
    const nombre = formData.get('nombre').trim();
    if (!nombre || nombre.length < 2) {
        mostrarNotificacion('error', 'El nombre debe tener al menos 2 caracteres');
        const nombreInput = document.getElementById('nombreNodo');
        if (nombreInput) nombreInput.focus();
        return;
    }
    
    // Obtener referencia al botón y estado original
    const botonGuardar = document.getElementById('btnGuardarNodo');
    if (!botonGuardar) {
        console.error('❌ Botón guardar no encontrado');
        return;
    }
    
    const textoOriginal = botonGuardar.innerHTML;
    
    try {
        // Mostrar estado de carga
        botonGuardar.innerHTML = '<i class="icon icon-refresh icon-spin"></i> Creando...';
        botonGuardar.disabled = true;
        
        console.log('📤 Enviando datos:', Object.fromEntries(formData));
        
        // Enviar datos al servidor
        const response = await fetch('/agregar_persona', {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        if (response.ok) {
            console.log('✅ Persona creada exitosamente');
            
            // Cerrar modal
            modalCrearNodo.hide();
            
            // Recargar SOLO los datos del grafo, sin recrear la red
            await recargarSoloDatos();
            
            // Buscar el nuevo nodo y posicionarlo
            setTimeout(() => {
                posicionarNuevoNodo(nombre);
            }, 500);
            
            mostrarNotificacion('success', `Persona "${nombre}" creada exitosamente`);
            
        } else {
            // Manejar errores del servidor
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            mostrarNotificacion('error', 'Error al crear la persona: ' + errorText);
        }
        
    } catch (error) {
        console.error('❌ Error creando nodo:', error);
        mostrarNotificacion('error', 'Error de conexión al crear la persona');
    } finally {
        // Restaurar botón SIEMPRE
        if (botonGuardar) {
            botonGuardar.innerHTML = textoOriginal;
            botonGuardar.disabled = false;
        }
    }
}

// Nueva función para recargar solo los datos sin recrear toda la red
async function recargarSoloDatos() {
    try {
        console.log('🔄 Recargando solo datos...');
        
        const response = await fetch('/api/grafo');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Nuevos datos recibidos:', data);
        
        if (nodes && edges) {
            // Actualizar datasets existentes
            nodes.clear();
            nodes.add(data.nodes);
            
            edges.clear();
            edges.add(data.edges);
            
            // Actualizar estadísticas
            document.getElementById('total-personas').textContent = data.nodes.length;
            document.getElementById('total-conexiones').textContent = data.edges.length;
            
            // Calcular densidad
            const totalNodos = data.nodes.length;
            const maxPosiblesConexiones = totalNodos > 1 ? (totalNodos * (totalNodos - 1)) / 2 : 0;
            const densidad = maxPosiblesConexiones > 0 ? ((data.edges.length / maxPosiblesConexiones) * 100).toFixed(1) : 0;
            document.getElementById('densidad-red').textContent = densidad + '%';
            
            // Calcular persona más conectada
            let personaMasConectada = 'Ninguna';
            if (data.nodes.length > 0) {
                const conteoConexiones = {};
                
                // Inicializar conteo
                data.nodes.forEach(node => {
                    conteoConexiones[node.id] = 0;
                });
                
                // Contar conexiones
                data.edges.forEach(edge => {
                    if (conteoConexiones.hasOwnProperty(edge.from)) {
                        conteoConexiones[edge.from]++;
                    }
                    if (conteoConexiones.hasOwnProperty(edge.to)) {
                        conteoConexiones[edge.to]++;
                    }
                });
                
                // Encontrar el más conectado
                let maxConexiones = 0;
                let nodeIdMasConectado = null;
                
                for (const [nodeId, conexiones] of Object.entries(conteoConexiones)) {
                    if (conexiones > maxConexiones) {
                        maxConexiones = conexiones;
                        nodeIdMasConectado = nodeId;
                    }
                }
                
                if (nodeIdMasConectado) {
                    const nodeMasConectado = data.nodes.find(node => node.id == nodeIdMasConectado);
                    if (nodeMasConectado && nodeMasConectado.label) {
                        personaMasConectada = nodeMasConectado.label.replace(/<[^>]*>/g, '').trim();
                    }
                }
            }
            
            document.getElementById('mas-conectado').textContent = personaMasConectada;
            
            console.log('✅ Datos actualizados correctamente');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error recargando datos:', error);
        throw error;
    }
}

// Función para posicionar el nuevo nodo en la posición del doble clic
function posicionarNuevoNodo(nombrePersona) {
    if (!nodes || !network) {
        console.warn('⚠️ Nodes o network no disponibles para posicionamiento');
        return;
    }
    
    // Buscar el nodo recién creado por nombre
    const nodosActuales = nodes.get();
    const nuevoNodo = nodosActuales.find(node => 
        node.label && node.label.includes(nombrePersona)
    );
    
    if (nuevoNodo) {
        console.log('🎯 Posicionando nodo:', nuevoNodo.id, 'en:', posicionNuevoNodo);
        
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
        
        console.log(`✅ Nodo "${nombrePersona}" posicionado correctamente`);
        
        // Eliminar indicador de posición si existe
        const indicador = document.getElementById('indicador-posicion');
        if (indicador) {
            indicador.remove();
        }
    } else {
        console.warn('⚠️ No se encontró el nodo recién creado para posicionamiento');
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
        console.log('🎯 Sistema de creación de nodos inicializado');
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