// static/js/network-core.js
// Core del sistema de red - Funcionalidades básicas

console.log('🌐 Cargando núcleo del sistema de red...');

// Variables globales principales
let network = null;
let nodes = null;
let edges = null;
let physicsEnabled = false;
let redLista = false;

// Estado del sistema
const sistemaEstado = {
    iniciado: false,
    cargandoDatos: false,
    error: null
};

// Configuración optimizada de la red
const CONFIG_RED = {
    physics: {
        enabled: false,
        stabilization: { 
            iterations: 100,
            updateInterval: 50,
            onlyDynamicEdges: false,
            fit: true 
        },
        barnesHut: {
            gravitationalConstant: -6000,
            centralGravity: 0.2,
            springLength: 80,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.1
        }
    },
    interaction: {
        hover: true,
        tooltipDelay: 300,
        selectConnectedEdges: false,
        dragNodes: true,
        dragView: true,
        zoomView: true
    },
    edges: {
        smooth: {
            type: "continuous",
            forceDirection: "none",
            roundness: 0.5
        },
        font: { 
            color: '#333', 
            size: 11,
            strokeWidth: 2,
            strokeColor: 'white'
        },
        width: 2,
        color: {
            color: '#848484',
            highlight: '#848484',
            hover: '#000000'
        }
    },
    nodes: {
        borderWidth: 2,
        shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.2)',
            size: 8,
            x: 1,
            y: 1
        },
        font: { 
            color: 'white', 
            size: 13,
            strokeWidth: 2,
            strokeColor: 'rgba(0,0,0,0.6)'
        },
        chosen: {
            node: function(values, id, selected, hovering) {
                values.shadow = true;
                values.shadowColor = 'rgba(0,0,0,0.3)';
                values.shadowSize = 10;
            }
        }
    },
    configure: {
        enabled: false
    }
};

// Función mejorada para actualizar estado
function actualizarEstado(mensaje, tipo = 'info') {
    const el = document.getElementById('estado-sistema');
    if (el) {
        el.textContent = mensaje;
        el.className = `estado-${tipo}`;
    }
    
    console.log(`🔄 [${tipo.toUpperCase()}] ${mensaje}`);
    
    // Notificación visual opcional
    if (tipo === 'error' && typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('error', mensaje);
    } else if (tipo === 'success' && typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('success', mensaje);
    }
}

// Función mejorada para cargar datos con caché
async function cargarDatos(forzarRecarga = false) {
    if (sistemaEstado.cargandoDatos && !forzarRecarga) {
        console.log('⏳ Ya hay una carga en progreso...');
        return null;
    }
    
    sistemaEstado.cargandoDatos = true;
    sistemaEstado.error = null;
    
    try {
        
        const response = await fetch('/api/grafo?' + (forzarRecarga ? 'cache=false' : ''));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Datos recibidos del servidor:', {
            nodos: data.nodes.length,
            aristas: data.edges.length,
            timestamp: new Date().toISOString()
        });
        
        // Validar datos
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
            throw new Error('Formato de datos inválido del servidor');
        }
        
        // Verificar grupos
        const nodosConGrupos = data.nodes.filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
        if (nodosConGrupos.length > 0) {
            console.log(`🏷️ ${nodosConGrupos.length} nodos con grupos encontrados`);
            
            const distribucionGrupos = {};
            nodosConGrupos.forEach(nodo => {
                distribucionGrupos[nodo.grupo] = (distribucionGrupos[nodo.grupo] || 0) + 1;
            });
            console.table(distribucionGrupos);
        }
        
        
        return data;
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        sistemaEstado.error = error.message;
        actualizarEstado(`❌ Error: ${error.message}`, 'error');
        return { nodes: [], edges: [] };
    } finally {
        sistemaEstado.cargandoDatos = false;
    }
}

