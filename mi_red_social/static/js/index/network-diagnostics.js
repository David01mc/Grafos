// static/js/network-diagnostics.js
// Sistema de diagnósticos y debugging de la red

console.log('🔍 Cargando sistema de diagnósticos...');

// Estado del sistema de diagnósticos
const diagnosticosEstado = {
    monitoreando: false,
    intervalosActivos: [],
    ultimoDiagnostico: null,
    historialRendimiento: [],
    maxHistorial: 50
};

// Función principal de diagnóstico del sistema
window.verificarEstadoSistema = function() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA:');
    console.log('===================================');
    
    const estado = window.obtenerEstadoRed();
    const timestamp = new Date().toISOString();
    
    // 1. Estado básico de la red
    console.log('📊 ESTADO BÁSICO:');
    console.log('- Red iniciada:', estado.iniciado ? '✅' : '❌');
    console.log('- Red lista:', estado.redLista ? '✅' : '❌');
    console.log('- Network disponible:', estado.network ? '✅' : '❌');
    console.log('- Nodes disponible:', estado.nodes ? `✅ (${estado.nodes.length} nodos)` : '❌');
    console.log('- Edges disponible:', estado.edges ? `✅ (${estado.edges.length} aristas)` : '❌');
    console.log('- Error actual:', estado.error || 'Ninguno');
    
    // 2. Funcionalidades principales
    console.log('\n🛠️ FUNCIONALIDADES PRINCIPALES:');
    console.log('- Creación nodos (doble clic):', typeof configurarDobleClickCrearNodo === 'function' ? '✅' : '❌');
    console.log('- Creación aristas (hover):', typeof configurarHoverCrearAristas === 'function' ? '✅' : '❌');
    console.log('- Modal información:', typeof mostrarInformacionNodo === 'function' ? '✅' : '❌');
    console.log('- Sistema burbujas:', typeof crearBurbujasGrupos === 'function' ? '✅' : '❌');
    console.log('- Persistencia grupos:', typeof sincronizarGruposAlCargar === 'function' ? '✅' : '❌');
    console.log('- Gestión posiciones:', typeof configurarPosiciones === 'function' ? '✅' : '❌');
    
    // 3. Estado de burbujas
    console.log('\n🫧 SISTEMA DE BURBUJAS:');
    if (typeof burbujasActivas !== 'undefined') {
        console.log('- Burbujas activas:', burbujasActivas ? '✅' : '❌');
        console.log('- Opacidad burbujas:', typeof opacidadBurbujas !== 'undefined' ? opacidadBurbujas : 'N/A');
        
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
    
    // 4. Análisis de grupos
    console.log('\n📋 ANÁLISIS DE GRUPOS:');
    if (estado.nodes && estado.nodes.length > 0) {
        const todosLosNodos = estado.nodes.get();
        const nodosConGrupos = todosLosNodos.filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
        
        console.log(`- Nodos totales: ${todosLosNodos.length}`);
        console.log(`- Nodos con grupos: ${nodosConGrupos.length}`);
        console.log(`- Porcentaje con grupos: ${((nodosConGrupos.length / todosLosNodos.length) * 100).toFixed(1)}%`);
        
        if (nodosConGrupos.length > 0) {
            const distribucionGrupos = {};
            nodosConGrupos.forEach(nodo => {
                distribucionGrupos[nodo.grupo] = (distribucionGrupos[nodo.grupo] || 0) + 1;
            });
            
            console.log('\n📊 DISTRIBUCIÓN DE GRUPOS:');
            console.table(distribucionGrupos);
        }
    } else {
        console.log('- Sin nodos disponibles');
    }
    
    // 5. Información de rendimiento
    console.log('\n⚡ RENDIMIENTO:');
    if (estado.network) {
        console.log('- Escala actual:', estado.network.getScale().toFixed(3));
        const viewPos = estado.network.getViewPosition();
        console.log('- Posición vista:', `(${viewPos.x.toFixed(1)}, ${viewPos.y.toFixed(1)})`);
        
        if (performance.memory) {
            const memoria = {
                usado: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limite: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
            console.log('- Memoria JS (MB):', `${memoria.usado}/${memoria.total} (límite: ${memoria.limite})`);
        }
    }
    
    // 6. Estado de dependencias externas
    console.log('\n📦 DEPENDENCIAS:');
    console.log('- vis.js:', typeof vis !== 'undefined' ? '✅' : '❌');
    console.log('- Bootstrap:', typeof bootstrap !== 'undefined' ? '✅' : '❌');
    
    // 7. Conectividad con servidor
    console.log('\n🌐 CONECTIVIDAD:');
    probarConectividadServidor();
    
    console.log('\n===================================');
    console.log(`📅 Diagnóstico completado: ${timestamp}`);
    
    // Guardar en historial
    diagnosticosEstado.ultimoDiagnostico = {
        timestamp,
        estado: estado,
        nodosConGrupos: estado.nodes ? estado.nodes.get().filter(n => n.grupo && n.grupo !== 'sin_grupo').length : 0,
        memoria: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null
    };
    
    return estado;
};

// Función para probar conectividad con el servidor
async function probarConectividadServidor() {
    const endpoints = [
        { url: '/api/grafo', nombre: 'API Grafo' },
        { url: '/obtener_posiciones', nombre: 'Posiciones' },
        { url: '/obtener_grupos_personas', nombre: 'Grupos' }
    ];
    
    console.log('🧪 Probando conectividad con servidor...');
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url, { 
                method: 'GET',
                signal: AbortSignal.timeout(3000) // 3 segundos timeout
            });
            
            if (response.ok) {
                console.log(`- ${endpoint.nombre}: ✅ (${response.status})`);
            } else {
                console.log(`- ${endpoint.nombre}: ⚠️ (${response.status})`);
            }
        } catch (error) {
            console.log(`- ${endpoint.nombre}: ❌ (${error.message})`);
        }
    }
}

