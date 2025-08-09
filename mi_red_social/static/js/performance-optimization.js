// static/js/performance-optimization.js
// Optimizaciones de rendimiento para zoom y transformaciones

console.log('⚡ Cargando parche de rendimiento para zoom...');

// Variables para optimización de rendimiento
let lastTransformTime = 0;
let pendingTransform = false;

// Función optimizada para aplicar transformaciones con throttling
function aplicarTransformacionOptimizada() {
    const now = performance.now();
    const deltaTime = now - lastTransformTime;
    
    // Throttling: no aplicar más de 60fps
    if (deltaTime < 16.67) {
        if (!pendingTransform) {
            pendingTransform = true;
            requestAnimationFrame(() => {
                if (typeof aplicarTransformacionBurbujas === 'function') {
                    aplicarTransformacionBurbujas();
                }
                lastTransformTime = performance.now();
                pendingTransform = false;
            });
        }
        return;
    }
    
    if (typeof aplicarTransformacionBurbujas === 'function') {
        aplicarTransformacionBurbujas();
    }
    lastTransformTime = now;
}

// Mejorar los eventos de zoom después de que el sistema esté listo
function aplicarMejorasZoom() {
    if (!network || typeof burbujasActivas === 'undefined') {
        console.log('⏳ Esperando sistema de burbujas para aplicar mejoras de zoom...');
        setTimeout(aplicarMejorasZoom, 1000);
        return;
    }
    
    console.log('⚡ Aplicando mejoras de rendimiento de zoom...');
    
    // Sobreescribir la función de aplicación de transformación con la versión optimizada
    if (typeof window.aplicarTransformacionBurbujas === 'function') {
        const originalFunction = window.aplicarTransformacionBurbujas;
        
        window.aplicarTransformacionBurbujas = function() {
            // Usar la versión optimizada cuando sea apropiado
            if (pendingTransform) {
                return; // Ya hay una transformación pendiente
            }
            return originalFunction.apply(this, arguments);
        };
        
        console.log('✅ Función de transformación optimizada');
    }
    
    // Función para detectar zoom rápido y optimizar
    let lastZoomTime = 0;
    let zoomCount = 0;
    
    if (network) {
        network.on('zoom', function() {
            const now = performance.now();
            
            // Detectar zoom rápido (más de 3 zooms en 1 segundo)
            if (now - lastZoomTime < 1000) {
                zoomCount++;
            } else {
                zoomCount = 1;
            }
            lastZoomTime = now;
            
            // Si es zoom rápido, usar función optimizada
            if (zoomCount > 3) {
                aplicarTransformacionOptimizada();
            }
        });
        
        console.log('✅ Optimización de zoom rápido configurada');
    }
}

// Aplicar mejoras cuando el DOM esté listo
setTimeout(aplicarMejorasZoom, 3000);

// Función de test para verificar las mejoras
window.testZoomOptimizado = function() {
    console.log('🧪 Probando zoom optimizado...');
    
    if (!network) {
        console.error('❌ Network no disponible');
        return;
    }
    
    let startTime = performance.now();
    let transformCount = 0;
    
    // Interceptar transformaciones para contar
    const original = window.aplicarTransformacionBurbujas;
    window.aplicarTransformacionBurbujas = function() {
        transformCount++;
        return original?.apply(this, arguments);
    };
    
    // Hacer zoom rápido
    const zooms = [0.5, 2, 0.8, 2.5, 1, 1.5, 1];
    let index = 0;
    
    function nextZoom() {
        if (index < zooms.length) {
            network.moveTo({ 
                scale: zooms[index], 
                animation: { duration: 200 } 
            });
            index++;
            setTimeout(nextZoom, 300);
        } else {
            // Mostrar resultados
            const totalTime = performance.now() - startTime;
            console.log(`⚡ Test completado en ${totalTime.toFixed(0)}ms`);
            console.log(`🔄 Transformaciones aplicadas: ${transformCount}`);
            console.log(`📈 FPS efectivo: ${(transformCount / (totalTime / 1000)).toFixed(1)}`);
            
            // Restaurar función original
            window.aplicarTransformacionBurbujas = original;
            
            // Volver a la vista normal
            network.fit({ animation: { duration: 1000 } });
        }
    }
    
    nextZoom();
};

console.log('⚡ Parche de rendimiento de zoom cargado');