// static/js/positions-manager.js
// Gestor de posiciones de nodos - Persistencia y gestión de layout

console.log('📍 Cargando gestor de posiciones...');

// Estado del gestor de posiciones
const posicionesEstado = {
    guardandoPosiciones: false,
    cargandoPosiciones: false,
    ultimoGuardado: null,
    timeoutGuardado: null,
    posicionesCache: new Map(),
    configurado: false
};

// Configuración del gestor
const POSICIONES_CONFIG = {
    delayGuardado: 2000,        // Delay después de arrastrar para guardar
    intervaloCacheado: 30000,   // Cachear posiciones cada 30 segundos
    maxIntentos: 3,             // Máximo intentos de guardado/carga
    timeoutRequest: 5000        // Timeout para requests HTTP
};

// Función mejorada para guardar posiciones
async function guardarPosiciones(forzarGuardado = false) {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network || !estado.nodes || posicionesEstado.guardandoPosiciones) {
        return;
    }
    
    if (!forzarGuardado && Date.now() - (posicionesEstado.ultimoGuardado || 0) < 1000) {
        console.log('⏳ Guardado muy reciente, saltando...');
        return;
    }
    
    posicionesEstado.guardandoPosiciones = true;
    
    try {
        console.log('💾 Guardando posiciones de nodos...');
        
        const posiciones = {};
        const posicionesRed = estado.network.getPositions();
        
        // Obtener posiciones de todos los nodos
        estado.nodes.forEach(nodo => {
            if (posicionesRed[nodo.id]) {
                posiciones[nodo.id] = {
                    x: Math.round(posicionesRed[nodo.id].x),
                    y: Math.round(posicionesRed[nodo.id].y)
                };
            }
        });
        
        const cantidadPosiciones = Object.keys(posiciones).length;
        
        if (cantidadPosiciones === 0) {
            console.warn('⚠️ No hay posiciones válidas para guardar');
            return;
        }
        
        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), POSICIONES_CONFIG.timeoutRequest);
        
        const response = await fetch('/api/posiciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ posiciones }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const resultado = await response.json();
        
        // Actualizar cache y estado
        posicionesEstado.posicionesCache.clear();
        Object.entries(posiciones).forEach(([id, pos]) => {
            posicionesEstado.posicionesCache.set(parseInt(id), pos);
        });
        
        posicionesEstado.ultimoGuardado = Date.now();
        
        console.log(`✅ ${cantidadPosiciones} posiciones guardadas exitosamente`);
        
        return resultado;
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('⏱️ Timeout guardando posiciones');
        } else {
            console.error('❌ Error guardando posiciones:', error);
        }
        throw error;
    } finally {
        posicionesEstado.guardandoPosiciones = false;
    }
}

// Función mejorada para cargar posiciones
async function cargarPosiciones(aplicarInmediatamente = true) {
    if (posicionesEstado.cargandoPosiciones) {
        console.log('⏳ Ya se están cargando posiciones...');
        return;
    }
    
    posicionesEstado.cargandoPosiciones = true;
    
    try {
        console.log('📥 Cargando posiciones desde servidor...');
        
        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), POSICIONES_CONFIG.timeoutRequest);
        
        const response = await fetch('/api/posiciones', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.posiciones || Object.keys(data.posiciones).length === 0) {
            console.log('📝 No hay posiciones guardadas en el servidor');
            return [];
        }
        
        const posiciones = data.posiciones;
        const cantidadPosiciones = Object.keys(posiciones).length;
        
        console.log(`📍 ${cantidadPosiciones} posiciones cargadas del servidor`);
        
        // Actualizar cache
        posicionesEstado.posicionesCache.clear();
        Object.entries(posiciones).forEach(([id, pos]) => {
            posicionesEstado.posicionesCache.set(parseInt(id), pos);
        });
        
        // Aplicar posiciones si se solicita
        if (aplicarInmediatamente) {
            await aplicarPosiciones(posiciones);
        }
        
        return posiciones;
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('⏱️ Timeout cargando posiciones');
        } else {
            console.error('❌ Error cargando posiciones:', error);
        }
        return {};
    } finally {
        posicionesEstado.cargandoPosiciones = false;
    }
}

