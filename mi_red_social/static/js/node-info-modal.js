// static/js/node-info-modal.js - Sistema de modal de información del nodo

let modalInfoNodo = null;
let nodoActualInfo = null;

// Función para cargar el template del modal si no existe
async function cargarTemplateModalInfo() {
    if (document.getElementById('modalInfoNodo')) {
        return true;
    }
    
    try {
        const response = await fetch('/static/templates/modal-info-nodo.html');
        if (!response.ok) {
            throw new Error(`Error cargando template: ${response.status}`);
        }
        
        const templateHTML = await response.text();
        document.body.insertAdjacentHTML('beforeend', templateHTML);
        
        console.log('✅ Template del modal de información cargado');
        return true;
    } catch (error) {
        console.error('❌ Error cargando template del modal de información:', error);
        
        // Fallback: crear modal simple
        const fallbackHTML = `
            <div class="modal fade" id="modalInfoNodo" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Información del Contacto</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Error cargando información detallada.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', fallbackHTML);
        return false;
    }
}

// Función principal para mostrar la información del nodo
async function mostrarInformacionNodo(nodeId) {
    try {
        if (!nodes || !edges) {
            mostrarNotificacion('error', 'Sistema no disponible. Intenta recargar la página.');
            return;
        }
        const templateCargado = await cargarTemplateModalInfo();
        if (!templateCargado) {
            mostrarNotificacion('error', 'Error cargando la interfaz de información');
            return;
        }
        const nodo = nodes.get(nodeId);
        if (!nodo) {
            mostrarNotificacion('error', 'Contacto no encontrado');
            return;
        }
        const todasLasRelaciones = edges.get();
        const relacionesNodo = todasLasRelaciones.filter(edge =>
            edge.from === nodeId || edge.to === nodeId
        );
        nodoActualInfo = nodo;
        llenarInformacionBasica(nodo);
        llenarEstadisticas(nodo, relacionesNodo);
        llenarTablaRelaciones(nodeId, relacionesNodo);
        llenarAnalisisGrupos(nodo, relacionesNodo);
        llenarGraficoFortaleza(relacionesNodo);
        configurarEventosModal(nodeId);

        // Mostramos el modal SIN tocar nada más
        if (!modalInfoNodo) {
            modalInfoNodo = new bootstrap.Modal(document.getElementById('modalInfoNodo'), {
                backdrop: 'static',
                keyboard: true
            });
        }
        modalInfoNodo.show();

        console.log('✅ Modal de información mostrado correctamente');
    } catch (error) {
        console.error('❌ Error mostrando información del nodo:', error);
        mostrarNotificacion('error', 'Error al cargar la información del contacto');
    }
}


// Función para llenar la información básica del nodo
function llenarInformacionBasica(nodo) {
    // Obtener nombre limpio
    const nombreLimpio = nodo.label ? nodo.label.replace(/<[^>]*>/g, '').trim() : `Nodo ${nodo.id}`;
    
    // Llenar elementos
    document.getElementById('tituloPersona').textContent = nombreLimpio;
    document.getElementById('nombrePersona').textContent = nombreLimpio;
    
    // Color del nodo
    const colorDisplay = document.getElementById('nodoColor');
    colorDisplay.style.backgroundColor = nodo.color || '#4ECDC4';
    
    // Grupo
    const grupoElement = document.getElementById('grupoPersona');
    if (nodo.grupo && nodo.grupo !== 'sin_grupo') {
        grupoElement.textContent = formatearNombreGrupo(nodo.grupo);
        grupoElement.className = `badge ${obtenerClaseGrupo(nodo.grupo)}`;
    } else {
        grupoElement.textContent = 'Sin grupo';
        grupoElement.className = 'badge bg-secondary';
    }
    
    // Descripción
    const descripcionElement = document.getElementById('descripcionPersona');
    if (nodo.descripcion && nodo.descripcion.trim()) {
        descripcionElement.textContent = nodo.descripcion;
        descripcionElement.style.display = 'block';
    } else {
        descripcionElement.textContent = 'Sin descripción adicional';
        descripcionElement.style.display = 'block';
    }
}

// Función para llenar las estadísticas
function llenarEstadisticas(nodo, relaciones) {
    const totalConexiones = relaciones.length;
    const conexionesFuertes = relaciones.filter(rel => rel.width >= 8 || rel.fortaleza >= 8).length;
    
    // Calcular centralidad (porcentaje de conexiones respecto al total posible)
    const totalNodos = nodes.length;
    const maxPosiblesConexiones = totalNodos - 1; // Excluir el nodo actual
    const centralidad = maxPosiblesConexiones > 0 ? 
        Math.round((totalConexiones / maxPosiblesConexiones) * 100) : 0;
    
    document.getElementById('totalConexiones').textContent = totalConexiones;
    document.getElementById('conexionesFuertes').textContent = conexionesFuertes;
    document.getElementById('centralidad').textContent = centralidad + '%';
}

// Función para llenar la tabla de relaciones
function llenarTablaRelaciones(nodeId, relaciones) {
    const tbody = document.getElementById('tablaRelaciones');
    const numeroRelaciones = document.getElementById('numeroRelaciones');
    const sinRelaciones = document.getElementById('sinRelaciones');
    
    // Limpiar tabla anterior
    tbody.innerHTML = '';
    numeroRelaciones.textContent = relaciones.length;
    
    if (relaciones.length === 0) {
        sinRelaciones.style.display = 'block';
        tbody.parentElement.parentElement.style.display = 'none';
        return;
    }
    
    sinRelaciones.style.display = 'none';
    tbody.parentElement.parentElement.style.display = 'block';
    
    relaciones.forEach(relacion => {
        // Determinar el otro nodo en la relación
        const otroNodeId = relacion.from === nodeId ? relacion.to : relacion.from;
        const otroNodo = nodes.get(otroNodeId);
        
        if (!otroNodo) return;
        
        const nombreOtroNodo = otroNodo.label ? 
            otroNodo.label.replace(/<[^>]*>/g, '').trim() : 
            `Nodo ${otroNodeId}`;
        
        // Obtener fortaleza de la relación
        const fortaleza = relacion.fortaleza || relacion.width || 5;
        
        // Crear fila
        const fila = document.createElement('tr');
        
        // Determinar si es una conexión destacada (fortaleza >= 8)
        if (fortaleza >= 8) {
            fila.classList.add('conexion-destacada');
        }
        
        fila.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div style="width: 20px; height: 20px; background-color: ${otroNodo.color || '#4ECDC4'}; 
                                border-radius: 50%; margin-right: 10px; border: 2px solid white; 
                                box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
                    <strong>${nombreOtroNodo}</strong>
                </div>
            </td>
            <td>
                <span class="badge bg-info">${formatearTipoRelacion(relacion.tipo || relacion.label || 'conexión')}</span>
            </td>
            <td>
                <span class="badge-fortaleza ${obtenerClaseFortaleza(fortaleza)}">
                    ${fortaleza}/10
                </span>
            </td>
            <td>
                <small class="text-muted">${relacion.contexto || relacion.title || 'Sin contexto específico'}</small>
            </td>
        `;
        
        // Agregar evento click para enfocar en el otro nodo
        fila.style.cursor = 'pointer';
        fila.addEventListener('click', () => {
            enfocarEnNodo(otroNodeId);
            mostrarNotificacion('info', `Enfocando en ${nombreOtroNodo}`);
        });
        
        tbody.appendChild(fila);
    });
}

