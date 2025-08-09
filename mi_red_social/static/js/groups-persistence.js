// static/js/groups-persistence.js
// Sistema de persistencia de grupos en el servidor

console.log('💾 Cargando sistema de persistencia de grupos...');

// Función para enviar updates de grupos al servidor
async function enviarActualizacionesGruposAlServidor(updates) {
    if (!updates || updates.length === 0) {
        console.log('📝 No hay actualizaciones de grupos para enviar');
        return { success: true, message: 'Sin cambios que guardar' };
    }
    
    try {
        console.log('📤 Enviando actualizaciones de grupos al servidor:', updates);
        
        const response = await fetch('/actualizar_grupos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                updates: updates
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Respuesta del servidor:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error enviando actualizaciones de grupos:', error);
        throw error;
    }
}

// Función para obtener grupos actuales del servidor
async function obtenerGruposDelServidor() {
    try {
        console.log('📥 Obteniendo grupos actuales del servidor...');
        
        const response = await fetch('/obtener_grupos_personas');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Grupos obtenidos del servidor:', result);
        
        return result.grupos || {};
        
    } catch (error) {
        console.error('❌ Error obteniendo grupos del servidor:', error);
        throw error;
    }
}

// Función para sincronizar grupos al cargar la página
async function sincronizarGruposAlCargar() {
    console.log('🔄 Sincronizando grupos al cargar...');
    
    try {
        // Obtener grupos actuales del servidor
        const gruposServidor = await obtenerGruposDelServidor();
        
        if (!nodes) {
            console.warn('⚠️ Nodes no disponible para sincronización');
            return;
        }
        
        // Comparar con grupos en memoria
        const nodosActuales = nodes.get();
        const actualizacionesNecesarias = [];
        
        nodosActuales.forEach(nodo => {
            const grupoServidor = gruposServidor[nodo.id]?.grupo;
            const grupoActual = nodo.grupo;
            
            if (grupoServidor !== grupoActual) {
                console.log(`🔄 Sincronizando nodo ${nodo.id}: "${grupoActual}" → "${grupoServidor}"`);
                
                actualizacionesNecesarias.push({
                    id: nodo.id,
                    grupo: grupoServidor
                });
            }
        });
        
        if (actualizacionesNecesarias.length > 0) {
            nodes.update(actualizacionesNecesarias);
            console.log(`✅ ${actualizacionesNecesarias.length} grupos sincronizados`);
            
            // Crear burbujas después de sincronizar
            if (typeof crearBurbujasGrupos === 'function') {
                setTimeout(crearBurbujasGrupos, 500);
            }
        } else {
            console.log('✅ Grupos ya sincronizados');
        }
        
    } catch (error) {
        console.error('❌ Error sincronizando grupos:', error);
    }
}

// Función para verificar sincronización
window.verificarSincronizacionGrupos = async function() {
    console.log('🔍 Verificando sincronización de grupos...');
    
    try {
        const gruposServidor = await obtenerGruposDelServidor();
        
        if (!nodes) {
            console.log('❌ Nodes no disponible');
            return false;
        }
        
        const nodosActuales = nodes.get();
        
        console.log('📊 COMPARACIÓN DE GRUPOS:');
        console.log('========================');
        
        let diferencias = 0;
        
        nodosActuales.forEach(nodo => {
            const grupoMemoria = nodo.grupo || 'sin_grupo';
            const grupoServidor = gruposServidor[nodo.id]?.grupo || 'sin_grupo';
            const nombre = nodo.label?.replace(/<[^>]*>/g, '') || `Nodo ${nodo.id}`;
            
            if (grupoMemoria !== grupoServidor) {
                console.log(`❌ ${nombre}: Memoria="${grupoMemoria}" vs Servidor="${grupoServidor}"`);
                diferencias++;
            } else {
                console.log(`✅ ${nombre}: "${grupoMemoria}" (sincronizado)`);
            }
        });
        
        console.log('========================');
        console.log(`📈 Resultado: ${diferencias === 0 ? '✅ Totalmente sincronizado' : `❌ ${diferencias} diferencias encontradas`}`);
        
        return diferencias === 0;
        
    } catch (error) {
        console.error('❌ Error verificando sincronización:', error);
        return false;
    }
};

// Función para diagnosticar problemas de persistencia
window.diagnosticarProblemasPersistencia = async function() {
    console.log('🔍 DIAGNÓSTICO DE PERSISTENCIA:');
    console.log('==============================');
    
    const problemas = [];
    
    // 1. Verificar backend
    try {
        const response = await fetch('/actualizar_grupos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: [] })
        });
        
        if (response.ok) {
            console.log('✅ Endpoint /actualizar_grupos disponible');
        } else {
            problemas.push('❌ Endpoint /actualizar_grupos no responde correctamente');
        }
    } catch (error) {
        problemas.push('❌ No se puede conectar con /actualizar_grupos: ' + error.message);
    }
    
    // 2. Verificar obtener grupos
    try {
        const grupos = await obtenerGruposDelServidor();
        console.log(`✅ Endpoint /obtener_grupos_personas disponible (${Object.keys(grupos).length} personas)`);
    } catch (error) {
        problemas.push('❌ Error obteniendo grupos del servidor: ' + error.message);
    }
    
    // 3. Verificar dependencias
    if (typeof nodes === 'undefined' || !nodes) {
        problemas.push('❌ Variable nodes no disponible');
    } else {
        console.log(`✅ Nodes disponible (${nodes.length} nodos)`);
    }
    
    if (typeof network === 'undefined' || !network) {
        problemas.push('❌ Variable network no disponible');
    } else {
        console.log('✅ Network disponible');
    }
    
    console.log('==============================');
    
    if (problemas.length === 0) {
        console.log('🎉 ¡No se encontraron problemas de persistencia!');
        await verificarSincronizacionGrupos();
    } else {
        console.log('🚨 PROBLEMAS ENCONTRADOS:');
        problemas.forEach(problema => console.log(problema));
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('error', 'Se encontraron problemas en el sistema de persistencia. Revisa la consola.');
        }
    }
    
    return problemas.length === 0;
};

// Exportar funciones globalmente
window.enviarActualizacionesGruposAlServidor = enviarActualizacionesGruposAlServidor;
window.obtenerGruposDelServidor = obtenerGruposDelServidor;
window.sincronizarGruposAlCargar = sincronizarGruposAlCargar;

console.log('💾 Sistema de persistencia de grupos cargado');