// Función para aplicar posiciones a los nodos
async function aplicarPosiciones(posiciones) {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.nodes) {
        console.warn('⚠️ Nodes no disponible para aplicar posiciones');
        return;
    }
    
    try {
        const updates = [];
        let posicionesAplicadas = 0;
        
        Object.entries(posiciones).forEach(([id, pos]) => {
            const nodeId = parseInt(id);
            
            // Verificar que el nodo existe
            if (estado.nodes.get(nodeId)) {
                updates.push({
                    id: nodeId,
                    x: pos.x,
                    y: pos.y,
                    physics: false // Desactivar física temporalmente
                });
                posicionesAplicadas++;
            }
        });
        
        if (updates.length > 0) {
            estado.nodes.update(updates);
            console.log(`📍 ${posicionesAplicadas} posiciones aplicadas a los nodos`);
            
            // Reactivar física después de un delay
            setTimeout(() => {
                const reactivarFisica = updates.map(u => ({
                    id: u.id,
                    physics: true
                }));
                estado.nodes.update(reactivarFisica);
                console.log('⚡ Física reactivada en los nodos');
            }, 1000);
        } else {
            console.log('📝 No se aplicaron posiciones (nodos no encontrados)');
        }
        
    } catch (error) {
        console.error('❌ Error aplicando posiciones:', error);
    }
}

// Función para configurar el sistema de posiciones
function configurarPosiciones() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network || posicionesEstado.configurado) {
        return;
    }
    
    try {
        console.log('⚙️ Configurando sistema de posiciones...');
        
        // Configurar evento de arrastre con debounce
        estado.network.on('dragEnd', function(params) {
            if (params.nodes.length > 0) {
                console.log(`🎯 Nodo arrastrado: ${params.nodes[0]}`);
                
                // Limpiar timeout anterior
                if (posicionesEstado.timeoutGuardado) {
                    clearTimeout(posicionesEstado.timeoutGuardado);
                }
                
                // Programar guardado con delay
                posicionesEstado.timeoutGuardado = setTimeout(() => {
                    guardarPosiciones().catch(error => {
                        console.error('❌ Error en guardado automático:', error);
                    });
                }, POSICIONES_CONFIG.delayGuardado);
            }
        });
        
        // Cargar posiciones iniciales después de un delay
        setTimeout(() => {
            cargarPosiciones().catch(error => {
                console.error('❌ Error cargando posiciones iniciales:', error);
            });
        }, 2000);
        
        // Configurar guardado automático periódico
        setInterval(() => {
            if (estado.redLista && !posicionesEstado.guardandoPosiciones) {
                guardarPosiciones().catch(error => {
                    console.error('❌ Error en guardado periódico:', error);
                });
            }
        }, POSICIONES_CONFIG.intervaloCacheado);
        
        posicionesEstado.configurado = true;
        console.log('✅ Sistema de posiciones configurado exitosamente');
        
    } catch (error) {
        console.error('❌ Error configurando sistema de posiciones:', error);
    }
}

// Función para obtener posiciones desde el cache
function obtenerPosicionesCache() {
    const posiciones = {};
    posicionesEstado.posicionesCache.forEach((pos, id) => {
        posiciones[id] = pos;
    });
    return posiciones;
}

// Función para limpiar cache de posiciones
function limpiarCachePosiciones() {
    posicionesEstado.posicionesCache.clear();
    console.log('🧹 Cache de posiciones limpiado');
}

// Función para forzar guardado inmediato
async function forzarGuardadoPosiciones() {
    try {
        console.log('💾 Forzando guardado inmediato de posiciones...');
        await guardarPosiciones(true);
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('success', 'Posiciones guardadas manualmente');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error forzando guardado:', error);
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', 'Error guardando posiciones');
        }
        
        return false;
    }
}