// Función para llenar el análisis de grupos
function llenarAnalisisGrupos(nodo, relaciones) {
    const seccionAnalisis = document.getElementById('seccionAnalisisGrupos');
    const textoAnalisis = document.getElementById('analisisGrupoTexto');
    
    if (!nodo.grupo || nodo.grupo === 'sin_grupo' || relaciones.length === 0) {
        seccionAnalisis.style.display = 'none';
        return;
    }
    
    // Analizar relaciones por grupos
    const relacionesPorGrupo = {};
    let relacionesInternas = 0;
    let relacionesExternas = 0;
    
    relaciones.forEach(relacion => {
        const otroNodeId = relacion.from === nodo.id ? relacion.to : relacion.from;
        const otroNodo = nodes.get(otroNodeId);
        
        if (otroNodo) {
            const grupoOtroNodo = otroNodo.grupo || 'sin_grupo';
            relacionesPorGrupo[grupoOtroNodo] = (relacionesPorGrupo[grupoOtroNodo] || 0) + 1;
            
            if (grupoOtroNodo === nodo.grupo) {
                relacionesInternas++;
            } else {
                relacionesExternas++;
            }
        }
    });
    
    // Generar texto de análisis
    let analisisTexto = `<strong>${nodo.label?.replace(/<[^>]*>/g, '').trim()}</strong> pertenece al grupo <strong>${formatearNombreGrupo(nodo.grupo)}</strong>.<br><br>`;
    
    analisisTexto += `• <strong>${relacionesInternas}</strong> conexiones internas (dentro del mismo grupo)<br>`;
    analisisTexto += `• <strong>${relacionesExternas}</strong> conexiones externas (con otros grupos)<br><br>`;
    
    if (relacionesExternas > 0) {
        analisisTexto += `<strong>Conexiones con otros grupos:</strong><br>`;
        Object.entries(relacionesPorGrupo).forEach(([grupo, cantidad]) => {
            if (grupo !== nodo.grupo) {
                analisisTexto += `• ${formatearNombreGrupo(grupo)}: ${cantidad} conexión${cantidad > 1 ? 'es' : ''}<br>`;
            }
        });
    }
    
    // Determinar rol en la red
    const porcentajeExternas = relaciones.length > 0 ? (relacionesExternas / relaciones.length) * 100 : 0;
    
    if (porcentajeExternas >= 60) {
        analisisTexto += `<br><span class="badge bg-warning">🌉 Rol: Puente entre grupos</span>`;
    } else if (relacionesInternas >= 3) {
        analisisTexto += `<br><span class="badge bg-success">🏠 Rol: Núcleo del grupo</span>`;
    }
    
    textoAnalisis.innerHTML = analisisTexto;
    seccionAnalisis.style.display = 'block';
}

