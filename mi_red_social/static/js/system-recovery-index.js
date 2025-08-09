// static/js/system-recovery.js
// Sistema de recuperación automática del sistema

console.log('🛠️ Cargando sistema de recuperación automática...');

// Variables de estado del sistema
let sistemaConfigurado = false;
let intentosRecuperacion = 0;
const maxIntentosRecuperacion = 3;

// Función para detectar si el sistema necesita recuperación
function detectarNecesidadRecuperacion() {
    const problemas = [];
    
    // Verificar componentes básicos
    if (typeof network === 'undefined' || !network) {
        problemas.push('Network no disponible');
    }
    
    if (typeof nodes === 'undefined' || !nodes) {
        problemas.push('Nodes no disponible');
    }
    
    // Verificar funcionalidades adicionales
    if (typeof configurarDobleClickCrearNodo !== 'function') {
        problemas.push('Funcionalidad de doble clic no configurada');
    }
    
    if (typeof configurarHoverCrearAristas !== 'function') {
        problemas.push('Funcionalidad de hover no configurada');
    }
    
    // Verificar sistema de burbujas
    if (typeof crearBurbujasGrupos !== 'function') {
        problemas.push('Sistema de burbujas no disponible');
    }
    
    // Verificar si hay burbujas cuando debería haberlas
    if (typeof burbujasActivas !== 'undefined' && burbujasActivas && nodes && nodes.length > 0) {
        const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
        if (nodosConGrupos.length > 0) {
            const container = document.getElementById('network');
            const svg = container?.querySelector('.burbujas-svg');
            const burbujas = svg?.querySelectorAll('.burbuja-grupo');
            
            if (!burbujas || burbujas.length === 0) {
                problemas.push('Burbujas no visibles cuando deberían estarlo');
            }
        }
    }
    
    return problemas;
}

// Función para recuperar funcionalidades perdidas
async function recuperarSistema() {
    if (intentosRecuperacion >= maxIntentosRecuperacion) {
        console.warn('⚠️ Máximo de intentos de recuperación alcanzado');
        return false;
    }
    
    intentosRecuperacion++;
    console.log(`🔧 Intento de recuperación ${intentosRecuperacion}/${maxIntentosRecuperacion}...`);
    
    try {
        // 1. Verificar y configurar funcionalidades básicas
        if (network && typeof configurarDobleClickCrearNodo === 'function') {
            configurarDobleClickCrearNodo();
            console.log('✅ Doble clic reconfigurado');
        }
        
        if (network && typeof configurarHoverCrearAristas === 'function') {
            configurarHoverCrearAristas();
            console.log('✅ Hover para aristas reconfigurado');
        }
        
        // 2. Recuperar sistema de burbujas si es necesario
        if (nodes && nodes.length > 0) {
            const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
            
            if (nodosConGrupos.length > 0) {
                console.log(`🫧 Recuperando burbujas para ${nodosConGrupos.length} nodos con grupos...`);
                
                // Activar burbujas
                if (typeof burbujasActivas !== 'undefined') {
                    window.burbujasActivas = true;
                }
                
                // Crear burbujas
                if (typeof crearBurbujasGrupos === 'function') {
                    crearBurbujasGrupos();
                    console.log('✅ Burbujas recuperadas');
                    
                    // Configurar eventos de burbujas
                    setTimeout(() => {
                        if (typeof configurarEventosBurbujas === 'function') {
                            configurarEventosBurbujas();
                            console.log('✅ Eventos de burbujas reconfigurados');
                        }
                    }, 300);
                }
            }
        }
        
        console.log('🎉 Recuperación del sistema completada');
        sistemaConfigurado = true;
        return true;
        
    } catch (error) {
        console.error('❌ Error durante recuperación:', error);
        return false;
    }
}

// Función para monitorear el estado del sistema
function iniciarMonitoreoRecuperacion() {
    let verificacionesConsecutivasBuenas = 0;
    
    const intervaloMonitoreo = setInterval(() => {
        // Si ya está configurado, verificaciones menos frecuentes
        if (sistemaConfigurado) {
            verificacionesConsecutivasBuenas++;
            
            // Después de 10 verificaciones buenas (30 segundos), reducir frecuencia
            if (verificacionesConsecutivasBuenas >= 10) {
                // Verificación cada 15 segundos en lugar de cada 3
                if (verificacionesConsecutivasBuenas % 5 !== 0) {
                    return;
                }
            }
            
            const problemas = detectarNecesidadRecuperacion();
            if (problemas.length > 0) {
                console.log('⚠️ Detectados problemas, intentando recuperación:', problemas);
                sistemaConfigurado = false;
                verificacionesConsecutivasBuenas = 0;
                setTimeout(recuperarSistema, 1000);
            }
            return;
        }
        
        // Verificación completa si no está configurado
        const problemas = detectarNecesidadRecuperacion();
        
        if (problemas.length > 0) {
            setTimeout(recuperarSistema, 1000);
        } else {
            sistemaConfigurado = true;
            verificacionesConsecutivasBuenas = 0;
            console.log('✅ Sistema verificado como funcionando correctamente');
        }
        
    }, 3000); // Verificar cada 3 segundos
    
    // Detener monitoreo después de 3 minutos si todo está estable
    setTimeout(() => {
        if (sistemaConfigurado && verificacionesConsecutivasBuenas >= 15) {
            clearInterval(intervaloMonitoreo);
            console.log('✅ Monitoreo detenido - sistema estable por 3 minutos');
        }
    }, 180000); // 3 minutos
}

