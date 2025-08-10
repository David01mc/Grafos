// static/js/network-initialization.js
// Inicialización y orchestración del sistema completo

console.log('🚀 Cargando sistema de inicialización...');

// Estado de la inicialización
const inicializacionEstado = {
    inicializado: false,
    intentosInicializacion: 0,
    maxIntentos: 3,
    dependenciasVerificadas: false,
    timeoutInicializacion: null
};

// Lista de dependencias requeridas
const DEPENDENCIAS_REQUERIDAS = [
    { nombre: 'vis.js', verificar: () => typeof vis !== 'undefined' },
    { nombre: 'bootstrap', verificar: () => typeof bootstrap !== 'undefined' },
    { nombre: 'DOM', verificar: () => document.readyState === 'complete' || document.readyState === 'interactive' }
];

// Función principal de inicialización
async function inicializarSistemaCompleto() {
    if (inicializacionEstado.inicializado) {
        console.log('⚠️ Sistema ya inicializado');
        return;
    }
    
    inicializacionEstado.intentosInicializacion++;
    console.log(`🚀 Iniciando sistema completo (intento ${inicializacionEstado.intentosInicializacion}/${inicializacionEstado.maxIntentos})...`);
    
    try {
        // 1. Verificar dependencias
        if (!await verificarDependencias()) {
            throw new Error('Dependencias no disponibles');
        }
        
        // 2. Verificar contenedor de red
        const container = document.getElementById('network');
        if (!container) {
            throw new Error('Contenedor de red no encontrado');
        }
        
        // 3. Inicializar núcleo de la red
        console.log('🌐 Inicializando núcleo de la red...');
        await window.inicializarRed();
        
        // 4. Verificar que la red se inicializó correctamente
        const estado = window.obtenerEstadoRed();
        if (!estado.network || !estado.nodes || !estado.edges) {
            throw new Error('Red no se inicializó correctamente');
        }
        
        // 5. Configurar sistemas adicionales
        await configurarSistemasAdicionales();
        
        // 6. Marcar como inicializado
        inicializacionEstado.inicializado = true;
        
        console.log('🎉 ¡Sistema completamente inicializado!');
        mostrarMensajeBienvenida();
        
        // 7. Ejecutar post-inicialización
        setTimeout(() => {
            ejecutarPostInicializacion();
        }, 2000);
        
    } catch (error) {
        console.error(`❌ Error en inicialización (intento ${inicializacionEstado.intentosInicializacion}):`, error);
        
        // Reintentar si no se ha alcanzado el máximo
        if (inicializacionEstado.intentosInicializacion < inicializacionEstado.maxIntentos) {
            console.log(`🔄 Reintentando en 3 segundos...`);
            setTimeout(() => {
                inicializarSistemaCompleto();
            }, 3000);
        } else {
            console.error('❌ Falló la inicialización después de todos los intentos');
            mostrarErrorInicializacion(error);
        }
    }
}

// Función para verificar dependencias
async function verificarDependencias() {
    console.log('🔍 Verificando dependencias...');
    
    let todasDisponibles = true;
    
    for (const dep of DEPENDENCIAS_REQUERIDAS) {
        const disponible = dep.verificar();
        console.log(`- ${dep.nombre}: ${disponible ? '✅' : '❌'}`);
        
        if (!disponible) {
            todasDisponibles = false;
        }
    }
    
    if (!todasDisponibles) {
        console.log('⏳ Esperando dependencias...');
        
        // Esperar un poco más y verificar de nuevo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Segunda verificación
        todasDisponibles = DEPENDENCIAS_REQUERIDAS.every(dep => dep.verificar());
        console.log(`🔍 Segunda verificación: ${todasDisponibles ? '✅' : '❌'}`);
    }
    
    inicializacionEstado.dependenciasVerificadas = todasDisponibles;
    return todasDisponibles;
}

// Función para configurar sistemas adicionales
async function configurarSistemasAdicionales() {
    console.log('⚙️ Configurando sistemas adicionales...');
    
    try {
        // Configurar sistema de posiciones
        if (typeof window.configurarPosiciones === 'function') {
            window.configurarPosiciones();
            console.log('✅ Sistema de posiciones configurado');
        }
        
        // Configurar sistema de recuperación automática
        if (typeof window.diagnosticoCompletoSistema === 'function') {
            console.log('✅ Sistema de diagnósticos disponible');
        }
        
        // Configurar sistema de persistencia de grupos
        if (typeof window.sincronizarGruposAlCargar === 'function') {
            console.log('✅ Sistema de persistencia disponible');
        }
        
        // Configurar optimizaciones de rendimiento
        if (typeof window.testZoomOptimizado === 'function') {
            console.log('✅ Optimizaciones de rendimiento disponibles');
        }
        
        console.log('✅ Sistemas adicionales configurados');
        
    } catch (error) {
        console.error('❌ Error configurando sistemas adicionales:', error);
        throw error;
    }
}

// Función para ejecutar tareas post-inicialización
async function ejecutarPostInicializacion() {
    console.log('🔧 Ejecutando post-inicialización...');
    
    try {
        // Sincronización automática de grupos
        if (typeof window.sincronizarGruposAlCargar === 'function') {
            console.log('🔄 Sincronizando grupos automáticamente...');
            await window.sincronizarGruposAlCargar();
        }
        
        // Verificar sistema completo
        setTimeout(() => {
            if (typeof window.verificarEstadoSistema === 'function') {
                console.log('🔍 Ejecutando verificación final del sistema...');
                window.verificarEstadoSistema();
            }
        }, 3000);
        
        console.log('✅ Post-inicialización completada');
        
    } catch (error) {
        console.error('❌ Error en post-inicialización:', error);
    }
}