// Función para llenar el gráfico de fortaleza
function llenarGraficoFortaleza(relaciones) {
    const conteos = { debil: 0, normal: 0, fuerte: 0, muyFuerte: 0 };
    
    relaciones.forEach(relacion => {
        const fortaleza = relacion.fortaleza || relacion.width || 5;
        
        if (fortaleza <= 3) {
            conteos.debil++;
        } else if (fortaleza <= 6) {
            conteos.normal++;
        } else if (fortaleza <= 8) {
            conteos.fuerte++;
        } else {
            conteos.muyFuerte++;
        }
    });
    
    // Actualizar conteos
    document.getElementById('conteoDebil').textContent = conteos.debil;
    document.getElementById('conteoNormal').textContent = conteos.normal;
    document.getElementById('conteoFuerte').textContent = conteos.fuerte;
    document.getElementById('conteoMuyFuerte').textContent = conteos.muyFuerte;
    
    // Calcular alturas de barras (máximo 100%)
    const maxConteo = Math.max(conteos.debil, conteos.normal, conteos.fuerte, conteos.muyFuerte);
    
    if (maxConteo > 0) {
        const alturaDebil = (conteos.debil / maxConteo) * 100;
        const alturaNormal = (conteos.normal / maxConteo) * 100;
        const alturaFuerte = (conteos.fuerte / maxConteo) * 100;
        const alturaMuyFuerte = (conteos.muyFuerte / maxConteo) * 100;
        
        // Animar las barras
        setTimeout(() => {
            document.getElementById('barraDebil').style.height = alturaDebil + '%';
            document.getElementById('barraNormal').style.height = alturaNormal + '%';
            document.getElementById('barraFuerte').style.height = alturaFuerte + '%';
            document.getElementById('barraMuyFuerte').style.height = alturaMuyFuerte + '%';
        }, 300);
    }
}

// Función para configurar eventos del modal
function configurarEventosModal(nodeId) {
    // Botón enfocar nodo
    const btnEnfocar = document.getElementById('btnEnfocarNodo');
    if (btnEnfocar) {
        btnEnfocar.onclick = () => {
            enfocarEnNodo(nodeId);
            mostrarNotificacion('info', 'Vista enfocada en el contacto seleccionado');
        };
    }
    
    // Botón editar nodo
    const btnEditar = document.getElementById('btnEditarNodo');
    if (btnEditar) {
        btnEditar.onclick = () => {
            editarInformacionNodo(nodeId);
        };
    }
    
    // Limpiar barras cuando se cierre el modal
    const modalElement = document.getElementById('modalInfoNodo');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            limpiarGraficoFortaleza();
        });
    }
}

