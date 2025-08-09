// static/js/integration-layer.js
// Capa de integración entre todos los sistemas

console.log('🚀 Iniciando capa de integración del sistema...');

// Función CORREGIDA para mostrar estadísticas de grupos - SIN RECURSIÓN
window.mostrarEstadisticasGruposModal = function() {
    console.log('📊 Abriendo modal de estadísticas de grupos...');
    
    // Verificar que los sistemas estén disponibles
    if (typeof obtenerEstadisticasGrupos !== 'function') {
        console.warn('⚠️ Función obtenerEstadisticasGrupos no disponible');
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('warning', 'Sistema de estadísticas no disponible aún. Intenta en unos segundos.');
        }
        return;
    }
    
    try {
        // Llamar a la función SIN recursión - usando la función global
        const stats = obtenerEstadisticasGrupos();
        console.log('📊 Estadísticas obtenidas:', stats);
        console.table(stats);
        
        // Crear modal para mostrar estadísticas
        let html = `
            <div class="modal fade" id="modalEstadisticasGrupos" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="icon icon-chart"></i>
                                Estadísticas de Grupos
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Grupo</th>
                                            <th>Nodos</th>
                                            <th>Conexiones Internas</th>
                                            <th>Conexiones Externas</th>
                                            <th>Densidad Interna</th>
                                            <th>Color</th>
                                        </tr>
                                    </thead>
                                    <tbody>
        `;
        
        if (Object.keys(stats).length === 0) {
            html += '<tr><td colspan="6" class="text-center text-muted">No hay grupos con datos suficientes</td></tr>';
        } else {
            Object.entries(stats).forEach(([grupo, data]) => {
                const nombreFormateado = typeof formatearNombreGrupo === 'function' ? formatearNombreGrupo(grupo) : grupo;
                html += `
                    <tr>
                        <td><strong>${nombreFormateado}</strong></td>
                        <td><span class="badge bg-primary">${data.nodos}</span></td>
                        <td><span class="badge bg-success">${data.conexionesInternas}</span></td>
                        <td><span class="badge bg-info">${data.conexionesExternas}</span></td>
                        <td><span class="badge bg-warning">${data.densidad}</span></td>
                        <td>
                            <div style="width: 20px; height: 20px; background: ${data.color}; border-radius: 50%; border: 1px solid #ccc;"></div>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="alert alert-info mt-3">
                                <h6><i class="icon icon-chart"></i> Explicación:</h6>
                                <ul class="mb-0">
                                    <li><strong>Nodos:</strong> Cantidad de personas en el grupo</li>
                                    <li><strong>Conexiones Internas:</strong> Relaciones entre miembros del mismo grupo</li>
                                    <li><strong>Conexiones Externas:</strong> Relaciones con personas de otros grupos</li>
                                    <li><strong>Densidad Interna:</strong> Porcentaje de conexiones internas respecto al máximo posible</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="if(typeof crearBurbujasGrupos === 'function') crearBurbujasGrupos()">
                                <i class="icon icon-refresh"></i> Actualizar Burbujas
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Limpiar modal anterior
        const modalAnterior = document.getElementById('modalEstadisticasGrupos');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar y mostrar nuevo modal
        document.body.insertAdjacentHTML('beforeend', html);
        
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(document.getElementById('modalEstadisticasGrupos'));
            modal.show();
        } else {
            console.error('❌ Bootstrap no disponible para mostrar modal');
        }
        
        console.log('✅ Modal de estadísticas mostrado correctamente');
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', 'Error al obtener estadísticas de grupos: ' + error.message);
        }
    }
};

// Función para demostración de grupos
window.crearGruposDemo = function() {
    console.log('🧪 Creando grupos de demostración...');
    
    if (!nodes) {
        console.error('❌ Nodes no disponible');
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', 'Sistema de nodos no disponible');
        }
        return;
    }
    
    // Obtener todos los nodos
    const todosLosNodos = nodes.get();
    
    if (todosLosNodos.length < 4) {
        console.log('⚠️ Se necesitan al menos 4 nodos para la demo');
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('info', 'Agrega más personas para ver una mejor demostración de grupos');
        }
        return;
    }
    
    // Asignar grupos de ejemplo
    const updates = [];
    
    todosLosNodos.forEach((nodo, index) => {
        let grupo = null;
        
        // Distribuir nodos en grupos de ejemplo
        if (index % 4 === 0) {
            grupo = 'universidad';
        } else if (index % 4 === 1) {
            grupo = 'trabajo';
        } else if (index % 4 === 2) {
            grupo = 'cadiz';
        } else {
            grupo = 'amigos';
        }
        
        updates.push({
            id: nodo.id,
            grupo: grupo
        });
    });
    
    // Aplicar cambios en frontend
    nodes.update(updates);
    
    // Enviar cambios al servidor para persistencia
    if (typeof enviarActualizacionesGruposAlServidor === 'function') {
        enviarActualizacionesGruposAlServidor(updates).then(resultado => {
            if (resultado.success) {
                console.log('✅ Grupos demo guardados en servidor');
                
                // Crear burbujas
                setTimeout(() => {
                    if (typeof crearBurbujasGrupos === 'function') {
                        crearBurbujasGrupos();
                        console.log('✅ Burbujas de grupos creadas');
                    }
                }, 500);
                
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion('success', '¡Grupos de demostración creados y guardados! Ahora puedes ver las burbujas de colores.');
                }
            } else {
                console.error('❌ Error guardando grupos demo');
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion('error', 'Error guardando grupos de demostración');
                }
            }
        }).catch(error => {
            console.error('❌ Error enviando grupos demo al servidor:', error);
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('error', 'Error de conexión al guardar grupos demo');
            }
        });
    } else {
        console.warn('⚠️ Sistema de persistencia no disponible');
    }
    
    console.log('✅ Grupos demo aplicados a', updates.length, 'nodos');
};

// Función para limpiar grupos demo
window.limpiarGruposDemo = function() {
    console.log('🧹 Limpiando grupos de demostración...');
    
    if (!nodes) {
        console.error('❌ Nodes no disponible');
        return;
    }
    
    const todosLosNodos = nodes.get();
    const updates = todosLosNodos.map(nodo => ({
        id: nodo.id,
        grupo: null
    }));
    
    // Aplicar cambios en frontend
    nodes.update(updates);
    
    // Enviar cambios al servidor
    if (typeof enviarActualizacionesGruposAlServidor === 'function') {
        enviarActualizacionesGruposAlServidor(updates).then(resultado => {
            if (resultado.success) {
                console.log('✅ Grupos limpiados en servidor');
            }
        }).catch(error => {
            console.error('❌ Error limpiando grupos en servidor:', error);
        });
    }
    
    if (typeof limpiarBurbujasAnteriores === 'function') {
        limpiarBurbujasAnteriores();
        console.log('✅ Burbujas limpiadas');
    }
    
    if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('info', 'Grupos de demostración eliminados');
    }
    console.log('✅ Grupos demo eliminados de', updates.length, 'nodos');
};

// Función mejorada para mostrar notificación
function mostrarNotificacion(tipo, mensaje, duracion = 5000) {
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
    
    // Auto-eliminar después de la duración especificada
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

// Exportar función globalmente
window.mostrarNotificacion = mostrarNotificacion;

// Función de debug global para probar todo el sistema
window.debugSistemaCompleto = function() {
    console.log('🔍 DEBUG DEL SISTEMA COMPLETO CON PERSISTENCIA:');
    console.log('===============================================');
    
    // Verificar componentes principales
    console.log('📊 Red principal:', typeof network !== 'undefined' && network ? '✅ Disponible' : '❌ No disponible');
    console.log('👥 Nodos:', typeof nodes !== 'undefined' && nodes ? `✅ Disponible (${nodes.length} nodos)` : '❌ No disponible');
    console.log('🔗 Aristas:', typeof edges !== 'undefined' && edges ? `✅ Disponible (${edges.length} aristas)` : '❌ No disponible');
    
    // Verificar sistemas adicionales
    console.log('🎯 Creación nodos:', typeof configurarDobleClickCrearNodo === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('🔗 Creación aristas:', typeof configurarHoverCrearAristas === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('🫧 Sistema burbujas:', typeof crearBurbujasGrupos === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('📋 Gestión grupos:', typeof abrirModalGestionGrupos === 'function' ? '✅ Disponible' : '❌ No disponible');
    
    // Verificar persistencia
    console.log('💾 Persistencia grupos:', typeof enviarActualizacionesGruposAlServidor === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('📥 Obtener grupos:', typeof obtenerGruposDelServidor === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('🔄 Sincronización:', typeof sincronizarGruposAlCargar === 'function' ? '✅ Disponible' : '❌ No disponible');
    
    // Estado de burbujas
    if (typeof burbujasActivas !== 'undefined') {
        console.log('🫧 Burbujas activas:', burbujasActivas ? '✅ Activadas' : '❌ Desactivadas');
        console.log('🎨 Opacidad burbujas:', typeof opacidadBurbujas !== 'undefined' ? opacidadBurbujas : 'N/A');
    } else {
        console.log('🫧 Estado burbujas: No disponible');
    }
    
    // Estadísticas de grupos (SIN RECURSIÓN)
    try {
        if (typeof obtenerEstadisticasGrupos === 'function') {
            const stats = obtenerEstadisticasGrupos();
            console.log('📊 Estadísticas grupos disponibles:', Object.keys(stats).length, 'grupos');
            console.table(stats);
        } else {
            console.log('📊 Estadísticas grupos: No disponible aún');
        }
    } catch (error) {
        console.log('📊 Estadísticas grupos: Error -', error.message);
    }
    
    // Bootstrap
    console.log('🅱️ Bootstrap:', typeof bootstrap !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
    
    console.log('===============================================');
    console.log('💡 Funciones de prueba disponibles:');
    console.log('- crearGruposDemo() - Crear grupos de demostración (CON PERSISTENCIA)');
    console.log('- limpiarGruposDemo() - Limpiar grupos demo (CON PERSISTENCIA)');
    console.log('- verificarSincronizacionGrupos() - Verificar sincronización con servidor');
    console.log('- diagnosticarProblemasPersistencia() - Diagnosticar problemas');
    console.log('- mostrarEstadisticasGruposModal() - Ver estadísticas en modal');
    console.log('===============================================');
};

// Mostrar mensaje de bienvenida cuando todo esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, esperando sistemas con persistencia...');
    
    setTimeout(function() {
        // Verificar si todo está cargado
        const sistemaCompleto = (
            typeof network !== 'undefined' && network &&
            typeof crearBurbujasGrupos === 'function' &&
            typeof abrirModalGestionGrupos === 'function' &&
            typeof enviarActualizacionesGruposAlServidor === 'function'
        );
        
        if (sistemaCompleto) {
            console.log('🎉 ¡Sistema completo de red social con grupos Y PERSISTENCIA cargado exitosamente!');
            console.log('💾 Los grupos ahora se guardan automáticamente en el servidor');
            console.log('🔄 Al recargar la página, los grupos se mantienen');
            console.log('💡 Ejecuta debugSistemaCompleto() para ver el estado completo');
            console.log('🧪 Ejecuta crearGruposDemo() para ver una demostración de grupos PERSISTENTES');
            console.log('🔍 Ejecuta diagnosticarProblemasPersistencia() para verificar el sistema');
            console.log('✨ ¡Todo listo para usar con persistencia completa!');
            
            // Sincronizar grupos automáticamente al cargar
            setTimeout(async () => {
                try {
                    if (typeof sincronizarGruposAlCargar === 'function') {
                        await sincronizarGruposAlCargar();
                        console.log('🔄 Sincronización automática completada');
                    }
                } catch (error) {
                    console.warn('⚠️ Error en sincronización automática:', error);
                }
            }, 1000);
            
        } else {
            console.log('⏳ Sistema aún cargando... ejecuta debugSistemaCompleto() para ver el estado');
        }
    }, 3000);
});

console.log('✅ Capa de integración del sistema cargada correctamente');