// Función para mostrar mensaje de bienvenida
function mostrarMensajeBienvenida() {
    console.log('🎉 ¡SISTEMA DE RED SOCIAL LISTO!');
    console.log('================================');
    console.log('💡 Funciones principales disponibles:');
    console.log('- Doble clic en área vacía: Crear nuevo contacto');
    console.log('- Clic en contacto: Ver información detallada');
    console.log('- Arrastrar contactos: Reorganizar red');
    console.log('- Hover sobre contactos: Crear conexiones');
    console.log('');
    console.log('🛠️ Funciones de administración:');
    console.log('- crearGruposDemo() - Crear grupos de demostración');
    console.log('- verificarEstadoSistema() - Diagnóstico completo');
    console.log('- debugSistemaCompleto() - Debug con persistencia');
    console.log('- ayudaDiagnosticos() - Ver todas las funciones de debug');
    console.log('================================');
    
    // Mostrar notificación visual si está disponible
    if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('success', '¡Sistema de red social completamente cargado y listo!', 8000);
    }
}

// Función para mostrar error de inicialización
function mostrarErrorInicializacion(error) {
    console.error('🚨 ERROR CRÍTICO DE INICIALIZACIÓN');
    console.error('===================================');
    console.error('El sistema no pudo inicializarse correctamente.');
    console.error('Error:', error.message);
    console.error('');
    console.error('💡 Posibles soluciones:');
    console.error('1. Recargar la página');
    console.error('2. Verificar conexión a internet');
    console.error('3. Verificar que el servidor esté funcionando');
    console.error('4. Limpiar cache del navegador');
    console.error('===================================');
    
    // Actualizar estado visual
    if (typeof actualizarEstado === 'function') {
        actualizarEstado(`❌ Error crítico: ${error.message}`, 'error');
    }
    
    // Mostrar notificación de error si está disponible
    if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('error', 
            `Error crítico de inicialización: ${error.message}. Intenta recargar la página.`, 
            10000
        );
    }
}

// Función para reinicializar el sistema
window.reinicializarSistema = async function() {
    console.log('🔄 Reinicializando sistema completo...');
    
    // Reset del estado
    inicializacionEstado.inicializado = false;
    inicializacionEstado.intentosInicializacion = 0;
    inicializacionEstado.dependenciasVerificadas = false;
    
    // Limpiar timeouts existentes
    if (inicializacionEstado.timeoutInicializacion) {
        clearTimeout(inicializacionEstado.timeoutInicializacion);
    }
    
    // Limpiar sistemas existentes
    if (typeof window.detenerMonitoreoRendimiento === 'function') {
        window.detenerMonitoreoRendimiento();
    }
    
    // Reinicializar
    await inicializarSistemaCompleto();
};

// Función para verificar si el sistema está listo
window.sistemaBienInicializado = function() {
    const estado = window.obtenerEstadoRed();
    const listo = (
        inicializacionEstado.inicializado &&
        inicializacionEstado.dependenciasVerificadas &&
        estado.network &&
        estado.nodes &&
        estado.edges &&
        estado.redLista
    );
    
    console.log(`🔍 Sistema listo: ${listo ? '✅' : '❌'}`);
    return listo;
};

// Función para obtener estadísticas de inicialización
window.estadisticasInicializacion = function() {
    const stats = {
        inicializado: inicializacionEstado.inicializado,
        intentos: inicializacionEstado.intentosInicializacion,
        dependenciasOK: inicializacionEstado.dependenciasVerificadas,
        sistemaListo: window.sistemaBienInicializado()
    };
    
    console.log('📊 ESTADÍSTICAS DE INICIALIZACIÓN:');
    console.table(stats);
    
    return stats;
};

// Event listeners para inicialización automática
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, preparando inicialización...');
    
    // Esperar un poco para que todos los scripts se carguen
    inicializacionEstado.timeoutInicializacion = setTimeout(() => {
        inicializarSistemaCompleto();
    }, 1000);
});

// Backup: inicializar cuando la ventana esté completamente cargada
window.addEventListener('load', function() {
    // Solo inicializar si no se ha hecho ya
    if (!inicializacionEstado.inicializado) {
        console.log('🔄 Window load event - verificando inicialización...');
        
        setTimeout(() => {
            if (!inicializacionEstado.inicializado) {
                console.log('🔄 Iniciando desde window.load...');
                inicializarSistemaCompleto();
            }
        }, 500);
    }
});

// Manejo de errores globales
window.addEventListener('error', function(event) {
    console.error('🚨 Error global capturado:', event.error);
    
    // Si el sistema no está inicializado y hay un error, podría ser un problema de inicialización
    if (!inicializacionEstado.inicializado) {
        console.error('❌ Error durante inicialización detectado');
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', 
                'Error detectado durante la inicialización. Reintentando...', 
                5000
            );
        }
        
        // Reintentar después de un delay
        setTimeout(() => {
            if (!inicializacionEstado.inicializado && 
                inicializacionEstado.intentosInicializacion < inicializacionEstado.maxIntentos) {
                inicializarSistemaCompleto();
            }
        }, 3000);
    }
});

// Función de emergencia para forzar inicialización
window.forzarInicializacion = function() {
    console.log('🚨 Forzando inicialización de emergencia...');
    
    inicializacionEstado.inicializado = false;
    inicializacionEstado.intentosInicializacion = 0;
    
    inicializarSistemaCompleto();
};

// Exportar función principal
window.inicializarSistemaCompleto = inicializarSistemaCompleto;

console.log('🚀 Sistema de inicialización cargado - Listo para inicializar');