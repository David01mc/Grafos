// static/js/network-controls.js
// Controles de la red - Funciones de manipulación y navegación

console.log('🎮 Cargando controles de red...');

// Estados de los controles
const controlesEstado = {
    fisicaActivada: false,
    centrandoVista: false,
    reorganizando: false,
    recargando: false
};

// Configuraciones de física
const FISICA_CONFIG = {
    suave: {
        barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.1,
            springLength: 100,
            springConstant: 0.02,
            damping: 0.09,
            avoidOverlap: 0.1
        }
    },
    normal: {
        barnesHut: {
            gravitationalConstant: -6000,
            centralGravity: 0.2,
            springLength: 80,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.1
        }
    }
};

// Función mejorada para centrar la red
function centrarRed() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network) {
        actualizarEstado('❌ Red no disponible', 'error');
        return;
    }
    
    if (controlesEstado.centrandoVista) {
        console.log('⏳ Ya se está centrando la vista...');
        return;
    }
    
    controlesEstado.centrandoVista = true;
    
    try {
        
        estado.network.fit({
            animation: {
                duration: 800,
                easingFunction: 'easeInOutQuad'
            }
        });
        
        setTimeout(() => {
            controlesEstado.centrandoVista = false;
            
            // Volver al estado normal después de 2 segundos
            setTimeout(() => {
                if (estado.redLista) {
                }
            }, 2000);
        }, 800);
        
        console.log('🎯 Vista centrada exitosamente');
        
    } catch (error) {
        console.error('❌ Error centrando vista:', error);
        actualizarEstado('❌ Error centrando vista', 'error');
        controlesEstado.centrandoVista = false;
    }
}

// Función mejorada para toggle de física
function togglePhysics() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network) {
        actualizarEstado('❌ Red no disponible', 'error');
        return;
    }
    
    try {
        controlesEstado.fisicaActivada = !controlesEstado.fisicaActivada;
        
        const configFisica = {
            physics: {
                enabled: controlesEstado.fisicaActivada,
                ...(controlesEstado.fisicaActivada && FISICA_CONFIG.suave)
            }
        };
        
        estado.network.setOptions(configFisica);
        
        // Actualizar UI del botón
        actualizarBotonFisica();
        
        // Actualizar estado
        const estadoTexto = controlesEstado.fisicaActivada ? 'activada' : 'desactivada';
        actualizarEstado(`⚡ Física ${estadoTexto}`, controlesEstado.fisicaActivada ? 'info' : 'success');
        
        console.log(`⚡ Física ${estadoTexto}`);
        
        // Si se desactiva la física, volver al estado normal
        if (!controlesEstado.fisicaActivada) {
            setTimeout(() => {
                if (estado.redLista) {
                }
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Error cambiando física:', error);
        actualizarEstado('❌ Error con física', 'error');
    }
}

// Función para actualizar el botón de física
function actualizarBotonFisica() {
    const botonFisica = document.querySelector('button[onclick="togglePhysics()"]');
    if (botonFisica) {
        const icono = botonFisica.querySelector('i');
        const iconoHtml = icono ? icono.outerHTML : '<i class="icon icon-lightning icon-sm"></i>';
        const texto = controlesEstado.fisicaActivada ? 'Desactivar Física' : 'Activar Física';
        botonFisica.innerHTML = `${iconoHtml} ${texto}`;
        
        // Cambiar clase del botón
        botonFisica.className = controlesEstado.fisicaActivada 
            ? 'btn btn-warning btn-custom btn-sm me-2'
            : 'btn btn-info btn-custom btn-sm me-2';
    }
}

// Función mejorada para reorganizar posiciones
function randomizePositions() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.nodes || !estado.network) {
        actualizarEstado('❌ Red no disponible', 'error');
        return;
    }
    
    if (controlesEstado.reorganizando) {
        console.log('⏳ Ya se está reorganizando...');
        return;
    }
    
    controlesEstado.reorganizando = true;
    
    try {
        actualizarEstado('🔄 Reorganizando red...', 'info');
        
        // Generar nuevas posiciones aleatorias más distribuidas
        const updates = [];
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
        
        estado.nodes.forEach(node => {
            // Distribución circular más natural
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * radius;
            
            updates.push({
                id: node.id,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance
            });
        });
        
        estado.nodes.update(updates);
        
        // Centrar la vista después de reorganizar
        setTimeout(() => {
            estado.network.fit({
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });
            
            setTimeout(() => {
                controlesEstado.reorganizando = false;
                
                // Volver al estado normal
                setTimeout(() => {
                    if (estado.redLista) {
                    }
                }, 2000);
            }, 1000);
            
        }, 100);
        
        console.log(`🔄 ${updates.length} nodos reorganizados`);
        
    } catch (error) {
        console.error('❌ Error reorganizando:', error);
        actualizarEstado('❌ Error reorganizando', 'error');
        controlesEstado.reorganizando = false;
    }
}