// Función para limpiar el gráfico de fortaleza
function limpiarGraficoFortaleza() {
    document.getElementById('barraDebil').style.height = '0%';
    document.getElementById('barraNormal').style.height = '0%';
    document.getElementById('barraFuerte').style.height = '0%';
    document.getElementById('barraMuyFuerte').style.height = '0%';
}

// Función para enfocar en un nodo específico
function enfocarEnNodo(nodeId) {
    if (!network) {
        console.error('❌ Network no disponible');
        return;
    }
    
    try {
        // Obtener posición del nodo
        const posiciones = network.getPositions([nodeId]);
        const posicionNodo = posiciones[nodeId];
        
        if (posicionNodo) {
            // Mover la vista al nodo
            network.moveTo({
                position: { x: posicionNodo.x, y: posicionNodo.y },
                scale: 1.5,
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });
            
            // Resaltar el nodo temporalmente
            setTimeout(() => {
                network.selectNodes([nodeId]);
                setTimeout(() => {
                    network.unselectAll();
                }, 2000);
            }, 1000);
            
            console.log('✅ Vista enfocada en nodo:', nodeId);
        }
    } catch (error) {
        console.error('❌ Error enfocando nodo:', error);
    }
}

// Función para editar información del nodo (placeholder)
function editarInformacionNodo(nodeId) {
    // Cerrar modal actual
    if (modalInfoNodo) {
        modalInfoNodo.hide();
    }
    
    // Mostrar notificación
    mostrarNotificacion('info', 'Función de edición en desarrollo. Usa el panel de administración por ahora.');
    
    // Aquí se podría abrir un modal específico para editar
    console.log('📝 Editando nodo:', nodeId);
}

// Funciones de utilidad para formateo
function formatearNombreGrupo(grupo) {
    if (!grupo || grupo === 'sin_grupo') return 'Sin grupo';
    
    const nombres = {
        'amigos': '👫 Amigos',
        'familia_cercana': '👨‍👩‍👧‍👦 Familia Cercana',
        'trabajo': '💼 Trabajo',
        'universidad': '🎓 Universidad',
        'deportes': '⚽ Deportes',
        'vecinos': '🏠 Vecinos',
        'cadiz': '🏖️ Cádiz',
        'centro': '🎯 Centro',
        'equipo_directo': '👥 Equipo Directo',
        'departamento': '🏢 Departamento',
        'colaboradores': '🤝 Colaboradores',
        'otros_departamentos': '🏬 Otros Departamentos',
        'externos': '🌐 Externos'
    };
    
    return nombres[grupo] || grupo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatearTipoRelacion(tipo) {
    if (!tipo) return 'Conexión';
    
    const tipos = {
        'amistad': 'Amistad',
        'mejor_amigo': 'Mejor Amigo/a',
        'familia': 'Familia',
        'trabajo': 'Trabajo',
        'universidad': 'Universidad',
        'deportes': 'Deportes',
        'vecinos': 'Vecinos',
        'pareja': 'Pareja',
        'conocidos': 'Conocidos',
        'profesional': 'Profesional',
        'colaboracion': 'Colaboración',
        'supervision_directa': 'Supervisión Directa',
        'colaboracion_estrecha': 'Colaboración Estrecha',
        'colaboracion_regular': 'Colaboración Regular',
        'colaboracion_interdepartamental': 'Interdepartamental',
        'relacion_externa': 'Relación Externa',
        'colaboracion_proyecto': 'Colaboración en Proyecto',
        'coordinacion_ocasional': 'Coordinación Ocasional'
    };
    
    return tipos[tipo] || tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function obtenerClaseGrupo(grupo) {
    const clases = {
        'amigos': 'bg-primary',
        'familia_cercana': 'bg-success',
        'trabajo': 'bg-info',
        'universidad': 'bg-warning',
        'deportes': 'bg-danger',
        'vecinos': 'bg-secondary',
        'cadiz': 'bg-info',
        'centro': 'bg-primary',
        'equipo_directo': 'bg-success',
        'departamento': 'bg-info',
        'colaboradores': 'bg-warning',
        'otros_departamentos': 'bg-danger',
        'externos': 'bg-secondary'
    };
    
    return clases[grupo] || 'bg-secondary';
}

function obtenerClaseFortaleza(fortaleza) {
    if (fortaleza <= 3) {
        return 'debil';
    } else if (fortaleza <= 6) {
        return 'normal';
    } else if (fortaleza <= 8) {
        return 'fuerte';
    } else {
        return 'muy-fuerte';
    }
}

// Función para integrar con el sistema existente - REEMPLAZAR ALERT
function reemplazarClickEnRed() {
    if (!network) {
        console.warn('⚠️ Network no disponible para reemplazar clicks');
        setTimeout(reemplazarClickEnRed, 1000);
        return;
    }
    
    // Remover eventos anteriores si existen
    try {
        network.off("click");
        console.log('🔄 Eventos click anteriores removidos');
    } catch (e) {
        // No había eventos anteriores
    }
    
    // Agregar nuevo evento click que usa el modal
    network.on("click", function (params) {
        if (params.nodes.length > 0 && !modoCrearArista) {
            const nodeId = params.nodes[0];
            console.log('👆 Click en nodo:', nodeId);
            
            // Mostrar modal en lugar de alert
            mostrarInformacionNodo(nodeId);
        }
    });
    
    console.log('✅ Sistema de click reemplazado - ahora usa modal en lugar de alert');
}

// Función para mostrar notificación (igual que en otros archivos)
function mostrarNotificacion(tipo, mensaje, duracion = 5000) {
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
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
    
    setTimeout(() => {
        notificacion.classList.add('notification-show');
    }, 100);
    
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.classList.remove('notification-show');
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.remove();
                }
            }, 300);
        }
    }, duracion);
}

