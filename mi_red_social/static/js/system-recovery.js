// static/js/system-recovery.js - Script de recuperación del sistema
// Este script se asegura de que todo funcione correctamente después de recargas

console.log('🛠️ Cargando sistema de recuperación...');

// Variables de estado del sistema
let sistemaConfigurado = false;
let intentosRecuperacion = 0;
const maxIntentosRecuperacion = 5;

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
    
    if (typeof edges === 'undefined' || !edges) {
        problemas.push('Edges no disponible');
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
    if (typeof burbujasActivas !== 'undefined' && burbujasActivas) {
        const container = document.getElementById('network');
        const svg = container?.querySelector('.burbujas-svg');
        const burbujas = svg?.querySelectorAll('.burbuja-grupo');
        
        if (nodes && nodes.length > 0) {
            const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
            if (nodosConGrupos.length > 0 && (!burbujas || burbujas.length === 0)) {
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
                        
                        // Aplicar mejoras de zoom
                        if (typeof aplicarMejorasZoom === 'function') {
                            aplicarMejorasZoom();
                            console.log('⚡ Mejoras de zoom reaplicadas');
                        }
                    }, 300);
                }
            }
        }
        
        // 3. Sincronizar con servidor si es posible
        if (typeof sincronizarGruposAlCargar === 'function') {
            try {
                await sincronizarGruposAlCargar();
                console.log('✅ Grupos sincronizados con servidor');
            } catch (error) {
                console.warn('⚠️ Error sincronizando grupos:', error.message);
            }
        }
        
        console.log('🎉 Recuperación del sistema completada');
        sistemaConfigurado = true;
        return true;
        
    } catch (error) {console.error('❌ Error durante la recuperación:', error);
       return false;
   }
}

// Función para verificar y ejecutar recuperación si es necesaria
async function verificarYRecuperar() {
   const problemas = detectarNecesidadRecuperacion();
   
   if (problemas.length > 0) {
       console.log('🔍 Problemas detectados:', problemas);
       const exito = await recuperarSistema();
       
       if (exito) {
           console.log('✅ Sistema recuperado exitosamente');
       } else {
           console.error('❌ Fallo en la recuperación del sistema');
       }
       
       return exito;
   } else {
       console.log('✅ Sistema funcionando correctamente');
       sistemaConfigurado = true;
       return true;
   }
}

// Ejecutar verificación inicial
document.addEventListener('DOMContentLoaded', async () => {
   console.log('🚀 Iniciando verificación del sistema...');
   await verificarYRecuperar();
});

// Verificación adicional después de cargas dinámicas
window.addEventListener('load', async () => {
   if (!sistemaConfigurado) {
       console.log('🔄 Verificación adicional después de carga completa...');
       await verificarYRecuperar();
   }
});

// Exportar funciones para uso externo
window.sistemaRecuperacion = {
   verificar: verificarYRecuperar,
   detectarProblemas: detectarNecesidadRecuperacion,
   recuperar: recuperarSistema
};

console.log('✅ Sistema de recuperación cargado y listo');