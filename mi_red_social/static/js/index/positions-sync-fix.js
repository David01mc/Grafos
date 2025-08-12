// static/js/positions-sync-fix.js
// FIX DEFINITIVO para el problema de sincronización de posiciones

console.log('🔧 Aplicando fix de sincronización de posiciones...');

// Función mejorada para cargar Y aplicar posiciones correctamente
async function cargarYAplicarPosiciones() {
    console.log('📥 [SYNC] Iniciando carga y aplicación de posiciones...');
    
    try {
        // 1. Verificar que el sistema esté listo
        if (!network || !nodes) {
            console.warn('⚠️ [SYNC] Sistema no listo, reintentando en 1 segundo...');
            setTimeout(cargarYAplicarPosiciones, 1000);
            return;
        }

        // 2. Verificar que tengamos nodos
        const todosLosNodos = nodes.get();
        if (todosLosNodos.length === 0) {
            console.warn('⚠️ [SYNC] No hay nodos disponibles, reintentando...');
            setTimeout(cargarYAplicarPosiciones, 1000);
            return;
        }

        console.log(`📊 [SYNC] Sistema listo: ${todosLosNodos.length} nodos disponibles`);

        // 3. Cargar posiciones del servidor
        console.log('🌐 [SYNC] Cargando posiciones del servidor...');
        const response = await fetch('/api/posiciones');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 [SYNC] Respuesta del servidor:', data);

        if (!data.posiciones || Object.keys(data.posiciones).length === 0) {
            console.log('📝 [SYNC] No hay posiciones guardadas, usando layout automático');
            return;
        }

        const posicionesServidor = data.posiciones;
        console.log(`📍 [SYNC] ${Object.keys(posicionesServidor).length} posiciones cargadas`);

        // 4. Aplicar posiciones INMEDIATAMENTE
        const updates = [];
        let posicionesAplicadas = 0;

        Object.entries(posicionesServidor).forEach(([id, pos]) => {
            const nodeId = parseInt(id);
            const nodo = nodes.get(nodeId);
            
            if (nodo) {
                updates.push({
                    id: nodeId,
                    x: parseFloat(pos.x),
                    y: parseFloat(pos.y),
                    physics: false // CRÍTICO: Desactivar física para fijar posición
                });
                posicionesAplicadas++;
                console.log(`📍 [SYNC] Aplicando posición a nodo ${nodeId}: (${pos.x}, ${pos.y})`);
            } else {
                console.warn(`⚠️ [SYNC] Nodo ${nodeId} no encontrado en el dataset`);
            }
        });

        if (updates.length > 0) {
            console.log(`🎯 [SYNC] Aplicando ${updates.length} actualizaciones de posición...`);
            
            // APLICAR INMEDIATAMENTE
            nodes.update(updates);
            
            console.log(`✅ [SYNC] ${posicionesAplicadas} posiciones aplicadas exitosamente`);
            
            // Opcional: Reactivar física después de un delay MÁS LARGO
            setTimeout(() => {
                console.log('⚡ [SYNC] Reactivando física...');
                const reactivarFisica = updates.map(u => ({
                    id: u.id,
                    physics: true
                }));
                nodes.update(reactivarFisica);
                console.log('✅ [SYNC] Física reactivada');
            }, 3000); // 3 segundos en lugar de 1
            
        } else {
            console.warn('⚠️ [SYNC] No se encontraron nodos coincidentes para aplicar posiciones');
        }

        return posicionesServidor;

    } catch (error) {
        console.error('❌ [SYNC] Error en carga y aplicación:', error);
        return {};
    }
}