// Función para restaurar posiciones por defecto
async function restaurarPosicionesDefecto() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network || !estado.nodes) {
        console.warn('⚠️ Red no disponible');
        return;
    }
    
    try {
        console.log('🔄 Restaurando posiciones por defecto...');
        
        // Activar física temporalmente para reorganización automática
        estado.network.setOptions({
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.01,
                    springLength: 100,
                    springConstant: 0.08,
                    damping: 0.4,
                    avoidOverlap: 0.5
                },
                stabilization: {
                    enabled: true,
                    iterations: 100,
                    updateInterval: 25,
                    onlyDynamicEdges: false,
                    fit: true
                }
            }
        });
        
        // Esperar estabilización
        estado.network.once('stabilizationIterationsDone', async () => {
            console.log('✅ Red estabilizada con layout por defecto');
            
            // Desactivar física
            estado.network.setOptions({ physics: { enabled: false } });
            
            // Guardar las nuevas posiciones
            setTimeout(async () => {
                await guardarPosiciones(true);
                console.log('💾 Nuevas posiciones por defecto guardadas');
                
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion('success', 'Posiciones restauradas al layout por defecto');
                }
            }, 1000);
        });
        
        // Backup: desactivar física después de 10 segundos
        setTimeout(() => {
            estado.network.setOptions({ physics: { enabled: false } });
        }, 10000);
        
    } catch (error) {
        console.error('❌ Error restaurando posiciones:', error);
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', 'Error restaurando posiciones');
        }
    }
}

// Función de diagnóstico
window.diagnosticoPosiciones = function() {
    console.log('📍 DIAGNÓSTICO DEL SISTEMA DE POSICIONES:');
    console.log('==========================================');
    
    const estado = window.obtenerEstadoRed();
    
    console.log('Sistema configurado:', posicionesEstado.configurado ? '✅' : '❌');
    console.log('Guardando posiciones:', posicionesEstado.guardandoPosiciones ? '🔄' : '✅');
    console.log('Cargando posiciones:', posicionesEstado.cargandoPosiciones ? '🔄' : '✅');
    console.log('Último guardado:', posicionesEstado.ultimoGuardado ? 
        new Date(posicionesEstado.ultimoGuardado).toLocaleString() : 'Nunca');
    console.log('Posiciones en cache:', posicionesEstado.posicionesCache.size);
    
    if (estado.network) {
        const posicionesActuales = estado.network.getPositions();
        console.log('Posiciones actuales en red:', Object.keys(posicionesActuales).length);
    }
    
    console.log('==========================================');
    
    // Test de conectividad
    console.log('🧪 Probando conectividad con servidor...');
    fetch('/api/posiciones')
        .then(response => response.ok ? 
            console.log('✅ Servidor de posiciones accesible') : 
            console.log('❌ Servidor de posiciones no responde'))
        .catch(error => console.log('❌ Error conectando:', error.message));
};

// Función de estadísticas de posiciones
window.estadisticasPosiciones = function() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network || !estado.nodes) {
        console.log('❌ Red no disponible para estadísticas');
        return;
    }
    
    const posiciones = estado.network.getPositions();
    const stats = {
        totalNodos: Object.keys(posiciones).length,
        enCache: posicionesEstado.posicionesCache.size,
        rangoX: { min: Infinity, max: -Infinity },
        rangoY: { min: Infinity, max: -Infinity },
        centroide: { x: 0, y: 0 }
    };
    
    let sumX = 0, sumY = 0;
    
    Object.values(posiciones).forEach(pos => {
        stats.rangoX.min = Math.min(stats.rangoX.min, pos.x);
        stats.rangoX.max = Math.max(stats.rangoX.max, pos.x);
        stats.rangoY.min = Math.min(stats.rangoY.min, pos.y);
        stats.rangoY.max = Math.max(stats.rangoY.max, pos.y);
        sumX += pos.x;
        sumY += pos.y;
    });
    
    stats.centroide.x = Math.round(sumX / stats.totalNodos);
    stats.centroide.y = Math.round(sumY / stats.totalNodos);
    
    console.log('📊 ESTADÍSTICAS DE POSICIONES:');
    console.table(stats);
    
    return stats;
};




// Exportar funciones principales
window.configurarPosiciones = configurarPosiciones;
window.guardarPosiciones = guardarPosiciones;
window.cargarPosiciones = cargarPosiciones;
window.forzarGuardadoPosiciones = forzarGuardadoPosiciones;
window.restaurarPosicionesDefecto = restaurarPosicionesDefecto;
window.limpiarCachePosiciones = limpiarCachePosiciones;
window.obtenerPosicionesCache = obtenerPosicionesCache;

console.log('📍 Gestor de posiciones cargado');