// Función para verificar específicamente el sistema post-recarga
window.verificarSistemaPostRecarga = function() {
    console.log('🔍 VERIFICACIÓN POST-RECARGA:');
    console.log('=============================');
    
    const estado = window.obtenerEstadoRed();
    
    // Verificar componentes críticos
    const componentes = {
        'Red principal': estado.network ? '✅' : '❌',
        'Nodos': estado.nodes ? `✅ (${estado.nodes.length})` : '❌',
        'Aristas': estado.edges ? `✅ (${estado.edges.length})` : '❌',
        'Red lista': estado.redLista ? '✅' : '⚠️'
    };
    
    console.table(componentes);
    
    // Verificar funcionalidades críticas
    const funcionalidades = {
        'Creación nodos': typeof configurarDobleClickCrearNodo === 'function' ? '✅' : '❌',
        'Creación aristas': typeof configurarHoverCrearAristas === 'function' ? '✅' : '❌',
        'Modal información': typeof mostrarInformacionNodo === 'function' ? '✅' : '❌',
        'Sistema burbujas': typeof crearBurbujasGrupos === 'function' ? '✅' : '❌',
        'Persistencia': typeof sincronizarGruposAlCargar === 'function' ? '✅' : '❌'
    };
    
    console.table(funcionalidades);
    
    // Test rápido de zoom si hay burbujas
    if (estado.network && typeof burbujasActivas !== 'undefined' && burbujasActivas) {
        console.log('🧪 Realizando test de zoom...');
        testZoomRapido();
    }
    
    console.log('=============================');
    
    return Object.values(componentes).every(v => v.startsWith('✅')) &&
           Object.values(funcionalidades).every(v => v === '✅');
};

// Función para test rápido de zoom
function testZoomRapido() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network) return;
    
    const zoomOriginal = estado.network.getScale();
    console.log(`📏 Zoom inicial: ${zoomOriginal.toFixed(2)}`);
    
    // Test de zoom in/out
    estado.network.moveTo({ 
        scale: zoomOriginal * 1.5, 
        animation: { duration: 300 }
    });
    
    setTimeout(() => {
        console.log(`📏 Zoom aumentado: ${estado.network.getScale().toFixed(2)}`);
        
        estado.network.moveTo({ 
            scale: zoomOriginal, 
            animation: { duration: 300 }
        });
        
        setTimeout(() => {
            console.log(`📏 Zoom restaurado: ${estado.network.getScale().toFixed(2)}`);
            console.log('✅ Test de zoom completado');
        }, 300);
    }, 300);
}