// Función simplificada para inicializar la red
async function inicializarRed() {
    if (sistemaEstado.iniciado) {
        console.log('⚠️ Red ya está iniciada');
        return;
    }
    
    // Verificar dependencias
    if (typeof vis === 'undefined') {
        actualizarEstado('❌ vis.js no disponible', 'error');
        return;
    }
    
    const container = document.getElementById('network');
    if (!container) {
        actualizarEstado('❌ Contenedor de red no encontrado', 'error');
        return;
    }
    
    try {
        actualizarEstado('🎨 Iniciando visualización...', 'info');
        
        // Cargar datos
        const data = await cargarDatos();
        
        if (data.nodes.length === 0) {
            actualizarEstado('⚠️ Sin datos - Ve a Administración', 'warning');
            return;
        }
        
        // Crear datasets
        nodes = new vis.DataSet(data.nodes);
        edges = new vis.DataSet(data.edges);
        
        // Crear la red
        network = new vis.Network(container, { nodes, edges }, CONFIG_RED);
        
        
        // Configurar eventos básicos
        configurarEventosBasicos();
        
        // Configurar sistema de posiciones
        if (typeof configurarPosiciones === 'function') {
            configurarPosiciones();
        }
        
        // Actualizar estadísticas
        actualizarEstadisticas(data);
        
        // Marcar como iniciado
        sistemaEstado.iniciado = true;
        
        // Configurar funcionalidades adicionales después de estabilización
        configurarEstabilizacion();
        
        console.log('🎉 Red inicializada completamente');
        
    } catch (error) {
        console.error('❌ Error inicializando red:', error);
        sistemaEstado.error = error.message;
        actualizarEstado(`❌ Error: ${error.message}`, 'error');
    }
}

// Función para configurar eventos básicos de la red
function configurarEventosBasicos() {
    if (!network) return;
    
    // Eventos de cursor
    network.on("hoverNode", () => {
        document.body.style.cursor = 'pointer';
    });
    
    network.on("blurNode", () => {
        document.body.style.cursor = 'default';
    });
    
    // Eventos de arrastre
    network.on("dragStart", (params) => {
        if (params.nodes.length > 0) {
            document.body.style.cursor = 'grabbing';
        }
    });
    
    network.on("dragEnd", (params) => {
        if (params.nodes.length > 0) {
            document.body.style.cursor = 'default';
        }
    });
    
    // Evento de redimensionado
    window.addEventListener('resize', debounce(() => {
        if (network) {
            network.redraw();
            setTimeout(() => network.fit(), 100);
        }
    }, 250));
    
    console.log('⚡ Eventos básicos configurados');
}

// Función para configurar estabilización y funcionalidades adicionales
function configurarEstabilizacion() {
    if (!network) return;
    
    let estabilizacionCompleta = false;
    
    function completarInicializacion() {
        if (estabilizacionCompleta) return;
        
        estabilizacionCompleta = true;
        redLista = true;
        
        console.log('🎯 Red estabilizada, configurando funcionalidades avanzadas...');
        
        // Ajustar vista
        network.fit();
        
        // Configurar funcionalidades adicionales con delay
        setTimeout(() => {
            configurarFuncionalidadesAvanzadas();
        }, 500);
    }
    
    // Múltiples eventos para asegurar inicialización
    network.once("stabilizationIterationsDone", completarInicializacion);
    network.once("afterDrawing", () => {
        setTimeout(completarInicializacion, 300);
    });
    
    // Backup temporal
    setTimeout(completarInicializacion, 3000);
}

