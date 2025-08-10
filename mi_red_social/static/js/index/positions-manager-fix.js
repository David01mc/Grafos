// static/js/index/positions-manager-fix.js
// FIX para asegurar que las posiciones se configuren correctamente

console.log('🔧 Aplicando fix para sistema de posiciones...');

// Variables de estado mejoradas
const posicionesEstado = {
    configurado: false,
    intentosConfiguracion: 0,
    maxIntentos: 5
};

// Función mejorada para configurar posiciones con reintentos
function configurarPosicionesConReintentos() {
    if (posicionesEstado.configurado) {
        console.log('✅ Posiciones ya configuradas');
        return true;
    }

    if (posicionesEstado.intentosConfiguracion >= posicionesEstado.maxIntentos) {
        console.error('❌ Máximo de intentos alcanzado para configurar posiciones');
        return false;
    }

    posicionesEstado.intentosConfiguracion++;
    console.log(`🔄 Intento de configuración ${posicionesEstado.intentosConfiguracion}/${posicionesEstado.maxIntentos}`);

    // Verificar dependencias
    if (!network || !nodes) {
        console.log('⏳ Network o nodes no disponibles, reintentando...');
        setTimeout(configurarPosicionesConReintentos, 1000);
        return false;
    }

    try {
        // Configurar eventos de arrastre
        console.log('⚙️ Configurando eventos de arrastre...');
        
        // Remover eventos anteriores para evitar duplicados
        try {
            network.off('dragEnd');
        } catch (e) {
            // No había eventos anteriores
        }

        // Configurar nuevo evento
        network.on('dragEnd', function(params) {
            if (params.nodes.length > 0) {
                console.log('🎯 Nodo arrastrado, programando guardado:', params.nodes[0]);
                
                // Limpiar timeout anterior
                if (window.posicionesTimeout) {
                    clearTimeout(window.posicionesTimeout);
                }
                
                // Programar guardado con delay
                window.posicionesTimeout = setTimeout(async () => {
                    try {
                        console.log('💾 Ejecutando guardado de posiciones...');
                        await guardarPosiciones();
                        console.log('✅ Posiciones guardadas exitosamente');
                    } catch (error) {
                        console.error('❌ Error guardando posiciones:', error);
                    }
                }, 2000);
            }
        });

        // Cargar posiciones iniciales
        setTimeout(async () => {
            try {
                console.log('📥 Cargando posiciones iniciales...');
                await cargarPosiciones();
                console.log('✅ Posiciones iniciales cargadas');
            } catch (error) {
                console.error('❌ Error cargando posiciones iniciales:', error);
            }
        }, 3000);

        posicionesEstado.configurado = true;
        console.log('✅ Sistema de posiciones configurado exitosamente');
        
        return true;

    } catch (error) {
        console.error('❌ Error configurando posiciones:', error);
        setTimeout(configurarPosicionesConReintentos, 2000);
        return false;
    }
}

// Función de guardado mejorada con logs detallados
async function guardarPosicionesConLogs() {
    console.log('💾 [DEBUG] Iniciando guardado de posiciones...');
    
    if (!network || !nodes) {
        console.error('❌ [DEBUG] Network o nodes no disponibles');
        return;
    }

    try {
        const posiciones = {};
        const posicionesRed = network.getPositions();
        
        console.log('📊 [DEBUG] Posiciones obtenidas de la red:', Object.keys(posicionesRed).length);

        // Obtener posiciones de todos los nodos
        nodes.forEach(nodo => {
            if (posicionesRed[nodo.id]) {
                posiciones[nodo.id] = {
                    x: Math.round(posicionesRed[nodo.id].x),
                    y: Math.round(posicionesRed[nodo.id].y)
                };
            }
        });

        const cantidadPosiciones = Object.keys(posiciones).length;
        console.log('📍 [DEBUG] Posiciones a guardar:', cantidadPosiciones);

        if (cantidadPosiciones === 0) {
            console.warn('⚠️ [DEBUG] No hay posiciones válidas para guardar');
            return;
        }

        console.log('🌐 [DEBUG] Enviando POST a /guardar_posiciones...');
        
        const response = await fetch('/guardar_posiciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ posiciones })
        });

        console.log('📥 [DEBUG] Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('✅ [DEBUG] Resultado guardado:', resultado);

        return resultado;

    } catch (error) {
        console.error('❌ [DEBUG] Error guardando posiciones:', error);
        throw error;
    }
}