// Función mejorada para recargar datos
async function recargarDatos() {
    if (controlesEstado.recargando) {
        console.log('⏳ Ya hay una recarga en progreso...');
        return;
    }
    
    console.log('🔄 Iniciando recarga completa del sistema...');
    controlesEstado.recargando = true;
    
    try {
        
        // Verificar estado actual
        const estado = window.obtenerEstadoRed();
        if (!estado.network) {
            console.log('⚠️ Red no disponible, iniciando desde cero...');
            await window.inicializarRed();
            return;
        }
        
        // Limpiar sistemas existentes
        await limpiarSistemasExistentes();
        
        // Recargar datos frescos del servidor
        console.log('📥 Cargando datos frescos...');
        const data = await window.cargarDatos(true); // Forzar recarga
        
        if (data.nodes.length === 0) {
            actualizarEstado('⚠️ Sin datos disponibles', 'warning');
            return;
        }
        
        // Actualizar datasets existentes
        estado.nodes.clear();
        estado.nodes.add(data.nodes);
        estado.edges.clear();
        estado.edges.add(data.edges);
        
        console.log(`📊 Datasets actualizados: ${data.nodes.length} nodos, ${data.edges.length} aristas`);
        
        // Actualizar estadísticas
        window.actualizarEstadisticas(data);
        
        // Reconfigurar funcionalidades después de un delay
        setTimeout(async () => {
            await reconfigurarFuncionalidades();
            
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error durante recarga:', error);
        actualizarEstado(`❌ Error: ${error.message}`, 'error');
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', `Error recargando: ${error.message}`);
        }
    } finally {
        controlesEstado.recargando = false;
    }
}

// Función para limpiar sistemas existentes
async function limpiarSistemasExistentes() {
    console.log('🧹 Limpiando sistemas existentes...');
    
    try {
        // Limpiar burbujas
        if (typeof limpiarBurbujasAnteriores === 'function') {
            limpiarBurbujasAnteriores();
        }
        
        // Limpiar eventos específicos de la red
        const estado = window.obtenerEstadoRed();
        if (estado.network) {
            try {
                // Solo limpiar eventos específicos que sabemos que existen
                const eventosALimpiar = ['zoom', 'dragStart', 'dragging', 'dragEnd'];
                eventosALimpiar.forEach(evento => {
                    try {
                        estado.network.off(evento);
                    } catch (e) {
                        // Ignorar errores de eventos que no existen
                    }
                });
            } catch (e) {
                console.log('⚠️ Algunos eventos ya estaban limpiados');
            }
        }
        
        // Reset de estados de control
        controlesEstado.fisicaActivada = false;
        controlesEstado.centrandoVista = false;
        controlesEstado.reorganizando = false;
        
    } catch (error) {
        console.error('❌ Error limpiando sistemas:', error);
    }
}

// Función para reconfigurar funcionalidades después de recarga
async function reconfigurarFuncionalidades() {
    console.log('🔧 Reconfigurando funcionalidades...');
    
    try {
        // Reconfigurar creación de nodos
        if (typeof configurarDobleClickCrearNodo === 'function') {
            configurarDobleClickCrearNodo();
            console.log('🎯 Doble clic reconfigurado');
        }
        
        // Reconfigurar creación de aristas
        if (typeof configurarHoverCrearAristas === 'function') {
            configurarHoverCrearAristas();
            console.log('🔗 Hover para aristas reconfigurado');
        }
        
        // Reconfigurar modal de información
        if (typeof reemplazarClickEnRed === 'function') {
            reemplazarClickEnRed();
            console.log('📊 Modal de información reconfigurado');
        }
        
        // Reconfigurar sistema de grupos con delay
        setTimeout(async () => {
            try {
                // Sincronizar grupos
                if (typeof sincronizarGruposAlCargar === 'function') {
                    await sincronizarGruposAlCargar();
                }
                
                // Recrear burbujas si hay grupos
                const estado = window.obtenerEstadoRed();
                if (estado.nodes) {
                    const nodosConGrupos = estado.nodes.get().filter(nodo => 
                        nodo.grupo && nodo.grupo !== 'sin_grupo'
                    );
                    
                    if (nodosConGrupos.length > 0) {
                        console.log(`🫧 Recreando burbujas para ${nodosConGrupos.length} nodos...`);
                        
                        // Activar burbujas
                        if (typeof window.burbujasActivas !== 'undefined') {
                            window.burbujasActivas = true;
                        }
                        
                        // Crear burbujas
                        if (typeof crearBurbujasGrupos === 'function') {
                            crearBurbujasGrupos();

                            // Configurar eventos de burbujas
                            setTimeout(() => {
                                if (typeof configurarEventosBurbujas === 'function') {
                                    configurarEventosBurbujas();
                                    console.log('⚡ Eventos de burbujas reconfigurados');
                                }
                            }, 500);
                        }
                    } else {
                        console.log('📝 No hay grupos para recrear burbujas');
                    }
                }
                
            } catch (error) {
                console.error('❌ Error reconfigurando grupos:', error);
            }
        }, 1500);

        
    } catch (error) {
        console.error('❌ Error reconfigurando funcionalidades:', error);
    }
}

// Función para ajustar tamaño de red
function ajustarTamanoRed() {
    const estado = window.obtenerEstadoRed();
    
    if (estado.network) {
        try {
            estado.network.redraw();
            setTimeout(() => {
                estado.network.fit();
            }, 100);
            console.log('📐 Tamaño de red ajustado');
        } catch (error) {
            console.error('❌ Error ajustando tamaño:', error);
        }
    }
}

// Función de utilidad para verificar y ejecutar acción solo si la red está lista
function ejecutarSiRedLista(accion, nombreAccion) {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.redLista || !estado.network) {
        console.warn(`⚠️ No se puede ejecutar ${nombreAccion}: red no está lista`);
        actualizarEstado(`⚠️ Red no está lista para ${nombreAccion}`, 'warning');
        return false;
    }
    
    try {
        accion();
        return true;
    } catch (error) {
        console.error(`❌ Error ejecutando ${nombreAccion}:`, error);
        actualizarEstado(`❌ Error en ${nombreAccion}`, 'error');
        return false;
    }
}

