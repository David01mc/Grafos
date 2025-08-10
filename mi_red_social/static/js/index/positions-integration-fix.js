// static/js/positions-integration-fix.js
// Fix para integrar el sistema de posiciones en el flujo de recarga

console.log('🔧 Aplicando fix de integración de posiciones en recarga...');

// Sobrescribir la función reconfigurarFuncionalidades en network-controls.js
// para incluir la configuración de posiciones

// Guardar la función original si existe
const originalReconfigurarFuncionalidades = window.reconfigurarFuncionalidades || function() {};

// Nueva función que incluye posiciones
async function reconfigurarFuncionalidadesConPosiciones() {
    console.log('🔧 Reconfigurando funcionalidades CON POSICIONES...');
    
    try {
        // 1. Ejecutar reconfiguración original
        if (typeof originalReconfigurarFuncionalidades === 'function') {
            await originalReconfigurarFuncionalidades();
        }
        
        // 2. AGREGAR: Configurar sistema de posiciones
        console.log('📍 Reconfigurando sistema de posiciones...');
        
        if (typeof configurarPosiciones === 'function') {
            // Dar un momento para que todo se estabilice
            setTimeout(async () => {
                console.log('⚙️ Configurando posiciones después de recarga...');
                configurarPosiciones();
                
                // Cargar posiciones inmediatamente
                setTimeout(async () => {
                    if (typeof cargarPosiciones === 'function') {
                        console.log('📥 Cargando posiciones después de reconfiguración...');
                        await cargarPosiciones();
                    }
                }, 1000);
                
            }, 500);
        } else {
            console.warn('⚠️ Función configurarPosiciones no disponible');
        }
        
        console.log('✅ Reconfiguración con posiciones completada');
        
    } catch (error) {
        console.error('❌ Error en reconfiguración con posiciones:', error);
    }
}

// Sobrescribir la función global
window.reconfigurarFuncionalidades = reconfigurarFuncionalidadesConPosiciones;

// Sobrescribir también la función de recarga para asegurar que incluya posiciones
const originalRecargarDatos = window.recargarDatos || function() {};