// Función para configurar funcionalidades avanzadas
async function configurarFuncionalidadesAvanzadas() {
    console.log('🔧 Configurando funcionalidades avanzadas...');
    
    try {
        // 1. Configurar creación de nodos
        if (typeof configurarDobleClickCrearNodo === 'function') {
            configurarDobleClickCrearNodo();
            console.log('🎯 Funcionalidad de doble clic activada');
        }
        
        // 2. Configurar creación de aristas
        if (typeof configurarHoverCrearAristas === 'function') {
            configurarHoverCrearAristas();
            console.log('🔗 Funcionalidad de hover para aristas activada');
        }
        
        // 3. Sincronizar grupos y activar burbujas
        setTimeout(async () => {
            await configurarSistemaGrupos();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error configurando funcionalidades avanzadas:', error);
    }
}

// Función para configurar sistema de grupos y burbujas
async function configurarSistemaGrupos() {
    console.log('🫧 Configurando sistema de grupos y burbujas...');
    
    try {
        // Sincronizar grupos del servidor
        if (typeof sincronizarGruposAlCargar === 'function') {
            await sincronizarGruposAlCargar();
        }
        
        // Verificar nodos con grupos
        if (nodes && nodes.length > 0) {
            const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
            
            if (nodosConGrupos.length > 0) {
                console.log(`🫧 Activando burbujas para ${nodosConGrupos.length} nodos con grupos`);
                
                // Activar sistema de burbujas
                if (typeof window.burbujasActivas !== 'undefined') {
                    window.burbujasActivas = true;
                }
                
                // Crear burbujas
                if (typeof crearBurbujasGrupos === 'function') {
                    crearBurbujasGrupos();
                    
                    // Configurar eventos de burbujas
                    setTimeout(() => {
                        if (typeof configurarEventosBurbujas === 'function') {
                            configurarEventosBurbujas();
                            console.log('⚡ Eventos de burbujas configurados');
                        }
                    }, 500);
                }
            } else {
                console.log('📝 No hay grupos asignados');
            }
        }
        
    } catch (error) {
        console.error('❌ Error configurando sistema de grupos:', error);
    }
}

// Función optimizada para actualizar estadísticas
function actualizarEstadisticas(data) {
    try {
        const totalNodos = data.nodes.length;
        const totalAristas = data.edges.length;
        
        // Estadísticas básicas
        document.getElementById('total-personas').textContent = totalNodos;
        document.getElementById('total-conexiones').textContent = totalAristas;
        
        // Calcular densidad
        const maxConexiones = totalNodos > 1 ? (totalNodos * (totalNodos - 1)) / 2 : 0;
        const densidad = maxConexiones > 0 ? ((totalAristas / maxConexiones) * 100).toFixed(1) : 0;
        document.getElementById('densidad-red').textContent = densidad + '%';
        
        // Calcular persona más conectada
        const personaMasConectada = calcularMasConectado(data);
        document.getElementById('mas-conectado').textContent = personaMasConectada;
        
        console.log('📊 Estadísticas actualizadas:', {
            nodos: totalNodos,
            aristas: totalAristas,
            densidad: densidad + '%',
            masConectado: personaMasConectada
        });
        
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

// Función optimizada para calcular persona más conectada
function calcularMasConectado(data) {
    if (data.nodes.length === 0) return 'Ninguna';
    
    try {
        const conteoConexiones = {};
        
        // Inicializar conteo
        data.nodes.forEach(node => {
            conteoConexiones[node.id] = 0;
        });
        
        // Contar conexiones
        data.edges.forEach(edge => {
            if (conteoConexiones.hasOwnProperty(edge.from)) {
                conteoConexiones[edge.from]++;
            }
            if (conteoConexiones.hasOwnProperty(edge.to)) {
                conteoConexiones[edge.to]++;
            }
        });
        
        // Encontrar el más conectado
        let maxConexiones = 0;
        let nodeIdMasConectado = null;
        
        Object.entries(conteoConexiones).forEach(([nodeId, conexiones]) => {
            if (conexiones > maxConexiones) {
                maxConexiones = conexiones;
                nodeIdMasConectado = nodeId;
            }
        });
        
        if (nodeIdMasConectado) {
            const nodeMasConectado = data.nodes.find(node => node.id == nodeIdMasConectado);
            if (nodeMasConectado?.label) {
                return nodeMasConectado.label.replace(/<[^>]*>/g, '').trim();
            }
        }
        
        return 'Ninguna';
        
    } catch (error) {
        console.error('❌ Error calculando persona más conectada:', error);
        return 'Error';
    }
}

// Función utility para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Funciones de estado para otros módulos
window.obtenerEstadoRed = function() {
    return {
        iniciado: sistemaEstado.iniciado,
        redLista: redLista,
        network: network,
        nodes: nodes,
        edges: edges,
        error: sistemaEstado.error
    };
};

window.esRedValida = function() {
    return network && nodes && edges && redLista;
};

// Exportar funciones principales
window.inicializarRed = inicializarRed;
window.cargarDatos = cargarDatos;
window.actualizarEstadisticas = actualizarEstadisticas;
window.actualizarEstado = actualizarEstado;

console.log('🌐 Núcleo del sistema de red cargado');