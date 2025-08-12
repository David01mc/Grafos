// static/js/images-integration.js
// Integración del sistema de imágenes con los componentes existentes

console.log('🔌 Cargando integración del sistema de imágenes...');

// Función para agregar botón de imagen al modal de información de nodo
function agregarBotonImagenAModalInfo() {
    // Observar cuando se cree el modal de información
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.id === 'modalInfoNodo') {
                    console.log('🔧 Agregando botón de imagen al modal de información...');
                    
                    // Buscar el footer del modal
                    const footer = node.querySelector('.modal-footer');
                    if (footer) {
                        // Crear botón de gestión de imagen
                        const btnImagen = document.createElement('button');
                        btnImagen.type = 'button';
                        btnImagen.className = 'btn btn-info btn-custom me-2';
                        btnImagen.innerHTML = '<i class="icon icon-user icon-white"></i> Gestionar Imagen';
                        btnImagen.id = 'btnGestionarImagen';
                        
                        // Insertar antes del botón de enfocar
                        const btnEnfocar = footer.querySelector('#btnEnfocarNodo');
                        if (btnEnfocar) {
                            footer.insertBefore(btnImagen, btnEnfocar);
                        } else {
                            // Si no hay botón enfocar, insertar al principio
                            footer.insertBefore(btnImagen, footer.firstChild);
                        }
                        
                        console.log('✅ Botón de imagen agregado al modal de información');
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Función para integrar con el modal de creación de nodos
function integrarConModalCreacionNodos() {
    // Observar cuando se cree el modal de creación
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.id === 'modalCrearNodo') {
                    console.log('🔧 Agregando campo de imagen al modal de creación...');
                    
                    // Buscar el formulario
                    const form = node.querySelector('#formCrearNodo');
                    if (form) {
                        // Buscar el row con color y grupo
                        const colorRow = form.querySelector('.row:has(#colorNodo)');
                        if (colorRow) {
                            // Crear nueva fila para imagen
                            const imagenRow = document.createElement('div');
                            imagenRow.className = 'row mt-3';
                            imagenRow.innerHTML = `
                                <div class="col-md-12">
                                    <div class="mb-3">
                                        <label class="form-label">Imagen de Perfil</label>
                                        <input type="file" class="form-control" id="imagenNodoNuevo" name="imagen" 
                                               accept="image/jpeg,image/jpg,image/png,image/gif,image/webp">
                                        <small class="text-muted">Opcional - JPG, PNG, GIF o WebP (máx. 5MB)</small>
                                        <div class="imagen-preview-crear mt-2" style="display: none;">
                                            <img id="previewImagenCrear" style="max-width: 100px; max-height: 100px; border-radius: 8px;">
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            // Insertar después del row de color/grupo
                            colorRow.parentNode.insertBefore(imagenRow, colorRow.nextSibling);
                            
                            // Configurar preview de imagen
                            configurarPreviewCreacion();
                            
                            console.log('✅ Campo de imagen agregado al modal de creación');
                        }
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Función para configurar preview en modal de creación
function configurarPreviewCreacion() {
    const inputImagen = document.getElementById('imagenNodoNuevo');
    const previewContainer = document.querySelector('.imagen-preview-crear');
    const previewImg = document.getElementById('previewImagenCrear');
    
    if (inputImagen && previewContainer && previewImg) {
        inputImagen.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Validar archivo
                if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                    mostrarNotificacion('error', 'Tipo de archivo no permitido');
                    this.value = '';
                    previewContainer.style.display = 'none';
                    return;
                }
                
                if (file.size > 5 * 1024 * 1024) {
                    mostrarNotificacion('error', 'Archivo demasiado grande. Máximo 5MB');
                    this.value = '';
                    previewContainer.style.display = 'none';
                    return;
                }
                
                // Mostrar preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.style.display = 'none';
            }
        });
    }
}

// Función para modificar la función guardarNuevoNodo existente
function modificarGuardadoNodo() {
    // Sobrescribir la función guardarNuevoNodo para incluir imagen
    const originalGuardarNodo = window.guardarNuevoNodo;
    
    window.guardarNuevoNodo = async function() {
        const form = document.getElementById('formCrearNodo');
        if (!form) {
            console.error('❌ Formulario no encontrado');
            return;
        }
        
        // Validar campos básicos primero
        const nombre = form.querySelector('input[name="nombre"]').value.trim();
        if (!nombre || nombre.length < 2) {
            mostrarNotificacion('error', 'El nombre debe tener al menos 2 caracteres');
            return;
        }
        
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
            
            // Crear FormData con todos los campos
            const formData = new FormData();
            formData.append('nombre', nombre);
            formData.append('emoji', form.querySelector('input[name="emoji"]').value || '');
            formData.append('color', form.querySelector('input[name="color"]').value || '#4ecdc4');
            formData.append('grupo', form.querySelector('select[name="grupo"]').value || 'amigos');
            formData.append('descripcion', form.querySelector('textarea[name="descripcion"]').value || '');
            
            console.log('📤 Enviando datos de persona:', Object.fromEntries(formData));
            
            // Crear persona primero
            const response = await fetch('/api/personas', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('✅ Persona creada exitosamente');
                
                // Obtener el ID de la persona recién creada
                // Esto requiere modificar el endpoint para devolver el ID
                let personaId = null;
                try {
                    const responseData = await response.json();
                    personaId = responseData.persona_id;
                } catch (e) {
                    // Si no devuelve JSON, intentar obtener el ID de otra manera
                    console.warn('⚠️ No se pudo obtener ID de la respuesta');
                }
                
                // Si hay imagen, subirla
                const inputImagen = document.getElementById('imagenNodoNuevo');
                if (inputImagen && inputImagen.files[0] && personaId) {
                    console.log('📤 Subiendo imagen para la nueva persona...');
                    
                    const imagenFormData = new FormData();
                    imagenFormData.append('imagen', inputImagen.files[0]);
                    
                    try {
                        const imagenResponse = await fetch(`/api/personas/${personaId}/imagen`, {
                            method: 'POST',
                            body: imagenFormData
                        });
                        
                        const imagenResult = await imagenResponse.json();
                        
                        if (imagenResponse.ok && imagenResult.success) {
                            console.log('✅ Imagen subida exitosamente');
                            mostrarNotificacion('success', `Persona "${nombre}" creada con imagen exitosamente`);
                        } else {
                            console.warn('⚠️ Error subiendo imagen:', imagenResult.error);
                            mostrarNotificacion('warning', `Persona "${nombre}" creada, pero hubo un error con la imagen`);
                        }
                    } catch (imagenError) {
                        console.error('❌ Error subiendo imagen:', imagenError);
                        mostrarNotificacion('warning', `Persona "${nombre}" creada, pero no se pudo subir la imagen`);
                    }
                } else {
                    mostrarNotificacion('success', `Persona "${nombre}" creada exitosamente`);
                }
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearNodo'));
                if (modal) {
                    modal.hide();
                }
                
                // Recargar datos del grafo
                setTimeout(async () => {
                    await recargarSoloDatos();
                    
                    // Recargar imágenes
                    if (typeof cargarImagenesDisponibles === 'function') {
                        await cargarImagenesDisponibles();
                    }
                    
                    // Posicionar nodo si es posible
                    setTimeout(() => {
                        if (typeof posicionarNuevoNodo === 'function') {
                            posicionarNuevoNodo(nombre);
                        }
                    }, 500);
                }, 300);
                
            } else {
                const errorText = await response.text();
                console.error('❌ Error del servidor:', errorText);
                mostrarNotificacion('error', 'Error al crear la persona: ' + errorText);
                
                // Restaurar botón
                botonGuardar.innerHTML = textoOriginal;
                botonGuardar.disabled = false;
            }
            
        } catch (error) {
            console.error('❌ Error creando persona:', error);
            mostrarNotificacion('error', 'Error de conexión al crear la persona');
            
            // Restaurar botón
            botonGuardar.innerHTML = textoOriginal;
            botonGuardar.disabled = false;
        }
    };
    
    console.log('✅ Función guardarNuevoNodo modificada para incluir imágenes');
}

// Función para agregar botón de imagen a la administración
function agregarBotonImagenAdministracion() {
    // Observar la tabla de personas en administración
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    // Buscar tabla de personas
                    const tablaPersonas = node.querySelector('table') || 
                                        (node.tagName === 'TABLE' ? node : null);
                    
                    if (tablaPersonas && tablaPersonas.querySelector('th') && 
                        tablaPersonas.querySelector('th').textContent.includes('Persona')) {
                        
                        // Agregar columna de imagen a la cabecera
                        const cabecera = tablaPersonas.querySelector('thead tr');
                        if (cabecera && !cabecera.querySelector('.col-imagen')) {
                            const thImagen = document.createElement('th');
                            thImagen.className = 'col-imagen';
                            thImagen.textContent = 'Imagen';
                            
                            // Insertar después de la columna ID
                            const thId = cabecera.querySelector('th');
                            if (thId) {
                                cabecera.insertBefore(thImagen, thId.nextSibling);
                            }
                        }
                        
                        // Agregar botones de imagen a cada fila
                        const filas = tablaPersonas.querySelectorAll('tbody tr');
                        filas.forEach(fila => {
                            if (!fila.querySelector('.col-imagen')) {
                                const tdImagen = document.createElement('td');
                                tdImagen.className = 'col-imagen';
                                
                                // Obtener ID de la persona de la fila
                                const badge = fila.querySelector('.badge.bg-light');
                                if (badge) {
                                    const personaId = badge.textContent.trim();
                                    
                                    tdImagen.innerHTML = `
                                        <button class="btn btn-sm btn-info" onclick="gestionImagenes.mostrarModal(${personaId})">
                                            <i class="icon icon-user icon-sm"></i>
                                        </button>
                                    `;
                                }
                                
                                // Insertar después de la primera columna (ID)
                                const primerTd = fila.querySelector('td');
                                if (primerTd) {
                                    fila.insertBefore(tdImagen, primerTd.nextSibling);
                                }
                            }
                        });
                        
                        console.log('✅ Botones de imagen agregados a la administración');
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Función para configurar el evento del botón de imagen en modal de info
function configurarEventoBotonImagenModalInfo() {
    // Delegar evento para el botón de gestionar imagen
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'btnGestionarImagen') {
            // Obtener el ID del nodo desde el modal
            const modal = e.target.closest('.modal');
            if (modal) {
                // Buscar el ID en el título o en algún atributo
                const titulo = modal.querySelector('#nombrePersona');
                if (titulo && window.nodoActualInfo) {
                    const personaId = window.nodoActualInfo.id;
                    console.log('🖼️ Abriendo gestión de imagen para nodo:', personaId);
                    
                    if (typeof gestionImagenes !== 'undefined') {
                        gestionImagenes.mostrarModal(personaId);
                    } else {
                        mostrarNotificacion('error', 'Sistema de imágenes no disponible');
                    }
                }
            }
        }
    });
}

// Función para agregar estilos CSS necesarios
function agregarEstilosImagenes() {
    const estilos = `
        <style id="estilos-sistema-imagenes">
        .imagen-preview-container {
            text-align: center;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            padding: 20px;
        }
        
        .imagen-preview-actual {
            max-width: 100%;
            max-height: 200px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .sin-imagen-placeholder {
            text-align: center;
            color: #94a3b8;
        }
        
        .upload-container {
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .imagen-preview-nueva {
            text-align: center;
            margin: 15px 0;
        }
        
        .imagen-preview-nueva-img {
            max-width: 100%;
            max-height: 200px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .upload-info {
            margin-top: 15px;
        }
        
        .col-imagen {
            width: 80px;
            text-align: center;
        }
        
        /* Estilos para nodos con imagen en el grafo */
        .vis-network canvas {
            outline: none;
        }
        </style>
    `;
    
    if (!document.getElementById('estilos-sistema-imagenes')) {
        document.head.insertAdjacentHTML('beforeend', estilos);
        console.log('✅ Estilos del sistema de imágenes agregados');
    }
}

// Función principal de inicialización de la integración
function inicializarIntegracionImagenes() {
    console.log('🔌 Inicializando integración del sistema de imágenes...');
    
    // Agregar estilos
    agregarEstilosImagenes();
    
    // Configurar integraciones
    agregarBotonImagenAModalInfo();
    integrarConModalCreacionNodos();
    modificarGuardadoNodo();
    agregarBotonImagenAdministracion();
    configurarEventoBotonImagenModalInfo();
    
    console.log('✅ Integración del sistema de imágenes completada');
}

// Función de diagnóstico
window.diagnosticoSistemaImagenes = function() {
    console.log('🔍 DIAGNÓSTICO SISTEMA DE IMÁGENES:');
    console.log('===================================');
    
    console.log('📊 Estado del sistema:');
    console.log('- Sistema principal:', typeof gestionImagenes !== 'undefined' ? '✅' : '❌');
    console.log('- Red disponible:', typeof network !== 'undefined' && network ? '✅' : '❌');
    console.log('- Nodos disponibles:', typeof nodes !== 'undefined' && nodes ? `✅ (${nodes.length})` : '❌');
    
    if (typeof gestionImagenes !== 'undefined') {
        const estado = gestionImagenes.estado();
        console.log('- Imágenes cargadas:', estado.imagenesDisponibles.size);
        console.log('- Cargando:', estado.cargandoImagenes ? '🔄' : '✅');
        console.log('- Modal activo:', estado.modalActivo ? '🔄' : '✅');
    }
    
    console.log('===================================');
    console.log('💡 Funciones disponibles:');
    console.log('- gestionImagenes.mostrarModal(nodeId) - Abrir gestión de imagen');
    console.log('- gestionImagenes.cargar() - Recargar imágenes');
    console.log('- testSistemaImagenes() - Test completo');
    console.log('===================================');
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarIntegracionImagenes);
} else {
    inicializarIntegracionImagenes();
}

console.log('🔌 Sistema de integración de imágenes cargado');
console.log('💡 Ejecuta diagnosticoSistemaImagenes() para verificar el estado');