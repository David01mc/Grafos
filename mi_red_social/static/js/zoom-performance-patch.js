// static/js/zoom-performance-patch.js - Parche para mejorar el rendimiento del zoom

console.log('⚡ Cargando parche de rendimiento para zoom...');

// Variables para optimización de rendimiento
let lastTransformTime = 0;
let pendingTransform = false;
let transformQueue = [];

// Función optimizada para aplicar transformaciones con throttling
function aplicarTransformacionOptimizada() {
    const now = performance.now();
    const deltaTime = now - lastTransformTime;
    
    // Throttling: no aplicar más de 60fps
    if (deltaTime < 16.67) {
        if (!pendingTransform) {
            pendingTransform = true;
            requestAnimationFrame(() => {
                aplicarTransformacionBurbujas();
                lastTransformTime = performance.now();
                pendingTransform = false;
            });
        }
        return;
    }
    
    aplicarTransformacionBurbujas();
    lastTransformTime = now;
}

// Mejorar los eventos de zoom existentes
function mejorarEventosZoom() {
    if (!network) {
        console.warn('⚠️ Network no disponible para mejorar eventos de zoom');
        return;
    }
    
    // Remover eventos anteriores si existen
    try {
        network.off('zoom');
        network.off('dragStart');
        network.off('dragging');
        network.off('dragEnd');
        console.log('🔄 Eventos anteriores removidos');
    } catch (e) {
        // Los eventos no existían, continuar
    }
    
    // Configurar eventos optimizados
    let isZooming = false;
    let isDragging = false;
    let zoomStartTime = 0;
    
    network.on('zoom', function(params) {
        if (!burbujasActivas) return;
        
        const now = performance.now();
        
        if (!isZooming) {
            isZooming = true;
            zoomStartTime = now;
            console.log('🔍 Iniciando zoom optimizado');
        }
        
        // Aplicar transformación optimizada
        aplicarTransformacionOptimizada();
        
        // Detener zoom después de inactividad
        clearTimeout(window.zoomEndTimeout);
        window.zoomEndTimeout = setTimeout(() => {
            isZooming = false;
            console.log('⏹️ Zoom finalizado');
            
            // Una transformación final para asegurar precisión
            setTimeout(() => {
                aplicarTransformacionBurbujas();
            }, 50);
        }, 150);
    });
    
    network.on('dragStart', function(params) {
        if (!burbujasActivas) return;
        
        if (params.nodes.length === 0) {
            // Es drag de la vista
            isDragging = true;
            console.log('👆 Iniciando drag de vista');
        }
    });
    
    network.on('dragging', function(params) {
        if (!burbujasActivas || !isDragging) return;
        
        if (params.nodes.length === 0) {
            // Aplicar transformación optimizada durante el drag
            aplicarTransformacionOptimizada();
        }
    });
    
    network.on('dragEnd', function(params) {
        if (!burbujasActivas) return;
        
        if (isDragging) {
            isDragging = false;
            console.log('✋ Finalizando drag de vista');
            
            // Transformación final precisa
            setTimeout(() => {
                aplicarTransformacionBurbujas();
            }, 50);
        }
        
        // Si se movieron nodos, recrear burbujas
        if (params.nodes.length > 0) {
            console.log('🔄 Nodos movidos, recreando burbujas...');
            setTimeout(() => {
                if (typeof crearBurbujasGrupos === 'function') {
                    crearBurbujasGrupos();
                }
            }, 200);
        }
    });
    
    console.log('✅ Eventos de zoom optimizados configurados');
}

// Función para detectar y corregir desincronización
function detectarYCorregirDesincronizacion() {
    if (!network || !burbujasActivas) return;
    
    try {
        // Obtener estado actual del network
        const scale = network.getScale();
        const viewPosition = network.getViewPosition();
        
        // Comparar con la transformación actual de las burbujas
        const container = document.getElementById('network');
        const svg = container?.querySelector('.burbujas-svg');
        const grupo = svg?.querySelector('.grupo-burbujas-transformable');
        
        if (grupo) {
            const transformActual = grupo.getAttribute('transform');
            const rect = container.getBoundingClientRect();
            
            // Calcular la transformación esperada
            const expectedTranslateX = rect.width / 2 - viewPosition.x * scale;
            const expectedTranslateY = rect.height / 2 - viewPosition.y * scale;
            const expectedTransform = `translate(${expectedTranslateX}, ${expectedTranslateY}) scale(${scale})`;
            
            // Si hay diferencia significativa, corregir
            if (transformActual !== expectedTransform) {
                console.log('🔧 Corrigiendo desincronización de burbujas');
                grupo.setAttribute('transform', expectedTransform);
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Error detectando desincronización:', error);
        return false;
    }
}

// Función para monitoreo periódico de sincronización
function iniciarMonitoreoSincronizacion() {
    // Verificar sincronización cada 2 segundos
    setInterval(() => {
        if (burbujasActivas && !isMoving) {
            const corregido = detectarYCorregirDesincronizacion();
            if (corregido) {
                console.log('🔧 Desincronización corregida automáticamente');
            }
        }
    }, 2000);
    
    console.log('👁️ Monitoreo de sincronización iniciado');
}

// Función para manejar cambios de tamaño de ventana de forma optimizada
function manejarRedimensionamiento() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
        if (!burbujasActivas) return;
        
        // Debounce para evitar múltiples recreaciones
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('📏 Ventana redimensionada, actualizando burbujas...');
            
            if (typeof crearBurbujasGrupos === 'function') {
                crearBurbujasGrupos();
            }
        }, 300);
    });
    
    console.log('📏 Manejo de redimensionamiento optimizado configurado');
}