// Función para debug de aristas
window.debugAristas = function() {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network || !estado.edges) {
        console.log('❌ Red o aristas no disponibles');
        return;
    }
    
    console.log('🔗 ANÁLISIS DE ARISTAS:');
    console.log('=======================');
    
    const aristas = estado.edges.get();
    console.log(`Total de aristas: ${aristas.length}`);
    
    if (aristas.length > 0) {
        // Análisis de conectividad
        const nodosCounted = {};
        aristas.forEach(arista => {
            nodosCounted[arista.from] = (nodosCounted[arista.from] || 0) + 1;
            nodosCounted[arista.to] = (nodosCounted[arista.to] || 0) + 1;
        });
        
        const conexiones = Object.values(nodosCounted);
        const stats = {
            'Nodos conectados': Object.keys(nodosCounted).length,
            'Conexiones promedio': (conexiones.reduce((a, b) => a + b, 0) / conexiones.length).toFixed(1),
            'Max conexiones': Math.max(...conexiones),
            'Min conexiones': Math.min(...conexiones)
        };
        
        console.table(stats);
        
        // Mostrar primeras 5 aristas
        console.log('\n📋 Primeras 5 aristas:');
        aristas.slice(0, 5).forEach((arista, index) => {
            console.log(`${index + 1}. ${arista.from} ↔ ${arista.to} (ID: ${arista.id})`);
        });
    }
    
    console.log('=======================');
    
    return aristas;
};

// Función para monitoreo de rendimiento en tiempo real
window.iniciarMonitoreoRendimiento = function(intervalo = 5000) {
    if (diagnosticosEstado.monitoreando) {
        console.log('⚠️ Ya hay un monitoreo activo');
        return;
    }
    
    console.log(`📊 Iniciando monitoreo de rendimiento (cada ${intervalo/1000}s)...`);
    diagnosticosEstado.monitoreando = true;
    
    const intervalId = setInterval(() => {
        const estado = window.obtenerEstadoRed();
        
        if (!estado.network) {
            console.log('⚠️ Red no disponible, deteniendo monitoreo');
            detenerMonitoreoRendimiento();
            return;
        }
        
        const stats = {
            timestamp: Date.now(),
            escala: estado.network.getScale(),
            nodos: estado.nodes ? estado.nodes.length : 0,
            memoria: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null,
            fps: calcularFPS()
        };
        
        diagnosticosEstado.historialRendimiento.push(stats);
        
        // Mantener solo las últimas N mediciones
        if (diagnosticosEstado.historialRendimiento.length > diagnosticosEstado.maxHistorial) {
            diagnosticosEstado.historialRendimiento.shift();
        }
        
        console.log('📊 Rendimiento:', stats);
        
    }, intervalo);
    
    diagnosticosEstado.intervalosActivos.push(intervalId);
};

// Función para detener monitoreo
window.detenerMonitoreoRendimiento = function() {
    diagnosticosEstado.intervalosActivos.forEach(id => clearInterval(id));
    diagnosticosEstado.intervalosActivos = [];
    diagnosticosEstado.monitoreando = false;
    console.log('🔴 Monitoreo de rendimiento detenido');
};

// Función para calcular FPS aproximado
function calcularFPS() {
    const ahora = performance.now();
    if (calcularFPS.ultimaVez) {
        const delta = ahora - calcularFPS.ultimaVez;
        calcularFPS.ultimaVez = ahora;
        return Math.round(1000 / delta);
    } else {
        calcularFPS.ultimaVez = ahora;
        return 60; // Valor por defecto
    }
}

// Función para obtener reporte de rendimiento
window.obtenerReporteRendimiento = function() {
    if (diagnosticosEstado.historialRendimiento.length === 0) {
        console.log('❌ No hay datos de rendimiento disponibles');
        return null;
    }
    
    const datos = diagnosticosEstado.historialRendimiento;
    const reporte = {
        muestras: datos.length,
        periodo: `${((datos[datos.length - 1].timestamp - datos[0].timestamp) / 1000).toFixed(1)}s`,
        escalaProm: (datos.reduce((sum, d) => sum + d.escala, 0) / datos.length).toFixed(3),
        memoriaProm: datos[0].memoria ? Math.round(datos.reduce((sum, d) => sum + d.memoria, 0) / datos.length) : 'N/A',
        memoriaMax: datos[0].memoria ? Math.max(...datos.map(d => d.memoria)) : 'N/A',
        fpsProm: Math.round(datos.reduce((sum, d) => sum + d.fps, 0) / datos.length)
    };
    
    console.log('📊 REPORTE DE RENDIMIENTO:');
    console.table(reporte);
    
    return reporte;
};

