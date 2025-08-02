// static/js/group-management.js - Sistema avanzado de gestión de grupos

let modalGestionGrupos = null;
let gruposPersonalizados = {}

// Función para configurar eventos del modal
function configurarEventosModalGrupos() {
    // Auto-generar ID del grupo basado en el nombre
    const nombreInput = document.getElementById('nombreGrupo');
    const idInput = document.getElementById('idGrupo');
    
    if (nombreInput && idInput) {
        nombreInput.addEventListener('input', function() {
            const id = this.value
                .toLowerCase()
                .replace(/[áäàâ]/g, 'a')
                .replace(/[éëèê]/g, 'e')
                .replace(/[íïìî]/g, 'i')
                .replace(/[óöòô]/g, 'o')
                .replace(/[úüùû]/g, 'u')
                .replace(/ñ/g, 'n')
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            idInput.value = id;
            actualizarPreviewGrupo();
        });
    }
    
    // Actualizar preview cuando cambian los campos
    ['nombreGrupo', 'colorGrupo', 'iconoGrupo'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', actualizarPreviewGrupo);
        }
    });
    
    // Configurar slider de opacidad
    const opacidadSlider = document.getElementById('opacidadSlider');
    if (opacidadSlider) {
        opacidadSlider.addEventListener('input', function() {
            document.getElementById('opacidadValor').textContent = this.value;
        });
    }
}

// Función para cargar contenido dinámico del modal
function cargarContenidoModalGrupos() {
    cargarVistaGrupos();
    cargarAsignacionNodos();
    cargarEstadisticasConfig();
}

// Función para actualizar preview del grupo
function actualizarPreviewGrupo() {
    const nombre = document.getElementById('nombreGrupo')?.value || 'Nuevo Grupo';
    const color = document.getElementById('colorGrupo')?.value || '#4ECDC4';
    const icono = document.getElementById('iconoGrupo')?.value || '';
    
    const bubble = document.getElementById('previewBubble');
    const label = document.getElementById('previewLabel');
    
    if (bubble) {
        bubble.style.background = color;
        bubble.style.borderColor = color;
    }
    
    if (label) {
        label.textContent = icono ? `${icono} ${nombre}` : nombre;
        label.style.color = color;
    }
}

// Función para aplicar grupo predefinido
function aplicarGrupoPredefinido(tipo) {
    const configuraciones = {
        'universidad': {
            nombre: 'Universidad',
            id: 'universidad',
            color: '#3498DB',
            icono: '🎓',
            descripcion: 'Compañeros y profesores de la universidad'
        },
        'trabajo': {
            nombre: 'Trabajo',
            id: 'trabajo',
            color: '#2C3E50',
            icono: '💼',
            descripcion: 'Colegas y contactos profesionales'
        },
        'familia': {
            nombre: 'Familia',
            id: 'familia_cercana',
            color: '#E74C3C',
            icono: '👨‍👩‍👧‍👦',
            descripcion: 'Miembros de la familia'
        },
        'cadiz': {
            nombre: 'Cádiz',
            id: 'cadiz',
            color: '#F39C12',
            icono: '🏖️',
            descripcion: 'Personas de Cádiz'
        },
        'madrid': {
            nombre: 'Madrid',
            id: 'madrid',
            color: '#9B59B6',
            icono: '🏙️',
            descripcion: 'Personas de Madrid'
        },
        'amigos': {
            nombre: 'Amigos',
            id: 'amigos',
            color: '#1ABC9C',
            icono: '👫',
            descripcion: 'Amigos cercanos'
        }
    };
    
    const config = configuraciones[tipo];
    if (config) {
        document.getElementById('nombreGrupo').value = config.nombre;
        document.getElementById('idGrupo').value = config.id;
        document.getElementById('colorGrupo').value = config.color;
        document.getElementById('iconoGrupo').value = config.icono;
        document.getElementById('descripcionGrupo').value = config.descripcion;
        actualizarPreviewGrupo();
    }
}

// Función para crear nuevo grupo
function crearNuevoGrupo() {
    const nombre = document.getElementById('nombreGrupo').value.trim();
    const id = document.getElementById('idGrupo').value.trim();
    const color = document.getElementById('colorGrupo').value;
    const icono = document.getElementById('iconoGrupo').value.trim();
    const descripcion = document.getElementById('descripcionGrupo').value.trim();
    
    if (!nombre || !id) {
        mostrarNotificacion('error', 'El nombre y el ID del grupo son obligatorios');
        return;
    }
    
    if (gruposPersonalizados[id]) {
        mostrarNotificacion('error', `Ya existe un grupo con el ID "${id}"`);
        return;
    }
    
    // Crear grupo
    gruposPersonalizados[id] = {
        nombre,
        color,
        icono,
        descripcion,
        fechaCreacion: new Date().toISOString(),
        nodos: []
    };
    
    // Guardar en localStorage
    guardarGruposPersonalizados();
    
    // Actualizar colores de grupos para las burbujas
    if (typeof coloresGrupos !== 'undefined') {
        coloresGrupos[id] = color;
    }
    
    // Limpiar formulario
    document.getElementById('formCrearGrupo').reset();
    document.getElementById('colorGrupo').value = '#4ECDC4';
    actualizarPreviewGrupo();
    
    // Recargar vistas
    cargarVistaGrupos();
    cargarAsignacionNodos();
    
    mostrarNotificacion('success', `Grupo "${nombre}" creado exitosamente`);
}