// Función para debug de rendimiento
window.debugRendimientoZoom = function() {
    console.log('🔍 DEBUG DE RENDIMIENTO DE ZOOM:');
    console.log('===============================');
    
    console.log('⏱️ Última transformación:', lastTransformTime);
    console.log('⏳ Transformación pendiente:', pendingTransform);
    console.log('🎯 Burbujas activas:', typeof burbujasActivas !== 'undefined' ? burbujasActivas : 'No definido');
    
    if (typeof network !== 'undefined' && network) {
        const scale = network.getScale();
        const viewPos = network.getViewPosition();
        console.log('📏 Zoom actual:', scale.toFixed(3));
        console.log('📍 Posición vista:', `(${viewPos.x.toFixed(1)}, ${viewPos.y.toFixed(1)})`);
    }
    
    // Verificar estado de las burbujas
    const container = document.getElementById('network');
    const svg = container?.querySelector('.burbujas-svg');
    const grupo = svg?.querySelector('.grupo-burbujas-transformable');
    
    if (grupo) {
        const transform = grupo.getAttribute('transform');
        console.log('🔄 Transformación actual burbujas:', transform);
        
        const burbujas = grupo.querySelectorAll('.burbuja-grupo');
        console.log('🫧 Burbujas encontradas:', burbujas.length);
    } else {
        console.log('❌ No se encontraron burbujas');
    }
    
    console.log('===============================');
};

// Función principal de inicialización del parche
function inicializarPatchRendimiento() {
    console.log('⚡ Inicializando parche de rendimiento...');
    
    // Esperar a que el sistema de burbujas esté listo
    const esperarSistemaBurbujas = () => {
        if (typeof burbujasActivas !== 'undefined' && typeof network !== 'undefined' && network) {
            console.log('✅ Sistema de burbujas detectado, aplicando mejoras...');
            
            // Aplicar mejoras
            mejorarEventosZoom();
            iniciarMonitoreoSincronizacion();
            manejarRedimensionamiento();
            
            console.log('⚡ Parche de rendimiento aplicado exitosamente');
            
            // Exportar función optimizada globalmente
            window.aplicarTransformacionOptimizada = aplicarTransformacionOptimizada;
            window.detectarYCorregirDesincronizacion = detectarYCorregirDesincronizacion;
            
            return true;
        } else {
            return false;
        }
    };
    
    // Intentar aplicar el parche
    if (!esperarSistemaBurbujas()) {
        // Si no está listo, reintentar
        let intentos = 0;
        const maxIntentos = 10;
        
        const reintentar = setInterval(() => {
            intentos++;
            
            if (esperarSistemaBurbujas()) {
                clearInterval(reintentar);
            } else if (intentos >= maxIntentos) {
                clearInterval(reintentar);
                console.warn('⚠️ No se pudo aplicar el parche de rendimiento - sistema de burbujas no encontrado');
            }
        }, 1000);
    }
}

// Función para test de rendimiento
window.testRendimientoZoom = function() {
    console.log('🧪 Iniciando test de rendimiento de zoom...');
    
    if (!network || typeof burbujasActivas === 'undefined') {
        console.error('❌ Sistema no disponible para test');
        return;
    }
    
    console.log('📊 Midiendo rendimiento durante zoom...');
    
    let contadorTransformaciones = 0;
    let tiempoInicio = performance.now();
    
    // Interceptar transformaciones para medir
    const originalAplicar = window.aplicarTransformacionBurbujas;
    window.aplicarTransformacionBurbujas = function() {
        contadorTransformaciones++;
        return originalAplicar.apply(this, arguments);
    };
    
    // Realizar zooms de prueba
    const zooms = [0.5, 2, 1, 3, 0.8, 1.5, 1];
    let indiceZoom = 0;
    
    function siguienteZoom() {
        if (indiceZoom < zooms.length) {
            const zoom = zooms[indiceZoom];
            console.log(`🔍 Test zoom ${indiceZoom + 1}/${zooms.length}: ${zoom}x`);
            
            network.moveTo({
                scale: zoom,
                animation: { duration: 500 }
            });
            
            indiceZoom++;
            setTimeout(siguienteZoom, 800);
        } else {
            // Completar test
            const tiempoTotal = performance.now() - tiempoInicio;
            const fps = (contadorTransformaciones / (tiempoTotal / 1000)).toFixed(1);
            
            console.log('📊 RESULTADOS DEL TEST:');
            console.log(`⏱️ Tiempo total: ${tiempoTotal.toFixed(0)}ms`);
            console.log(`🔄 Transformaciones: ${contadorTransformaciones}`);
            console.log(`📈 FPS promedio: ${fps}`);
            
            // Restaurar función original
            window.aplicarTransformacionBurbujas = originalAplicar;
            
            // Volver a zoom normal
            network.fit({ animation: { duration: 1000 } });
            
            console.log('✅ Test de rendimiento completado');
        }
    }
    
    siguienteZoom();
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPatchRendimiento);
} else {
    // Esperar un poco para que otros sistemas se carguen
    setTimeout(inicializarPatchRendimiento, 2000);
}

console.log('⚡ Parche de rendimiento para zoom cargado');