// Función para limpiar historial de diagnósticos
window.limpiarHistorialDiagnosticos = function() {
    diagnosticosEstado.historialRendimiento = [];
    diagnosticosEstado.ultimoDiagnostico = null;
    console.log('🧹 Historial de diagnósticos limpiado');
};

// Función para test de estrés
window.testEstresRed = function(duracion = 10000) {
    const estado = window.obtenerEstadoRed();
    
    if (!estado.network) {
        console.log('❌ Red no disponible para test de estrés');
        return;
    }
    
    console.log(`🧪 Iniciando test de estrés (${duracion/1000}s)...`);
    
    const inicio = performance.now();
    let operaciones = 0;
    
    const intervalo = setInterval(() => {
        // Operaciones de estrés: zoom aleatorio y movimientos
        const escalaRandom = 0.5 + Math.random() * 2;
        const xRandom = (Math.random() - 0.5) * 200;
        const yRandom = (Math.random() - 0.5) * 200;
        
        estado.network.moveTo({
            scale: escalaRandom,
            position: { x: xRandom, y: yRandom },
            animation: { duration: 100 }
        });
        
        operaciones++;
        
        if (performance.now() - inicio > duracion) {
            clearInterval(intervalo);
            
            const tiempoTotal = performance.now() - inicio;
            const opsPorSegundo = (operaciones / (tiempoTotal / 1000)).toFixed(1);
            
            console.log(`✅ Test de estrés completado:`);
            console.log(`- Duración: ${(tiempoTotal/1000).toFixed(1)}s`);
            console.log(`- Operaciones: ${operaciones}`);
            console.log(`- Ops/segundo: ${opsPorSegundo}`);
            
            // Restaurar vista normal
            estado.network.fit({ animation: { duration: 1000 } });
        }
    }, 50);
};

// Función para exportar todos los diagnósticos
window.exportarDiagnosticos = function() {
    const estado = window.obtenerEstadoRed();
    const diagnostico = {
        timestamp: new Date().toISOString(),
        estadoSistema: estado,
        rendimiento: diagnosticosEstado.historialRendimiento,
        ultimoDiagnostico: diagnosticosEstado.ultimoDiagnostico,
        navegador: {
            userAgent: navigator.userAgent,
            memoria: performance.memory ? {
                usado: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        }
    };
    
    const blob = new Blob([JSON.stringify(diagnostico, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnosticos-red-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('💾 Diagnósticos exportados');
};

// Función para mostrar ayuda de diagnósticos
window.ayudaDiagnosticos = function() {
    console.log('💡 FUNCIONES DE DIAGNÓSTICO DISPONIBLES:');
    console.log('========================================');
    console.log('verificarEstadoSistema() - Diagnóstico completo del sistema');
    console.log('verificarSistemaPostRecarga() - Verificar después de recarga');
    console.log('debugAristas() - Analizar estructura de aristas');
    console.log('iniciarMonitoreoRendimiento(intervalo) - Monitoreo en tiempo real');
    console.log('detenerMonitoreoRendimiento() - Detener monitoreo');
    console.log('obtenerReporteRendimiento() - Resumen de rendimiento');
    console.log('testEstresRed(duracion) - Test de estrés de la red');
    console.log('exportarDiagnosticos() - Exportar datos de diagnóstico');
    console.log('limpiarHistorialDiagnosticos() - Limpiar historial');
    console.log('========================================');
};

// Limpiar intervalos al cerrar la página
window.addEventListener('beforeunload', () => {
    detenerMonitoreoRendimiento();
});

console.log('🔍 Sistema de diagnósticos cargado - Ejecuta ayudaDiagnosticos() para ver opciones');