// Función para cargar vista de grupos existentes
function cargarVistaGrupos() {
    const container = document.getElementById('contenido-ver-grupos');
    if (!container) return;
    
    const gruposExistentes = obtenerTodosLosGrupos();
    const estadisticas = typeof obtenerEstadisticasGrupos === 'function' ? obtenerEstadisticasGrupos() : {};
    
    let html = `
        <div class="row">
            <div class="col-12 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6><i class="icon icon-chart"></i> Grupos Actuales (${Object.keys(gruposExistentes).length})</h6>
                    <button class="btn btn-sm btn-primary" onclick="crearBurbujasGrupos()">
                        <i class="icon icon-refresh"></i> Actualizar Burbujas
                    </button>
                </div>
            </div>
        </div>
        <div class="row">
    `;
    
    if (Object.keys(gruposExistentes).length === 0) {
        html += `
            <div class="col-12">
                <div class="text-center py-4">
                    <i class="icon icon-users" style="font-size: 3rem; color: #ccc;"></i>
                    <h6 class="mt-3 text-muted">No hay grupos definidos</h6>
                    <p class="text-muted">Crea tu primer grupo en la pestaña "Crear Grupo"</p>
                </div>
            </div>
        `;
    } else {
        Object.entries(gruposExistentes).forEach(([id, grupo]) => {
            const stats = estadisticas[id] || { nodos: 0, conexionesInternas: 0, conexionesExternas: 0, densidad: 'N/A' };
            
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-2">
                                <div style="width: 20px; height: 20px; background: ${grupo.color}; border-radius: 50%; margin-right: 10px;"></div>
                                <h6 class="card-title mb-0">
                                    ${grupo.icono || '📁'} ${grupo.nombre}
                                </h6>
                            </div>
                            
                            <p class="card-text small text-muted">${grupo.descripcion || 'Sin descripción'}</p>
                            
                            <div class="grupo-stats">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <div class="fw-bold">${stats.nodos}</div>
                                        <small>Nodos</small>
                                    </div>
                                    <div class="col-4">
                                        <div class="fw-bold">${stats.conexionesInternas}</div>
                                        <small>Internas</small>
                                    </div>
                                    <div class="col-4">
                                        <div class="fw-bold">${stats.densidad}</div>
                                        <small>Densidad</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="editarGrupo('${id}')">
                                    <i class="icon icon-settings"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-success me-1" onclick="focusGrupo('${id}')">
                                    <i class="icon icon-target"></i>
                                </button>
                                ${grupo.esPersonalizado ? `
                                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarGrupo('${id}')">
                                        <i class="icon icon-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Función para cargar vista de asignación de nodos
function cargarAsignacionNodos() {
    const container = document.getElementById('contenido-asignar-nodos');
    if (!container || !nodes) return;
    
    const gruposDisponibles = obtenerTodosLosGrupos();
    const todosLosNodos = nodes.get();
    
    let html = `
        <div class="row">
            <div class="col-md-4">
                <h6><i class="icon icon-users"></i> Seleccionar Nodos</h6>
                <div class="mb-3">
                    <input type="text" class="form-control" id="buscarNodos" placeholder="Buscar persona...">
                </div>
                <div style="max-height: 400px; overflow-y: auto;" id="lista-nodos">
    `;
    
    todosLosNodos.forEach(nodo => {
        const nombreNodo = nodo.label ? nodo.label.replace(/<[^>]*>/g, '').trim() : `Nodo ${nodo.id}`;
        const grupoActual = nodo.grupo || 'sin_grupo';
        
        html += `
            <div class="card node-grupo-card mb-2" data-node-id="${nodo.id}">
                <div class="card-body p-2">
                    <div class="d-flex align-items-center">
                        <input type="checkbox" class="form-check-input me-2" value="${nodo.id}">
                        <div style="width: 15px; height: 15px; background: ${nodo.color}; border-radius: 50%; margin-right: 8px;"></div>
                        <div class="flex-grow-1">
                            <div class="fw-bold small">${nombreNodo}</div>
                            <div class="text-muted" style="font-size: 0.75rem;">
                                Grupo: ${formatearNombreGrupo(grupoActual)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="seleccionarTodosNodos()">
                        Seleccionar Todos
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="limpiarSeleccionNodos()">
                        Limpiar
                    </button>
                </div>
            </div>
            
            <div class="col-md-4">
                <h6><i class="icon icon-chart"></i> Asignar a Grupo</h6>
                <select class="form-control mb-3" id="grupoDestino">
                    <option value="">Seleccionar grupo...</option>
    `;
    
    Object.entries(gruposDisponibles).forEach(([id, grupo]) => {
        html += `<option value="${id}">${grupo.icono || '📁'} ${grupo.nombre}</option>`;
    });
    
    html += `
                </select>
                
                <button class="btn btn-success btn-custom w-100" onclick="asignarNodosAGrupo()">
                    <i class="icon icon-link"></i>
                    Asignar Seleccionados
                </button>
                
                <hr>
                
                <h6><i class="icon icon-shuffle"></i> Acciones Rápidas</h6>
                <button class="btn btn-sm btn-outline-warning w-100 mb-2" onclick="removerTodosDeGrupos()">
                    Remover Todos de Grupos
                </button>
                <button class="btn btn-sm btn-outline-info w-100" onclick="autoAsignarPorNombre()">
                    Auto-asignar por Nombre
                </button>
            </div>
            
            <div class="col-md-4">
                <h6><i class="icon icon-target"></i> Vista Previa</h6>
                <div id="preview-asignacion" class="border rounded p-3" style="min-height: 200px;">
                    <p class="text-muted text-center">Selecciona nodos y un grupo para ver la vista previa</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Configurar eventos
    configurarEventosAsignacion();
}

// Función para configurar eventos de asignación
function configurarEventosAsignacion() {
    // Búsqueda de nodos
    const buscarInput = document.getElementById('buscarNodos');
    if (buscarInput) {
        buscarInput.addEventListener('input', function() {
            const termino = this.value.toLowerCase();
            const cards = document.querySelectorAll('.node-grupo-card');
            
            cards.forEach(card => {
                const texto = card.textContent.toLowerCase();
                if (texto.includes(termino)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Selección de nodos
    const checkboxes = document.querySelectorAll('.node-grupo-card input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const card = this.closest('.node-grupo-card');
            if (this.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
            actualizarPreviewAsignacion();
        });
    });
    
    // Cambio de grupo destino
    const grupoDestino = document.getElementById('grupoDestino');
    if (grupoDestino) {
        grupoDestino.addEventListener('change', actualizarPreviewAsignacion);
    }
}

// Función para cargar estadísticas en configuración
function cargarEstadisticasConfig() {
    const container = document.getElementById('estadisticas-grupos-config');
    if (!container) return;
    
    const estadisticas = typeof obtenerEstadisticasGrupos === 'function' ? obtenerEstadisticasGrupos() : {};
    
    let html = '<div class="table-responsive">';
    html += '<table class="table table-sm">';
    html += '<thead><tr><th>Grupo</th><th>Nodos</th><th>Densidad</th></tr></thead>';
    html += '<tbody>';
    
    if (Object.keys(estadisticas).length === 0) {
        html += '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
    } else {
        Object.entries(estadisticas).forEach(([grupo, stats]) => {
            html += `
                <tr>
                    <td>
                        <div style="width: 12px; height: 12px; background: ${stats.color}; border-radius: 50%; display: inline-block; margin-right: 5px;"></div>
                        ${formatearNombreGrupo(grupo)}
                    </td>
                    <td><span class="badge bg-primary">${stats.nodos}</span></td>
                    <td><span class="badge bg-info">${stats.densidad}</span></td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Función para obtener todos los grupos (predefinidos + personalizados)
function obtenerTodosLosGrupos() {
    const gruposPredefinidos = {
        'amigos': { nombre: 'Amigos', color: '#1ABC9C', icono: '👫', descripcion: 'Amigos cercanos', esPersonalizado: false },
        'familia_cercana': { nombre: 'Familia Cercana', color: '#E74C3C', icono: '👨‍👩‍👧‍👦', descripcion: 'Miembros de la familia', esPersonalizado: false },
        'trabajo': { nombre: 'Trabajo', color: '#2C3E50', icono: '💼', descripcion: 'Colegas y contactos profesionales', esPersonalizado: false },
        'universidad': { nombre: 'Universidad', color: '#3498DB', icono: '🎓', descripcion: 'Compañeros y profesores de la universidad', esPersonalizado: false },
        'deportes': { nombre: 'Deportes', color: '#27AE60', icono: '⚽', descripcion: 'Compañeros de deporte', esPersonalizado: false },
        'vecinos': { nombre: 'Vecinos', color: '#F39C12', icono: '🏠', descripcion: 'Vecinos del barrio', esPersonalizado: false }
    };
    
    // Combinar con grupos personalizados
    Object.entries(gruposPersonalizados).forEach(([id, grupo]) => {
        gruposPredefinidos[id] = { ...grupo, esPersonalizado: true };
    });
    
    return gruposPredefinidos;
}

// Función para seleccionar todos los nodos
function seleccionarTodosNodos() {
    const checkboxes = document.querySelectorAll('.node-grupo-card input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.closest('.node-grupo-card').classList.add('selected');
    });
    actualizarPreviewAsignacion();
}

// Función para limpiar selección de nodos
function limpiarSeleccionNodos() {
    const checkboxes = document.querySelectorAll('.node-grupo-card input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('.node-grupo-card').classList.remove('selected');
    });
    actualizarPreviewAsignacion();
}

// Función para actualizar preview de asignación
function actualizarPreviewAsignacion() {
    const container = document.getElementById('preview-asignacion');
    if (!container) return;
    
    const nodosSeleccionados = Array.from(document.querySelectorAll('.node-grupo-card input[type="checkbox"]:checked'));
    const grupoDestino = document.getElementById('grupoDestino')?.value;
    
    if (nodosSeleccionados.length === 0 || !grupoDestino) {
        container.innerHTML = '<p class="text-muted text-center">Selecciona nodos y un grupo para ver la vista previa</p>';
        return;
    }
    
    const grupos = obtenerTodosLosGrupos();
    const grupo = grupos[grupoDestino];
    
    let html = `
        <div class="text-center mb-3">
            <div style="width: 40px; height: 40px; background: ${grupo.color}; border-radius: 50%; margin: 0 auto; opacity: 0.3; border: 2px dashed ${grupo.color};"></div>
            <div class="mt-2"><strong>${grupo.icono} ${grupo.nombre}</strong></div>
        </div>
        
        <div class="small">
            <strong>Nodos a asignar (${nodosSeleccionados.length}):</strong>
            <ul class="list-unstyled mt-2">
    `;
    
    nodosSeleccionados.slice(0, 5).forEach(checkbox => {
        const card = checkbox.closest('.node-grupo-card');
        const nombreNodo = card.querySelector('.fw-bold').textContent;
        html += `<li>• ${nombreNodo}</li>`;
    });
    
    if (nodosSeleccionados.length > 5) {
        html += `<li class="text-muted">... y ${nodosSeleccionados.length - 5} más</li>`;
    }
    
    html += '</ul></div>';
    container.innerHTML = html;
}

// Función para asignar nodos al grupo seleccionado
async function asignarNodosAGrupo() {
    const nodosSeleccionados = Array.from(document.querySelectorAll('.node-grupo-card input[type="checkbox"]:checked'));
    const grupoDestino = document.getElementById('grupoDestino')?.value;
    
    if (nodosSeleccionados.length === 0) {
        mostrarNotificacion('warning', 'Selecciona al menos un nodo');
        return;
    }
    
    if (!grupoDestino) {
        mostrarNotificacion('warning', 'Selecciona un grupo destino');
        return;
    }
    
    try {
        // Actualizar nodos en el frontend
        const updates = nodosSeleccionados.map(checkbox => ({
            id: parseInt(checkbox.value),
            grupo: grupoDestino
        }));
        
        nodes.update(updates);
        
        // Aquí podrías hacer una llamada al backend para persistir los cambios
        // await actualizarGruposEnServidor(updates);
        
        // Limpiar selección
        limpiarSeleccionNodos();
        document.getElementById('grupoDestino').value = '';
        
        // Recargar vista
        cargarAsignacionNodos();
        cargarVistaGrupos();
        cargarEstadisticasConfig();
        
        // Recrear burbujas
        if (typeof crearBurbujasGrupos === 'function') {
            setTimeout(crearBurbujasGrupos, 500);
        }
        
        mostrarNotificacion('success', `${nodosSeleccionados.length} nodos asignados al grupo "${grupoDestino}"`);
        
    } catch (error) {
        console.error('Error asignando nodos:', error);
        mostrarNotificacion('error', 'Error asignando nodos al grupo');
    }
}

// Función para auto-asignar por nombre
function autoAsignarPorNombre() {
    if (!nodes) return;
    
    const todosLosNodos = nodes.get();
    let asignaciones = 0;
    
    const updates = [];
    
    todosLosNodos.forEach(nodo => {
        const nombreNodo = nodo.label ? nodo.label.replace(/<[^>]*>/g, '').toLowerCase().trim() : '';
        
        // Reglas de auto-asignación basadas en palabras clave
        let grupoAsignado = null;
        
        if (nombreNodo.includes('universidad') || nombreNodo.includes('prof') || nombreNodo.includes('estudiante')) {
            grupoAsignado = 'universidad';
        } else if (nombreNodo.includes('trabajo') || nombreNodo.includes('jefe') || nombreNodo.includes('compañero')) {
            grupoAsignado = 'trabajo';
        } else if (nombreNodo.includes('familia') || nombreNodo.includes('hermano') || nombreNodo.includes('padre') || nombreNodo.includes('madre')) {
            grupoAsignado = 'familia_cercana';
        } else if (nombreNodo.includes('vecino') || nombreNodo.includes('barrio')) {
            grupoAsignado = 'vecinos';
        } else if (nombreNodo.includes('deporte') || nombreNodo.includes('gym') || nombreNodo.includes('futbol')) {
            grupoAsignado = 'deportes';
        } else if (nombreNodo.includes('cadiz') || nombreNodo.includes('cádiz')) {
            grupoAsignado = 'cadiz';
        }
        
        if (grupoAsignado && nodo.grupo !== grupoAsignado) {
            updates.push({
                id: nodo.id,
                grupo: grupoAsignado
            });
            asignaciones++;
        }
    });
    
    if (updates.length > 0) {
        nodes.update(updates);
        
        // Recargar vistas
        cargarAsignacionNodos();
        cargarVistaGrupos();
        cargarEstadisticasConfig();
        
        // Recrear burbujas
        if (typeof crearBurbujasGrupos === 'function') {
            setTimeout(crearBurbujasGrupos, 500);
        }
        
        mostrarNotificacion('success', `${asignaciones} nodos auto-asignados basándose en sus nombres`);
    } else {
        mostrarNotificacion('info', 'No se encontraron nodos para auto-asignar');
    }
}

// Función para remover todos los nodos de grupos
function removerTodosDeGrupos() {
    if (!confirm('¿Estás seguro de que quieres remover todos los nodos de sus grupos?')) {
        return;
    }
    
    if (!nodes) return;
    
    const todosLosNodos = nodes.get();
    const updates = todosLosNodos.map(nodo => ({
        id: nodo.id,
        grupo: null
    }));
    
    nodes.update(updates);
    
    // Limpiar burbujas
    if (typeof limpiarBurbujasAnteriores === 'function') {
        limpiarBurbujasAnteriores();
    }
    
    // Recargar vistas
    cargarAsignacionNodos();
    cargarVistaGrupos();
    cargarEstadisticasConfig();
    
    mostrarNotificacion('success', 'Todos los nodos han sido removidos de sus grupos');
}

// Función para enfocar un grupo específico
function focusGrupo(grupoId) {
    if (!network || !nodes) return;
    
    const nodosDeLGrupo = nodes.get().filter(nodo => nodo.grupo === grupoId);
    
    if (nodosDeLGrupo.length === 0) {
        mostrarNotificacion('info', 'No hay nodos en este grupo');
        return;
    }
    
    const idsNodos = nodosDeLGrupo.map(nodo => nodo.id);
    
    network.focus(idsNodos[0], {
        scale: 1.5,
        animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
        }
    });
    
    // Resaltar nodos del grupo temporalmente
    const updates = nodosDeLGrupo.map(nodo => ({
        id: nodo.id,
        borderWidth: 6,
        borderWidthSelected: 6
    }));
    
    nodes.update(updates);
    
    // Restaurar después de 3 segundos
    setTimeout(() => {
        const restore = nodosDeLGrupo.map(nodo => ({
            id: nodo.id,
            borderWidth: 2,
            borderWidthSelected: 2
        }));
        nodes.update(restore);
    }, 3000);
    
    mostrarNotificacion('success', `Enfocando grupo: ${formatearNombreGrupo(grupoId)}`);
}

// Función para editar grupo
function editarGrupo(grupoId) {
    const grupos = obtenerTodosLosGrupos();
    const grupo = grupos[grupoId];
    
    if (!grupo) return;
    
    // Cambiar a la pestaña de crear grupo
    const tab = document.querySelector('#crear-grupo-tab');
    if (tab) {
        tab.click();
    }
    
    // Llenar formulario
    setTimeout(() => {
        document.getElementById('nombreGrupo').value = grupo.nombre;
        document.getElementById('idGrupo').value = grupoId;
        document.getElementById('colorGrupo').value = grupo.color;
        document.getElementById('iconoGrupo').value = grupo.icono || '';
        document.getElementById('descripcionGrupo').value = grupo.descripcion || '';
        actualizarPreviewGrupo();
        
        mostrarNotificacion('info', `Editando grupo: ${grupo.nombre}`);
    }, 100);
}

// Función para eliminar grupo personalizado
function eliminarGrupo(grupoId) {
    const grupos = obtenerTodosLosGrupos();
    const grupo = grupos[grupoId];
    
    if (!grupo || !grupo.esPersonalizado) {
        mostrarNotificacion('error', 'Solo se pueden eliminar grupos personalizados');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el grupo "${grupo.nombre}"?`)) {
        return;
    }
    
    // Eliminar grupo
    delete gruposPersonalizados[grupoId];
    guardarGruposPersonalizados();
    
    // Remover nodos de este grupo
    if (nodes) {
        const nodosDelGrupo = nodes.get().filter(nodo => nodo.grupo === grupoId);
        if (nodosDelGrupo.length > 0) {
            const updates = nodosDelGrupo.map(nodo => ({
                id: nodo.id,
                grupo: null
            }));
            nodes.update(updates);
        }
    }
    
    // Recargar vistas
    cargarVistaGrupos();
    cargarAsignacionNodos();
    cargarEstadisticasConfig();
    
    // Recrear burbujas
    if (typeof crearBurbujasGrupos === 'function') {
        setTimeout(crearBurbujasGrupos, 500);
    }
    
    mostrarNotificacion('success', `Grupo "${grupo.nombre}" eliminado exitosamente`);
}

// Función para aplicar cambios y cerrar modal
function aplicarCambiosGrupos() {
    // Recrear burbujas con la configuración actual
    if (typeof crearBurbujasGrupos === 'function') {
        crearBurbujasGrupos();
    }
    
    // Cerrar modal
    if (modalGestionGrupos) {
        modalGestionGrupos.hide();
    }
    
    mostrarNotificacion('success', 'Cambios de grupos aplicados correctamente');
}

// Función para resetear configuración de grupos
function resetearGrupos() {
    if (!confirm('¿Estás seguro de que quieres resetear toda la configuración de grupos? Esta acción no se puede deshacer.')) {
        return;
    }
    
    // Limpiar grupos personalizados
    gruposPersonalizados = {};
    guardarGruposPersonalizados();
    
    // Remover todos los nodos de grupos
    if (nodes) {
        const todosLosNodos = nodes.get();
        const updates = todosLosNodos.map(nodo => ({
            id: nodo.id,
            grupo: null
        }));
        nodes.update(updates);
    }
    
    // Limpiar burbujas
    if (typeof limpiarBurbujasAnteriores === 'function') {
        limpiarBurbujasAnteriores();
    }
    
    // Recargar vistas
    cargarVistaGrupos();
    cargarAsignacionNodos();
    cargarEstadisticasConfig();
    
    mostrarNotificacion('success', 'Configuración de grupos reseteada');
}

// Función para exportar configuración
function exportarConfigGrupos() {
    const config = {
        gruposPersonalizados,
        configuracion: {
            burbujasActivas: typeof burbujasActivas !== 'undefined' ? burbujasActivas : true,
            opacidadBurbujas: typeof opacidadBurbujas !== 'undefined' ? opacidadBurbujas : 0.15
        },
        fecha: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `grupos-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    mostrarNotificacion('success', 'Configuración exportada correctamente');
}

// Función para toggle etiquetas de grupos
function toggleEtiquetasGrupos() {
    const etiquetas = document.querySelectorAll('.etiqueta-grupo');
    const checkbox = document.getElementById('mostrarEtiquetas');
    
    etiquetas.forEach(etiqueta => {
        etiqueta.style.display = checkbox.checked ? 'block' : 'none';
    });
}

// Función para actualizar margen de burbujas
function actualizarMargenBurbujas(nuevoMargen) {
    // Esta función se puede expandir para implementar margen dinámico
    console.log('Nuevo margen de burbujas:', nuevoMargen);
    
    // Recrear burbujas con nuevo margen
    if (typeof crearBurbujasGrupos === 'function') {
        setTimeout(crearBurbujasGrupos, 100);
    }
}

// Función para configurar eventos generales
function configurarEventosGrupos() {
    // No necesitamos eventos específicos aquí por ahora
    console.log('✅ Eventos de grupos configurados');
}

// Función para formatear nombre de grupo (reutilizada del otro archivo)
function formatearNombreGrupo(nombreGrupo) {
    if (!nombreGrupo || nombreGrupo === 'sin_grupo') return 'Sin grupo';
    
    const nombres = {
        'universidad': '🎓 Universidad',
        'trabajo': '💼 Trabajo',
        'familia_cercana': '👨‍👩‍👧‍👦 Familia',
        'amigos': '👫 Amigos',
        'deportes': '⚽ Deportes',
        'vecinos': '🏠 Vecinos',
        'cadiz': '🏖️ Cádiz',
        'madrid': '🏙️ Madrid',
        'sevilla': '🌞 Sevilla',
        'barcelona': '🏛️ Barcelona'
    };
    
    return nombres[nombreGrupo] || nombreGrupo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Función para mostrar notificación (reutilizada)
function mostrarNotificacion(tipo, mensaje, duracion = 5000) {
    // Si existe la función global, usarla
    if (typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion(tipo, mensaje, duracion);
        return;
    }
    
    // Implementación básica de fallback
    console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.className = `alert alert-${tipo === 'error' ? 'danger' : tipo} alert-dismissible fade show`;
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
    notification.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duracion);
}

// Función principal de inicialización
function inicializarSistemaGestionGruposCompleto() {
    // Esperar a que otros sistemas estén listos
    if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
        inicializarGestionGrupos();
        console.log('📋 Sistema completo de gestión de grupos inicializado');
    } else {
        // Reintentar después de un momento
        setTimeout(inicializarSistemaGestionGruposCompleto, 1000);
    }
}

// Exportar funciones principales
window.abrirModalGestionGrupos = abrirModalGestionGrupos;
window.crearNuevoGrupo = crearNuevoGrupo;
window.aplicarGrupoPredefinido = aplicarGrupoPredefinido;
window.asignarNodosAGrupo = asignarNodosAGrupo;
window.seleccionarTodosNodos = seleccionarTodosNodos;
window.limpiarSeleccionNodos = limpiarSeleccionNodos;
window.autoAsignarPorNombre = autoAsignarPorNombre;
window.removerTodosDeGrupos = removerTodosDeGrupos;
window.focusGrupo = focusGrupo;
window.editarGrupo = editarGrupo;
window.eliminarGrupo = eliminarGrupo;
window.aplicarCambiosGrupos = aplicarCambiosGrupos;
window.resetearGrupos = resetearGrupos;
window.exportarConfigGrupos = exportarConfigGrupos;
window.toggleEtiquetasGrupos = toggleEtiquetasGrupos;
window.actualizarMargenBurbujas = actualizarMargenBurbujas;

// Funciones de debugging
window.debugGestionGrupos = function() {
    console.log('🔍 Estado del sistema de gestión de grupos:');
    console.log('- Grupos personalizados:', gruposPersonalizados);
    console.log('- Todos los grupos:', obtenerTodosLosGrupos());
    if (typeof nodes !== 'undefined' && nodes) {
        const nodosPorGrupo = {};
        nodes.forEach(nodo => {
            const grupo = nodo.grupo || 'sin_grupo';
            nodosPorGrupo[grupo] = (nodosPorGrupo[grupo] || 0) + 1;
        });
        console.log('- Distribución actual:', nodosPorGrupo);
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistemaGestionGruposCompleto);
} else {
    inicializarSistemaGestionGruposCompleto;
};

// Función para inicializar el sistema de gestión de grupos
function inicializarGestionGrupos() {
    console.log('📋 Inicializando sistema de gestión de grupos...');
    
    // Cargar grupos personalizados del localStorage (si existen)
    cargarGruposPersonalizados();
    
    // Configurar eventos
    configurarEventosGrupos();
    
    console.log('✅ Sistema de gestión de grupos inicializado');
}

// Función para cargar grupos personalizados
function cargarGruposPersonalizados() {
    try {
        const grupos = localStorage.getItem('gruposPersonalizados');
        if (grupos) {
            gruposPersonalizados = JSON.parse(grupos);
            console.log('📋 Grupos personalizados cargados:', gruposPersonalizados);
        }
    } catch (error) {
        console.warn('⚠️ Error cargando grupos personalizados:', error);
        gruposPersonalizados = {};
    }
}

// Función para guardar grupos personalizados
function guardarGruposPersonalizados() {
    try {
        localStorage.setItem('gruposPersonalizados', JSON.stringify(gruposPersonalizados));
        console.log('💾 Grupos personalizados guardados');
    } catch (error) {
        console.warn('⚠️ Error guardando grupos personalizados:', error);
    }
}

// Función para abrir el modal de gestión de grupos
async function abrirModalGestionGrupos() {
    console.log('🔄 Abriendo modal de gestión de grupos...');
    
    // Limpiar modal anterior
    limpiarModalGruposAnterior();
    
    // Crear y mostrar modal
    const modalHTML = crearHTMLModalGrupos();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Inicializar modal de Bootstrap
    const modalElement = document.getElementById('modalGestionGrupos');
    modalGestionGrupos = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: true
    });
    
    // Configurar eventos del modal
    configurarEventosModalGrupos();
    
    // Cargar contenido dinámico
    cargarContenidoModalGrupos();
    
    // Mostrar modal
    modalGestionGrupos.show();
    
    console.log('✅ Modal de gestión de grupos abierto');
}

// Función para limpiar modal anterior
function limpiarModalGruposAnterior() {
    const modalExistente = document.getElementById('modalGestionGrupos');
    if (modalExistente) {
        const bsModal = bootstrap.Modal.getInstance(modalExistente);
        if (bsModal) {
            bsModal.dispose();
        }
        modalExistente.remove();
    }
    modalGestionGrupos = null;
}

// Función para crear HTML del modal
function crearHTMLModalGrupos() {
    return `
        <div class="modal fade" id="modalGestionGrupos" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="icon icon-users"></i>
                            Gestión de Grupos
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Navegación por pestañas -->
                        <ul class="nav nav-tabs mb-4" id="gruposTab" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="ver-grupos-tab" data-bs-toggle="tab" 
                                        data-bs-target="#ver-grupos" type="button" role="tab">
                                    <i class="icon icon-chart"></i>
                                    Ver Grupos
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="crear-grupo-tab" data-bs-toggle="tab" 
                                        data-bs-target="#crear-grupo" type="button" role="tab">
                                    <i class="icon icon-plus"></i>
                                    Crear Grupo
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="asignar-nodos-tab" data-bs-toggle="tab" 
                                        data-bs-target="#asignar-nodos" type="button" role="tab">
                                    <i class="icon icon-link"></i>
                                    Asignar Nodos
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="configuracion-tab" data-bs-toggle="tab" 
                                        data-bs-target="#configuracion" type="button" role="tab">
                                    <i class="icon icon-settings"></i>
                                    Configuración
                                </button>
                            </li>
                        </ul>

                        <!-- Contenido de las pestañas -->
                        <div class="tab-content" id="gruposTabContent">
                            
                            <!-- Pestaña: Ver Grupos -->
                            <div class="tab-pane fade show active" id="ver-grupos" role="tabpanel">
                                <div id="contenido-ver-grupos">
                                    <!-- Se carga dinámicamente -->
                                </div>
                            </div>

                            <!-- Pestaña: Crear Grupo -->
                            <div class="tab-pane fade" id="crear-grupo" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-8">
                                        <form id="formCrearGrupo">
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Nombre del Grupo *</label>
                                                        <input type="text" class="form-control" id="nombreGrupo" required
                                                               placeholder="Ej: Universidad de Cádiz">
                                                        <small class="text-muted">Nombre descriptivo del grupo</small>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">ID del Grupo *</label>
                                                        <input type="text" class="form-control" id="idGrupo" required
                                                               placeholder="universidad_cadiz">
                                                        <small class="text-muted">Sin espacios, solo letras, números y _</small>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Color del Grupo</label>
                                                        <input type="color" class="form-control" id="colorGrupo" value="#4ECDC4">
                                                        <small class="text-muted">Color de la burbuja del grupo</small>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Icono/Emoji</label>
                                                        <input type="text" class="form-control" id="iconoGrupo" maxlength="2"
                                                               placeholder="🎓">
                                                        <small class="text-muted">Emoji representativo del grupo</small>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="mb-3">
                                                <label class="form-label">Descripción</label>
                                                <textarea class="form-control" id="descripcionGrupo" rows="3"
                                                          placeholder="Descripción del grupo y su propósito..."></textarea>
                                            </div>
                                            
                                            <button type="button" class="btn btn-success btn-custom" onclick="crearNuevoGrupo()">
                                                <i class="icon icon-plus"></i>
                                                Crear Grupo
                                            </button>
                                        </form>
                                    </div>
                                    
                                    <div class="col-md-4">
                                        <div class="card">
                                            <div class="card-body">
                                                <h6 class="card-title">
                                                    <i class="icon icon-chart"></i>
                                                    Vista Previa
                                                </h6>
                                                <div id="preview-grupo" class="text-center p-3">
                                                    <div class="grupo-preview-container">
                                                        <div class="grupo-preview-bubble" id="previewBubble"></div>
                                                        <div class="grupo-preview-label" id="previewLabel">Nuevo Grupo</div>
                                                    </div>
                                                </div>
                                                
                                                <h6 class="mt-3">Grupos Predefinidos:</h6>
                                                <div class="d-flex flex-wrap gap-1">
                                                    <button class="btn btn-sm btn-outline-primary" onclick="aplicarGrupoPredefinido('universidad')">🎓 Universidad</button>
                                                    <button class="btn btn-sm btn-outline-primary" onclick="aplicarGrupoPredefinido('trabajo')">💼 Trabajo</button>
                                                    <button class="btn btn-sm btn-outline-primary" onclick="aplicarGrupoPredefinido('familia')">👨‍👩‍👧‍👦 Familia</button>
                                                    <button class="btn btn-sm btn-outline-primary" onclick="aplicarGrupoPredefinido('cadiz')">🏖️ Cádiz</button>
                                                    <button class="btn btn-sm btn-outline-primary" onclick="aplicarGrupoPredefinido('madrid')">🏙️ Madrid</button>
                                                    <button class="btn btn-sm btn-outline-primary" onclick="aplicarGrupoPredefinido('amigos')">👫 Amigos</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Pestaña: Asignar Nodos -->
                            <div class="tab-pane fade" id="asignar-nodos" role="tabpanel">
                                <div id="contenido-asignar-nodos">
                                    <!-- Se carga dinámicamente -->
                                </div>
                            </div>

                            <!-- Pestaña: Configuración -->
                            <div class="tab-pane fade" id="configuracion" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="icon icon-settings"></i> Configuración de Burbujas</h6>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Opacidad de Burbujas</label>
                                            <input type="range" class="form-range" min="0.05" max="0.5" step="0.05" 
                                                   value="0.15" id="opacidadSlider" onchange="cambiarOpacidadBurbujas(this.value)">
                                            <small class="text-muted">Transparencia: <span id="opacidadValor">0.15</span></small>
                                        </div>
                                        
                                        <div class="form-check form-switch mb-3">
                                            <input class="form-check-input" type="checkbox" id="mostrarBurbujas" checked 
                                                   onchange="toggleBurbujas()">
                                            <label class="form-check-label">Mostrar burbujas de grupos</label>
                                        </div>
                                        
                                        <div class="form-check form-switch mb-3">
                                            <input class="form-check-input" type="checkbox" id="mostrarEtiquetas" checked 
                                                   onchange="toggleEtiquetasGrupos()">
                                            <label class="form-check-label">Mostrar etiquetas de grupos</label>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Margen de Burbujas (px)</label>
                                            <input type="number" class="form-control" value="50" min="20" max="100" 
                                                   id="margenBurbujas" onchange="actualizarMargenBurbujas(this.value)">
                                            <small class="text-muted">Espacio alrededor de los nodos</small>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <h6><i class="icon icon-chart"></i> Estadísticas de Grupos</h6>
                                        <div id="estadisticas-grupos-config">
                                            <!-- Se carga dinámicamente -->
                                        </div>
                                        
                                        <div class="mt-4">
                                            <h6><i class="icon icon-refresh"></i> Acciones</h6>
                                            <button class="btn btn-primary btn-sm me-2" onclick="crearBurbujasGrupos()">
                                                <i class="icon icon-refresh"></i> Actualizar Burbujas
                                            </button>
                                            <button class="btn btn-warning btn-sm me-2" onclick="resetearGrupos()">
                                                <i class="icon icon-refresh"></i> Reset Grupos
                                            </button>
                                            <button class="btn btn-info btn-sm" onclick="exportarConfigGrupos()">
                                                <i class="icon icon-code"></i> Exportar Config
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success btn-custom" onclick="aplicarCambiosGrupos()">
                            <i class="icon icon-check"></i>
                            Aplicar Cambios
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- CSS específico para el modal -->
        <style>
        .grupo-preview-container {
            position: relative;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .grupo-preview-bubble {
            width: 60px;
            height: 40px;
            background: #4ECDC4;
            border-radius: 20px;
            opacity: 0.3;
            border: 2px dashed #4ECDC4;
            position: relative;
            animation: preview-pulse 2s infinite;
        }
        
        .grupo-preview-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: 600;
            font-size: 11px;
            color: #333;
            text-align: center;
        }
        
        @keyframes preview-pulse {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.05); }
        }
        
        .node-grupo-card {
            border: 2px solid transparent;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .node-grupo-card:hover {
            border-color: var(--primary-color);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .node-grupo-card.selected {
            border-color: var(--success-color);
            background: rgba(16, 185, 129, 0.1);
        }
        
        .grupo-stats {
            font-size: 0.8rem;
            color: #666;
        }
        
        .nav-tabs .nav-link {
            border-radius: 8px 8px 0 0;
            margin-right: 4px;
        }
        
        .nav-tabs .nav-link.active {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border-color: transparent;
        }
        </style>
    `;}