// Función para diagnóstico completo
window.diagnosticoCompletoSistema = function() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA:');
    console.log('====================================');
    
    // Estado básico
    console.log('📊 Estado básico:');
    console.log('- Sistema configurado:', sistemaConfigurado ? '✅' : '❌');
    console.log('- Intentos recuperación:', intentosRecuperacion);
    console.log('- Network disponible:', typeof network !== 'undefined' && network ? '✅' : '❌');
    console.log('- Nodes disponible:', typeof nodes !== 'undefined' && nodes ? `✅ (${nodes.length})` : '❌');
    console.log('- Edges disponible:', typeof edges !== 'undefined' && edges ? `✅ (${edges.length})` : '❌');
    
    // Funcionalidades
    console.log('\n🛠️ Funcionalidades:');
    console.log('- Doble clic crear nodos:', typeof configurarDobleClickCrearNodo === 'function' ? '✅' : '❌');
    console.log('- Hover crear aristas:', typeof configurarHoverCrearAristas === 'function' ? '✅' : '❌');
    console.log('- Sistema burbujas:', typeof crearBurbujasGrupos === 'function' ? '✅' : '❌');
    console.log('- Gestión grupos:', typeof abrirModalGestionGrupos === 'function' ? '✅' : '❌');
    console.log('- Persistencia grupos:', typeof sincronizarGruposAlCargar === 'function' ? '✅' : '❌');
    
    // Estado de burbujas
    console.log('\n🫧 Sistema de burbujas:');
    if (typeof burbujasActivas !== 'undefined') {
        console.log('- Burbujas activas:', burbujasActivas ? '✅' : '❌');
        
        if (burbujasActivas) {
            const container = document.getElementById('network');
            const svg = container?.querySelector('.burbujas-svg');
            const burbujas = svg?.querySelectorAll('.burbuja-grupo');
            
            console.log('- SVG presente:', svg ? '✅' : '❌');
            console.log('- Burbujas en DOM:', burbujas ? `✅ (${burbujas.length})` : '❌');
        }
    } else {
        console.log('- Estado burbujas: ❌ No definido');
    }
    
    // Problemas detectados
    const problemas = detectarNecesidadRecuperacion();
    console.log('\n⚠️ Problemas detectados:');
    if (problemas.length === 0) {
        console.log('✅ Ningún problema detectado');
    } else {
        problemas.forEach((problema, index) => {
            console.log(`${index + 1}. ${problema}`);
        });
        
        console.log('\n🔧 Ejecutando recuperación automática...');
        setTimeout(recuperarSistema, 500);
    }
    
    console.log('\n💡 Funciones disponibles:');
    console.log('- recuperarSistemaManual() - Forzar recuperación');
    console.log('- testBurbujasPostRecarga() - Test de burbujas');
    console.log('- verificarEstadoSistema() - Estado básico');
    console.log('====================================');
    
    return problemas.length === 0;
};

// Función para recuperación manual
window.recuperarSistemaManual = async function() {
    console.log('🔧 Iniciando recuperación manual...');
    intentosRecuperacion = 0;
    sistemaConfigurado = false;
    
    const exito = await recuperarSistema();
    
    if (exito && typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('success', 'Sistema recuperado exitosamente');
    } else if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('error', 'Error en la recuperación del sistema');
    }
    
    return exito;
};

// Función específica para test de burbujas
window.testBurbujasPostRecarga = function() {
    console.log('🧪 Test de burbujas post-recarga...');
    
    if (!nodes || nodes.length === 0) {
        console.log('❌ No hay nodos para probar');
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('info', 'No hay nodos disponibles para probar burbujas');
        }
        return false;
    }
    
    const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
    
    if (nodosConGrupos.length === 0) {
        console.log('📝 No hay grupos asignados, creando grupos demo...');
        if (typeof crearGruposDemo === 'function') {
            crearGruposDemo();
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('info', 'Grupos demo creados. Las burbujas aparecerán automáticamente.');
            }
            return true;
        } else {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('error', 'No se pueden crear grupos de demostración');
            }
            return false;
        }
    }
    
    // Verificar estado de burbujas
    const container = document.getElementById('network');
    const svg = container?.querySelector('.burbujas-svg');
    const burbujas = svg?.querySelectorAll('.burbuja-grupo');
    
    console.log(`🫧 ${nodosConGrupos.length} nodos con grupos, ${burbujas?.length || 0} burbujas visibles`);
    
    if (!burbujas || burbujas.length === 0) {
        console.log('🔧 Recreando burbujas...');
        if (typeof crearBurbujasGrupos === 'function') {
            window.burbujasActivas = true;
            crearBurbujasGrupos();
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('success', 'Burbujas recreadas exitosamente');
            }
        }
    } else {
        console.log('✅ Burbujas ya están visibles');
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('success', 'Las burbujas están funcionando correctamente');
        }
    }
    
    return true;
};

// Inicializar monitoreo después de que todo esté cargado
setTimeout(() => {
    if (typeof network !== 'undefined' && typeof nodes !== 'undefined') {
        console.log('🛠️ Iniciando sistema de recuperación automática...');
        iniciarMonitoreoRecuperacion();
    }
}, 5000); // Esperar 5 segundos para que todo se cargue

console.log('🛠️ Sistema de recuperación automática cargado');