async function recargarDatosConPosiciones() {
    console.log('🔄 Ejecutando recarga COMPLETA con posiciones...');
    
    try {
        // Ejecutar recarga original
        await originalRecargarDatos();
        
        // Después de la recarga, asegurar que las posiciones se configuren
        setTimeout(async () => {
            console.log('📍 Post-recarga: Configurando posiciones...');
            
            if (typeof configurarPosiciones === 'function') {
                configurarPosiciones();
                
                // Cargar posiciones después de configurar
                setTimeout(async () => {
                    if (typeof cargarPosiciones === 'function') {
                        console.log('📥 Post-recarga: Cargando posiciones...');
                        await cargarPosiciones();
                    }
                }, 2000);
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error en recarga con posiciones:', error);
    }
}

window.recargarDatos = recargarDatosConPosiciones;

// También interceptar la función de inicialización para incluir posiciones
const originalConfigurarFuncionalidadesAvanzadas = window.configurarFuncionalidadesAvanzadas || function() {};

async function configurarFuncionalidadesAvanzadasConPosiciones() {
    console.log('🔧 Configurando funcionalidades avanzadas CON POSICIONES...');
    
    try {
        // Ejecutar configuración original
        if (typeof originalConfigurarFuncionalidadesAvanzadas === 'function') {
            await originalConfigurarFuncionalidadesAvanzadas();
        }
        
        // AGREGAR: Configuración de posiciones
        console.log('📍 Configuración avanzada: Agregando sistema de posiciones...');
        
        if (typeof configurarPosiciones === 'function') {
            setTimeout(() => {
                console.log('⚙️ Configurando posiciones en inicialización avanzada...');
                configurarPosiciones();
                
                // Cargar posiciones después de configurar
                setTimeout(async () => {
                    if (typeof cargarPosiciones === 'function') {
                        console.log('📥 Inicialización: Cargando posiciones...');
                        await cargarPosiciones();
                    }
                }, 1500);
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Error en configuración avanzada con posiciones:', error);
    }
}

window.configurarFuncionalidadesAvanzadas = configurarFuncionalidadesAvanzadasConPosiciones;

// Función para forzar la configuración de posiciones en cualquier momento
window.forzarConfiguracionCompleta = async function() {
    console.log('🚀 Forzando configuración completa del sistema de posiciones...');
    
    if (!network || !nodes) {
        console.error('❌ Network o nodes no disponibles');
        return false;
    }
    
    try {
        // 1. Configurar eventos
        console.log('⚙️ Paso 1: Configurando eventos...');
        if (typeof configurarPosiciones === 'function') {
            configurarPosiciones();
        }
        
        // 2. Cargar posiciones
        console.log('📥 Paso 2: Cargando posiciones...');
        if (typeof cargarPosiciones === 'function') {
            await cargarPosiciones();
        }
        
        // 3. Verificar que se aplicaron
        setTimeout(() => {
            console.log('🔍 Paso 3: Verificando aplicación...');
            
            if (network) {
                const posiciones = network.getPositions();
                console.log('📊 Posiciones en red:', Object.keys(posiciones).length);
                
                // Mostrar algunas posiciones
                Object.entries(posiciones).slice(0, 3).forEach(([id, pos]) => {
                    console.log(`  Nodo ${id}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
                });
            }
        }, 2000);
        
        console.log('✅ Configuración completa finalizada');
        return true;
        
    } catch (error) {
        console.error('❌ Error en configuración completa:', error);
        return false;
    }
};

// Auto-ejecutar después de cargas del sistema
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado - preparando integración de posiciones...');
    
    // Esperar a que el sistema principal esté listo
    let intentos = 0;
    const maxIntentos = 20;
    
    function verificarSistema() {
        intentos++;
        
        if (typeof network !== 'undefined' && network && 
            typeof nodes !== 'undefined' && nodes &&
            nodes.length > 0) {
            
            console.log('✅ Sistema principal listo, configurando posiciones...');
            
            // Configurar inmediatamente
            if (typeof configurarPosiciones === 'function') {
                configurarPosiciones();
                
                // Cargar después de configurar
                setTimeout(async () => {
                    if (typeof cargarPosiciones === 'function') {
                        console.log('📥 Auto-carga: Cargando posiciones...');
                        await cargarPosiciones();
                    }
                }, 2000);
            }
            
        } else if (intentos < maxIntentos) {
            console.log(`⏳ Esperando sistema principal... (${intentos}/${maxIntentos})`);
            setTimeout(verificarSistema, 1000);
        } else {
            console.error('❌ Timeout esperando sistema principal');
        }
    }
    
    // Empezar verificación después de 3 segundos
    setTimeout(verificarSistema, 3000);
});

// Interceptar también el evento de window load
window.addEventListener('load', function() {
    console.log('🌐 Window load - verificando configuración de posiciones...');
    
    setTimeout(() => {
        if (typeof network !== 'undefined' && network && typeof nodes !== 'undefined' && nodes) {
            if (typeof configurarPosiciones === 'function') {
                console.log('🔄 Window load: Re-configurando posiciones...');
                configurarPosiciones();
            }
        }
    }, 2000);
});

// Función de diagnóstico para ver qué está pasando
window.diagnosticoIntegracion = function() {
    console.log('🔍 DIAGNÓSTICO DE INTEGRACIÓN:');
    console.log('==============================');
    
    console.log('📊 Estado del sistema:');
    console.log('- Network:', typeof network !== 'undefined' && !!network);
    console.log('- Nodes:', typeof nodes !== 'undefined' && !!nodes);
    console.log('- Nodos count:', nodes ? nodes.length : 0);
    
    console.log('\n🔧 Funciones disponibles:');
    console.log('- configurarPosiciones:', typeof configurarPosiciones);
    console.log('- cargarPosiciones:', typeof cargarPosiciones);
    console.log('- guardarPosiciones:', typeof guardarPosiciones);
    console.log('- recargarDatos:', typeof recargarDatos);
    console.log('- reconfigurarFuncionalidades:', typeof reconfigurarFuncionalidades);
    
    console.log('\n📍 Estado de posiciones:');
    if (network) {
        const posiciones = network.getPositions();
        console.log('- Posiciones en red:', Object.keys(posiciones).length);
        if (Object.keys(posiciones).length > 0) {
            Object.entries(posiciones).slice(0, 2).forEach(([id, pos]) => {
                console.log(`  Nodo ${id}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
            });
        }
    }
    
    console.log('\n🧪 Test de conectividad:');
    fetch('/obtener_posiciones')
        .then(r => r.json())
        .then(data => {
            console.log('- Respuesta servidor:', data.posiciones ? `${Object.keys(data.posiciones).length} posiciones` : 'Sin posiciones');
        })
        .catch(e => console.error('- Error:', e));
    
    console.log('==============================');
    console.log('💡 Comandos disponibles:');
    console.log('- forzarConfiguracionCompleta() - Configurar todo manualmente');
    console.log('- recargarDatos() - Recarga completa con posiciones');
    console.log('- diagnosticoIntegracion() - Este diagnóstico');
};

// Función específica para después de recargas
window.postRecargaPositions = async function() {
    console.log('🔄 Ejecutando configuración post-recarga de posiciones...');
    
    if (!network || !nodes) {
        console.error('❌ Sistema no listo para configuración post-recarga');
        return;
    }
    
    // 1. Configurar
    if (typeof configurarPosiciones === 'function') {
        console.log('⚙️ Configurando eventos de posiciones...');
        configurarPosiciones();
    }
    
    // 2. Cargar
    if (typeof cargarPosiciones === 'function') {
        console.log('📥 Cargando posiciones guardadas...');
        await cargarPosiciones();
    }
    
    console.log('✅ Configuración post-recarga completada');
};

console.log('🔧 Fix de integración de posiciones aplicado');
console.log('💡 Usa diagnosticoIntegracion() para verificar el estado');
console.log('💡 Usa forzarConfiguracionCompleta() para configurar manualmente');
console.log('💡 Usa postRecargaPositions() después de recargas manuales');