// Función mejorada para guardar posiciones con verificación
async function guardarPosicionesConVerificacion() {
    console.log('💾 [SYNC] Iniciando guardado con verificación...');
    
    if (!network || !nodes) {
        console.error('❌ [SYNC] Network o nodes no disponibles para guardado');
        return;
    }

    try {
        const posiciones = {};
        const posicionesRed = network.getPositions();
        const todosLosNodos = nodes.get();
        
        console.log(`📊 [SYNC] Obteniendo posiciones de ${todosLosNodos.length} nodos...`);

        // Obtener posiciones de todos los nodos
        todosLosNodos.forEach(nodo => {
            if (posicionesRed[nodo.id]) {
                const pos = posicionesRed[nodo.id];
                posiciones[nodo.id] = {
                    x: Math.round(pos.x * 100) / 100, // Redondear a 2 decimales
                    y: Math.round(pos.y * 100) / 100
                };
                console.log(`📍 [SYNC] Nodo ${nodo.id}: (${posiciones[nodo.id].x}, ${posiciones[nodo.id].y})`);
            }
        });

        const cantidadPosiciones = Object.keys(posiciones).length;
        console.log(`📦 [SYNC] Preparadas ${cantidadPosiciones} posiciones para guardar`);

        if (cantidadPosiciones === 0) {
            console.warn('⚠️ [SYNC] No hay posiciones válidas para guardar');
            return;
        }

        // Enviar al servidor
        console.log('🌐 [SYNC] Enviando posiciones al servidor...');
        const response = await fetch('/api/posiciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ posiciones })
        });

        console.log(`📥 [SYNC] Respuesta servidor: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('✅ [SYNC] Guardado exitoso:', resultado);

        return resultado;

    } catch (error) {
        console.error('❌ [SYNC] Error guardando posiciones:', error);
        throw error;
    }
}

// Configuración mejorada con timing correcto
function configurarPosicionesConTiming() {
    console.log('⚙️ [SYNC] Configurando sistema de posiciones con timing mejorado...');
    
    // Verificar dependencias
    if (!network || !nodes) {
        console.log('⏳ [SYNC] Dependencias no listas, reintentando...');
        setTimeout(configurarPosicionesConTiming, 1000);
        return;
    }

    try {
        // Limpiar eventos anteriores
        try {
            network.off('dragEnd');
            console.log('🔄 [SYNC] Eventos anteriores limpiados');
        } catch (e) {
            // No había eventos anteriores
        }

        // Configurar nuevo evento de arrastre con debounce mejorado
        let timeoutGuardado = null;
        
        network.on('dragEnd', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                console.log(`🎯 [SYNC] Nodo ${nodeId} arrastrado, programando guardado...`);
                
                // Limpiar timeout anterior
                if (timeoutGuardado) {
                    clearTimeout(timeoutGuardado);
                }
                
                // Programar guardado con delay
                timeoutGuardado = setTimeout(async () => {
                    try {
                        await guardarPosicionesConVerificacion();
                        console.log('✅ [SYNC] Guardado automático completado');
                    } catch (error) {
                        console.error('❌ [SYNC] Error en guardado automático:', error);
                    }
                }, 2000);
            }
        });

        console.log('✅ [SYNC] Eventos de arrastre configurados');

        // CARGAR POSICIONES INMEDIATAMENTE
        setTimeout(() => {
            cargarYAplicarPosiciones();
        }, 2000); // Dar tiempo para que la red se estabilice

        console.log('✅ [SYNC] Sistema de posiciones configurado completamente');

    } catch (error) {
        console.error('❌ [SYNC] Error configurando sistema:', error);
    }
}

// Sobrescribir funciones globales
window.cargarPosiciones = cargarYAplicarPosiciones;
window.guardarPosiciones = guardarPosicionesConVerificacion;
window.configurarPosiciones = configurarPosicionesConTiming;

// Función de test completo
window.testSincronizacionPosiciones = function() {
    console.log('🧪 [TEST] Iniciando test completo de sincronización...');
    
    // Test 1: Verificar estado
    console.log('📊 [TEST] Estado actual:');
    console.log('- Network:', !!network);
    console.log('- Nodes:', !!nodes);
    console.log('- Nodos count:', nodes ? nodes.length : 0);
    
    // Test 2: Verificar posiciones actuales
    if (network && nodes) {
        const posicionesActuales = network.getPositions();
        console.log('📍 [TEST] Posiciones actuales en red:', Object.keys(posicionesActuales).length);
        
        // Mostrar primeras 3 posiciones
        Object.entries(posicionesActuales).slice(0, 3).forEach(([id, pos]) => {
            console.log(`  Nodo ${id}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
        });
    }
    
    // Test 3: Test manual de carga
    setTimeout(async () => {
        console.log('🧪 [TEST] Ejecutando carga manual...');
        await cargarYAplicarPosiciones();
    }, 1000);
    
    // Test 4: Test manual de guardado
    setTimeout(async () => {
        console.log('🧪 [TEST] Ejecutando guardado manual...');
        await guardarPosicionesConVerificacion();
    }, 3000);
};