// Función de carga mejorada con logs detallados
async function cargarPosicionesConLogs() {
    console.log('📥 [DEBUG] Iniciando carga de posiciones...');
    
    try {
        console.log('🌐 [DEBUG] Enviando GET a /obtener_posiciones...');
        
        const response = await fetch('/obtener_posiciones');
        console.log('📊 [DEBUG] Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📍 [DEBUG] Datos recibidos:', data);

        if (!data.posiciones || Object.keys(data.posiciones).length === 0) {
            console.log('📝 [DEBUG] No hay posiciones guardadas en el servidor');
            return {};
        }

        const posiciones = data.posiciones;
        const cantidadPosiciones = Object.keys(posiciones).length;

        console.log(`📍 [DEBUG] ${cantidadPosiciones} posiciones cargadas del servidor`);

        // Aplicar posiciones si hay nodos disponibles
        if (nodes && nodes.length > 0) {
            console.log('🎯 [DEBUG] Aplicando posiciones a los nodos...');
            
            const updates = [];
            Object.entries(posiciones).forEach(([id, pos]) => {
                const nodeId = parseInt(id);
                if (nodes.get(nodeId)) {
                    updates.push({
                        id: nodeId,
                        x: pos.x,
                        y: pos.y,
                        physics: false
                    });
                }
            });

            if (updates.length > 0) {
                nodes.update(updates);
                console.log(`✅ [DEBUG] ${updates.length} posiciones aplicadas`);

                // Reactivar física después de un delay
                setTimeout(() => {
                    const reactivarFisica = updates.map(u => ({
                        id: u.id,
                        physics: true
                    }));
                    nodes.update(reactivarFisica);
                    console.log('⚡ [DEBUG] Física reactivada');
                }, 1000);
            }
        }

        return posiciones;

    } catch (error) {
        console.error('❌ [DEBUG] Error cargando posiciones:', error);
        return {};
    }
}

// Sobrescribir funciones globales con versiones con logs
window.guardarPosiciones = guardarPosicionesConLogs;
window.cargarPosiciones = cargarPosicionesConLogs;
window.configurarPosiciones = configurarPosicionesConReintentos;

// Auto-configuración mejorada
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 [DEBUG] DOM cargado, iniciando configuración de posiciones...');
    
    // Esperar que el sistema principal esté listo
    function esperarSistema() {
        if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
            console.log('✅ [DEBUG] Sistema principal detectado');
            configurarPosicionesConReintentos();
        } else {
            console.log('⏳ [DEBUG] Esperando sistema principal...');
            setTimeout(esperarSistema, 1000);
        }
    }
    
    setTimeout(esperarSistema, 2000);
});

// Función de test para verificar manualmente
window.testSistemaPosiciones = function() {
    console.log('🧪 [TEST] Iniciando test completo del sistema de posiciones...');
    
    console.log('📊 [TEST] Estado del sistema:');
    console.log('- Network disponible:', typeof network !== 'undefined' && !!network);
    console.log('- Nodes disponible:', typeof nodes !== 'undefined' && !!nodes);
    console.log('- Configurado:', posicionesEstado.configurado);
    console.log('- Intentos:', posicionesEstado.intentosConfiguracion);
    
    if (network && nodes) {
        console.log('🧪 [TEST] Ejecutando test de guardado...');
        guardarPosicionesConLogs();
        
        setTimeout(() => {
            console.log('🧪 [TEST] Ejecutando test de carga...');
            cargarPosicionesConLogs();
        }, 2000);
    } else {
        console.error('❌ [TEST] Sistema no está listo para pruebas');
    }
};

console.log('🔧 Fix de posiciones aplicado. Ejecuta testSistemaPosiciones() para verificar.');