// Funciones de navegación avanzada
function zoomIn() {
    ejecutarSiRedLista(() => {
        const estado = window.obtenerEstadoRed();
        const escalaActual = estado.network.getScale();
        estado.network.moveTo({
            scale: Math.min(escalaActual * 1.2, 3.0),
            animation: { duration: 300 }
        });
        console.log('🔍 Zoom in aplicado');
    }, 'zoom in');
}

function zoomOut() {
    ejecutarSiRedLista(() => {
        const estado = window.obtenerEstadoRed();
        const escalaActual = estado.network.getScale();
        estado.network.moveTo({
            scale: Math.max(escalaActual * 0.8, 0.1),
            animation: { duration: 300 }
        });
        console.log('🔍 Zoom out aplicado');
    }, 'zoom out');
}

function resetZoom() {
    ejecutarSiRedLista(() => {
        const estado = window.obtenerEstadoRed();
        estado.network.moveTo({
            scale: 1.0,
            animation: { duration: 500 }
        });
        console.log('🔍 Zoom reseteado');
    }, 'reset zoom');
}

// Función para exportar la vista actual
function exportarVista() {
    ejecutarSiRedLista(() => {
        const canvas = document.querySelector('#network canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `red-relaciones-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
            
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('success', 'Vista exportada como imagen');
            }
            console.log('💾 Vista exportada');
        }
    }, 'exportar vista');
}

// Función para resetear todos los controles
function resetearControles() {
    console.log('🔄 Reseteando todos los controles...');
    
    // Reset de estados
    controlesEstado.fisicaActivada = false;
    controlesEstado.centrandoVista = false;
    controlesEstado.reorganizando = false;
    controlesEstado.recargando = false;
    
    // Actualizar UI
    actualizarBotonFisica();
    
    // Reset de vista
    centrarRed();
    
}



// Función para obtener estado completo de controles
window.obtenerEstadoControles = function() {
    return {
        ...controlesEstado,
        timestamp: new Date().toISOString(),
        redDisponible: window.esRedValida()
    };
};

// Exportar funciones principales
window.centrarRed = centrarRed;
window.togglePhysics = togglePhysics;
window.randomizePositions = randomizePositions;
window.recargarDatos = recargarDatos;
window.ajustarTamanoRed = ajustarTamanoRed;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;
window.exportarVista = exportarVista;
window.resetearControles = resetearControles;

console.log('🎮 Controles de red cargados correctamente');