// Función de debug para ver exactamente qué está pasando
window.debugPosicionesDetallado = function() {
    console.log('🔍 [DEBUG] Análisis detallado del sistema de posiciones:');
    console.log('==================================================');
    
    // 1. Estado del sistema
    console.log('1. 📊 Estado del sistema:');
    console.log('   - Network disponible:', !!network);
    console.log('   - Nodes disponible:', !!nodes);
    
    if (network) {
        console.log('   - Escala actual:', network.getScale());
        const viewPos = network.getViewPosition();
        console.log('   - Posición vista:', `(${viewPos.x.toFixed(1)}, ${viewPos.y.toFixed(1)})`);
    }
    
    if (nodes) {
        const todosNodos = nodes.get();
        console.log('   - Total nodos:', todosNodos.length);
        console.log('   - IDs nodos:', todosNodos.map(n => n.id));
    }
    
    // 2. Posiciones en la red
    if (network && nodes) {
        console.log('\n2. 📍 Posiciones actuales en la red:');
        const posiciones = network.getPositions();
        Object.entries(posiciones).forEach(([id, pos]) => {
            console.log(`   Nodo ${id}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
        });
    }
    
    // 3. Test de conectividad
    console.log('\n3. 🌐 Test de conectividad:');
    fetch('/api/posiciones')
        .then(r => r.json())
        .then(data => {
            console.log('   - GET /obtener_posiciones:', data);
            if (data.posiciones) {
                console.log('   - Posiciones en servidor:', Object.keys(data.posiciones).length);
                Object.entries(data.posiciones).forEach(([id, pos]) => {
                    console.log(`     Servidor nodo ${id}: x=${pos.x}, y=${pos.y}`);
                });
            }
        })
        .catch(e => console.error('   - Error GET:', e));
    
    console.log('==================================================');
};

// Auto-inicialización mejorada
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 [SYNC] DOM cargado, programando configuración...');
    
    // Esperar múltiples condiciones
    let intentos = 0;
    const maxIntentos = 15; // 15 segundos máximo
    
    function verificarYConfigurar() {
        intentos++;
        console.log(`🔄 [SYNC] Verificación ${intentos}/${maxIntentos}...`);
        
        if (typeof network !== 'undefined' && network && 
            typeof nodes !== 'undefined' && nodes &&
            nodes.length > 0) {
            
            console.log('✅ [SYNC] Todas las condiciones cumplidas, configurando...');
            configurarPosicionesConTiming();
            
        } else if (intentos < maxIntentos) {
            setTimeout(verificarYConfigurar, 1000);
        } else {
            console.error('❌ [SYNC] Timeout esperando condiciones para configurar posiciones');
        }
    }
    
    // Empezar verificación después de 3 segundos
    setTimeout(verificarYConfigurar, 3000);
});

console.log('🔧 [SYNC] Fix de sincronización cargado');
console.log('💡 [SYNC] Comandos disponibles:');
console.log('   - testSincronizacionPosiciones() - Test completo');
console.log('   - debugPosicionesDetallado() - Debug detallado');
console.log('   - cargarPosiciones() - Cargar manual');
console.log('   - guardarPosiciones() - Guardar manual');