// Función de inicialización
function inicializarModalInfoNodo() {
    console.log('📊 Inicializando sistema de modal de información...');
    
    // Esperar a que el sistema principal esté listo
    const esperarSistema = () => {
        if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
            console.log('✅ Sistema principal detectado, configurando modal de información...');
            
            // Reemplazar sistema de clicks
            reemplazarClickEnRed();
            
            console.log('✅ Sistema de modal de información inicializado correctamente');
            return true;
        }
        return false;
    };
    
    if (!esperarSistema()) {
        let intentos = 0;
        const maxIntentos = 20;
        
        const reintentar = setInterval(() => {
            intentos++;
            
            if (esperarSistema()) {
                clearInterval(reintentar);
            } else if (intentos >= maxIntentos) {
                clearInterval(reintentar);
                console.warn('⚠️ No se pudo inicializar el sistema de modal de información - tiempo agotado');
            }
        }, 1000);
    }
}

// Funciones de debug y testing
window.testModalInfo = function(nodeId = 1) {
    console.log('🧪 Test del modal de información para nodo:', nodeId);
    mostrarInformacionNodo(nodeId);
};

window.debugModalInfo = function() {
    console.log('🔍 Debug del sistema de modal de información:');
    console.log('- Modal cargado:', !!document.getElementById('modalInfoNodo'));
    console.log('- Bootstrap disponible:', typeof bootstrap !== 'undefined');
    console.log('- Network disponible:', typeof network !== 'undefined' && !!network);
    console.log('- Nodes disponible:', typeof nodes !== 'undefined' && !!nodes);
    console.log('- Edges disponible:', typeof edges !== 'undefined' && !!edges);
    
    if (nodes && nodes.length > 0) {
        console.log('- Nodos disponibles para test:', nodes.get().slice(0, 3));
    }
};

// Exportar funciones principales
window.mostrarInformacionNodo = mostrarInformacionNodo;
window.enfocarEnNodo = enfocarEnNodo;

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarModalInfoNodo);
} else {
    inicializarModalInfoNodo();
}

console.log('📊 Sistema de modal de información del nodo cargado');

// SOLUCIÓN PARA EL PROBLEMA DE SCROLL AUTOMÁTICO EN MODALES
// Agregar este código al final de static/js/node-info-modal.js

// Variables para manejar la posición del scroll
let scrollPosition = 0;

// MEJORAR LA FUNCIÓN mostrarInformacionNodo existente
// Reemplazar la función existente con esta versión corregida:

// TAMBIÉN APLICAR A LA FUNCIÓN abrirModalCrearRelacion en create-edge.js
// Agregar este código al static/js/create-edge.js: