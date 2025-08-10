// static/js/images-manager.js
// Sistema de gestión de imágenes para nodos del grafo

console.log('📸 Cargando sistema de gestión de imágenes...');

// Estado del sistema de imágenes
const imagenesEstado = {
    imagenesDisponibles: new Map(),
    cargandoImagenes: false,
    modalActivo: null
};

// Configuración de imágenes
const IMAGENES_CONFIG = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    defaultSize: 150, // Tamaño del nodo con imagen
    previewSize: 200 // Tamaño del preview en modal
};

// Función para cargar todas las imágenes disponibles
async function cargarImagenesDisponibles() {
    if (imagenesEstado.cargandoImagenes) {
        console.log('⏳ Ya se están cargando imágenes...');
        return;
    }
    
    imagenesEstado.cargandoImagenes = true;
    
    try {
        console.log('📥 Cargando imágenes desde servidor...');
        
        const response = await fetch('/obtener_imagenes');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Limpiar mapa anterior
            imagenesEstado.imagenesDisponibles.clear();
            
            // Cargar nuevas imágenes
            Object.entries(data.imagenes).forEach(([personaId, info]) => {
                imagenesEstado.imagenesDisponibles.set(parseInt(personaId), {
                    nombre: info.nombre,
                    imagen_url: info.imagen_url,
                    timestamp: Date.now()
                });
            });
            
            console.log(`✅ ${imagenesEstado.imagenesDisponibles.size} imágenes cargadas`);
            
            // Aplicar imágenes a los nodos existentes
            aplicarImagenesANodos();
            
            return true;
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Error cargando imágenes:', error);
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', 'Error cargando imágenes de usuarios');
        }
        
        return false;
    } finally {
        imagenesEstado.cargandoImagenes = false;
    }
}

// Función para aplicar imágenes a los nodos del grafo
function aplicarImagenesANodos() {
    if (!nodes || nodes.length === 0) {
        console.log('📝 No hay nodos disponibles para aplicar imágenes');
        return;
    }
    
    const nodosActuales = nodes.get();
    const updates = [];
    
    nodosActuales.forEach(nodo => {
        const imagenInfo = imagenesEstado.imagenesDisponibles.get(nodo.id);
        
        if (imagenInfo) {
            // Nodo con imagen
            updates.push({
                id: nodo.id,
                shape: 'image',
                image: imagenInfo.imagen_url,
                size: IMAGENES_CONFIG.defaultSize,
                borderWidth: 3,
                borderWidthSelected: 5,
                color: {
                    border: nodo.color || '#4ECDC4',
                    background: 'white'
                },
                chosen: {
                    node: function(values, id, selected, hovering) {
                        values.borderWidth = selected ? 5 : 3;
                        values.shadow = selected || hovering;
                        values.shadowColor = 'rgba(0,0,0,0.3)';
                        values.shadowSize = selected ? 15 : 10;
                    }
                }
            });
            
            console.log(`🖼️ Imagen aplicada al nodo ${nodo.id}: ${imagenInfo.nombre}`);
        } else {
            // Nodo sin imagen - mantener estilo original
            if (nodo.shape === 'image') {
                updates.push({
                    id: nodo.id,
                    shape: 'dot',
                    image: undefined,
                    size: 30,
                    borderWidth: 2,
                    color: nodo.color || '#4ECDC4'
                });
                
                console.log(`🔄 Imagen removida del nodo ${nodo.id}`);
            }
        }
    });
    
    if (updates.length > 0) {
        nodes.update(updates);
        console.log(`✅ ${updates.length} nodos actualizados con cambios de imagen`);
    }
}

// Función para subir imagen de un nodo
async function subirImagenNodo(personaId, file) {
    if (!file) {
        mostrarNotificacion('error', 'No se seleccionó ningún archivo');
        return false;
    }
    
    // Validar archivo
    if (!IMAGENES_CONFIG.allowedTypes.includes(file.type)) {
        mostrarNotificacion('error', 'Tipo de archivo no permitido. Usa JPG, PNG, GIF o WebP');
        return false;
    }
    
    if (file.size > IMAGENES_CONFIG.maxFileSize) {
        const sizeMB = (IMAGENES_CONFIG.maxFileSize / (1024 * 1024)).toFixed(0);
        mostrarNotificacion('error', `Archivo demasiado grande. Máximo ${sizeMB}MB`);
        return false;
    }
    
    try {
        console.log(`📤 Subiendo imagen para nodo ${personaId}...`);
        
        // Crear FormData
        const formData = new FormData();
        formData.append('imagen', file);
        
        // Subir imagen
        const response = await fetch(`/subir_imagen/${personaId}`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log(`✅ Imagen subida para nodo ${personaId}:`, result.imagen_url);
            
            // Actualizar estado local
            const nodo = nodes.get(personaId);
            if (nodo) {
                imagenesEstado.imagenesDisponibles.set(personaId, {
                    nombre: nodo.label?.replace(/<[^>]*>/g, '').trim() || `Nodo ${personaId}`,
                    imagen_url: result.imagen_url,
                    timestamp: Date.now()
                });
                
                // Aplicar imagen inmediatamente
                aplicarImagenesANodos();
                
                mostrarNotificacion('success', 'Imagen subida y aplicada exitosamente');
                return true;
            }
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Error subiendo imagen:', error);
        mostrarNotificacion('error', `Error subiendo imagen: ${error.message}`);
        return false;
    }
}

// Función para eliminar imagen de un nodo
async function eliminarImagenNodo(personaId) {
    try {
        console.log(`🗑️ Eliminando imagen del nodo ${personaId}...`);
        
        const response = await fetch(`/eliminar_imagen/${personaId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log(`✅ Imagen eliminada del nodo ${personaId}`);
            
            // Actualizar estado local
            imagenesEstado.imagenesDisponibles.delete(personaId);
            
            // Aplicar cambios
            aplicarImagenesANodos();
            
            mostrarNotificacion('success', 'Imagen eliminada exitosamente');
            return true;
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Error eliminando imagen:', error);
        mostrarNotificacion('error', `Error eliminando imagen: ${error.message}`);
        return false;
    }
}

// Función para crear modal de gestión de imágenes
function crearModalGestionImagenes(personaId) {
    // Limpiar modal anterior si existe
    const modalAnterior = document.getElementById('modalGestionImagenes');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Obtener información del nodo
    const nodo = nodes.get(personaId);
    const nombreNodo = nodo?.label?.replace(/<[^>]*>/g, '').trim() || `Nodo ${personaId}`;
    const imagenActual = imagenesEstado.imagenesDisponibles.get(personaId);
    
    const modalHTML = `
        <div class="modal fade" id="modalGestionImagenes" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="icon icon-user"></i>
                            Imagen de ${nombreNodo}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Imagen Actual:</h6>
                                <div class="imagen-preview-container">
                                    ${imagenActual ? 
                                        `<img src="${imagenActual.imagen_url}" alt="${imagenActual.nombre}" class="imagen-preview-actual">
                                         <div class="mt-2">
                                             <button class="btn btn-danger btn-sm" onclick="eliminarImagenNodo(${personaId})">
                                                 <i class="icon icon-trash"></i> Eliminar Imagen
                                             </button>
                                         </div>` :
                                        `<div class="sin-imagen-placeholder">
                                             <i class="icon icon-user icon-xl"></i>
                                             <p class="text-muted mt-2">Sin imagen asignada</p>
                                         </div>`
                                    }
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>Subir Nueva Imagen:</h6>
                                <div class="upload-container">
                                    <input type="file" class="form-control mb-3" id="inputImagenNodo" 
                                           accept="image/jpeg,image/jpg,image/png,image/gif,image/webp">
                                    <div class="imagen-preview-nueva" style="display: none;">
                                        <img id="previewImagenNueva" class="imagen-preview-nueva-img">
                                    </div>
                                    <div class="upload-info">
                                        <small class="text-muted">
                                            • Formatos: JPG, PNG, GIF, WebP<br>
                                            • Tamaño máximo: 5MB<br>
                                            • Se redimensionará automáticamente<br>
                                            • Recomendado: imágenes cuadradas
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-success" id="btnSubirImagen" disabled>
                            <i class="icon icon-plus"></i> Subir Imagen
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
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
        </style>
    `;
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurar eventos del modal
    configurarEventosModalImagenes(personaId);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalGestionImagenes'));
    imagenesEstado.modalActivo = modal;
    modal.show();
}

// Función para configurar eventos del modal de imágenes
function configurarEventosModalImagenes(personaId) {
    const inputFile = document.getElementById('inputImagenNodo');
    const previewNueva = document.getElementById('previewImagenNueva');
    const btnSubir = document.getElementById('btnSubirImagen');
    const previewContainer = document.querySelector('.imagen-preview-nueva');
    
    // Evento de cambio de archivo
    inputFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            // Validar archivo
            if (!IMAGENES_CONFIG.allowedTypes.includes(file.type)) {
                mostrarNotificacion('error', 'Tipo de archivo no permitido');
                this.value = '';
                return;
            }
            
            if (file.size > IMAGENES_CONFIG.maxFileSize) {
                const sizeMB = (IMAGENES_CONFIG.maxFileSize / (1024 * 1024)).toFixed(0);
                mostrarNotificacion('error', `Archivo demasiado grande. Máximo ${sizeMB}MB`);
                this.value = '';
                return;
            }
            
            // Mostrar preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewNueva.src = e.target.result;
                previewContainer.style.display = 'block';
                btnSubir.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.style.display = 'none';
            btnSubir.disabled = true;
        }
    });
    
    // Evento de subir imagen
    btnSubir.addEventListener('click', async function() {
        const file = inputFile.files[0];
        if (file) {
            this.disabled = true;
            this.innerHTML = '<i class="icon icon-refresh icon-spin"></i> Subiendo...';
            
            const exito = await subirImagenNodo(personaId, file);
            
            if (exito && imagenesEstado.modalActivo) {
                imagenesEstado.modalActivo.hide();
            } else {
                this.disabled = false;
                this.innerHTML = '<i class="icon icon-plus"></i> Subir Imagen';
            }
        }
    });
}

// Función para mostrar modal de gestión de imágenes desde el modal de información
function mostrarGestionImagenesDesdeInfo(personaId) {
    // Cerrar modal de información si está abierto
    const modalInfo = document.getElementById('modalInfoNodo');
    if (modalInfo) {
        const bsModalInfo = bootstrap.Modal.getInstance(modalInfo);
        if (bsModalInfo) {
            bsModalInfo.hide();
        }
    }
    
    // Abrir modal de gestión de imágenes
    crearModalGestionImagenes(personaId);
}

// Integración con el sistema existente
function integrarSistemaImagenes() {
    console.log('🔌 Integrando sistema de imágenes con la red...');
    
    // Cargar imágenes al inicializar
    if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
        setTimeout(async () => {
            await cargarImagenesDisponibles();
        }, 2000);
    } else {
        // Esperar a que el sistema esté listo
        let intentos = 0;
        const maxIntentos = 10;
        
        const intervaloBusqueda = setInterval(async () => {
            intentos++;
            
            if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
                clearInterval(intervaloBusqueda);
                await cargarImagenesDisponibles();
            } else if (intentos >= maxIntentos) {
                clearInterval(intervaloBusqueda);
                console.warn('⚠️ No se pudo integrar sistema de imágenes - red no disponible');
            }
        }, 1000);
    }
}

// Funciones de utilidad
window.gestionImagenes = {
    cargar: cargarImagenesDisponibles,
    aplicar: aplicarImagenesANodos,
    subir: subirImagenNodo,
    eliminar: eliminarImagenNodo,
    mostrarModal: crearModalGestionImagenes,
    estado: () => imagenesEstado
};

// Función de test
window.testSistemaImagenes = function() {
    console.log('🧪 Test del sistema de imágenes:');
    console.log('- Imágenes disponibles:', imagenesEstado.imagenesDisponibles.size);
    console.log('- Estado de carga:', imagenesEstado.cargandoImagenes);
    console.log('- Modal activo:', !!imagenesEstado.modalActivo);
    
    if (nodes && nodes.length > 0) {
        const nodoTest = nodes.get()[0];
        console.log('- Probando modal para nodo:', nodoTest.id);
        crearModalGestionImagenes(nodoTest.id);
    }
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', integrarSistemaImagenes);

console.log('📸 Sistema de gestión de imágenes cargado');
console.log('💡 Uso: gestionImagenes.mostrarModal(nodeId) para abrir gestión de imágenes');