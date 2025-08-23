// static/js/index/network-core-image-enhanced.js
// Configuración mejorada del network core para soportar imágenes

console.log('🌐 Cargando configuración mejorada para imágenes...');

// Configuración optimizada para imágenes en vis.js
const CONFIG_RED_CON_IMAGENES = {
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
        // Configuración base para todos los nodos
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
            strokeColor: 'rgba(0,0,0,0.6)',
            face: 'Inter, sans-serif'
        },
        // Configuración específica para nodos con imagen
        image: {
            // Imagen por defecto si no carga
            unselected: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0RUNCT0M0Ii8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMTYiIHI9IjYiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zMCAzMkMyOCAyNiAyNCAyNCAyMCAyNEMxNiAyNCAxMiAyNiAxMCAzMkgzMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
        },
        // Configuración mejorada para selección y hover
        chosen: {
            node: function(values, id, selected, hovering) {
                const nodo = nodes ? nodes.get(id) : null;
                
                if (nodo && nodo.shape === 'image') {
                    // Configuración específica para nodos con imagen
                    if (selected) {
                        values.borderWidth = 6;
                        values.borderColor = '#3b82f6';
                        values.shadow = true;
                        values.shadowColor = 'rgba(59, 130, 246, 0.5)';
                        values.shadowSize = 15;
                        values.shadowX = 2;
                        values.shadowY = 2;
                    } else if (hovering) {
                        values.borderWidth = 4;
                        values.borderColor = nodo.color || '#4ECDC4';
                        values.shadow = true;
                        values.shadowColor = 'rgba(0,0,0,0.4)';
                        values.shadowSize = 12;
                        values.shadowX = 2;
                        values.shadowY = 2;
                    } else {
                        values.borderWidth = 3;
                        values.borderColor = nodo.color || '#4ECDC4';
                        values.shadow = true;
                        values.shadowColor = 'rgba(0,0,0,0.2)';
                        values.shadowSize = 8;
                        values.shadowX = 1;
                        values.shadowY = 1;
                    }
                } else {
                    // Configuración para nodos normales (sin imagen)
                    if (selected) {
                        values.shadow = true;
                        values.shadowColor = 'rgba(0,0,0,0.3)';
                        values.shadowSize = 10;
                    } else if (hovering) {
                        values.shadow = true;
                        values.shadowColor = 'rgba(0,0,0,0.25)';
                        values.shadowSize = 8;
                    }
                }
            }
        }
    },
    // Configuración del canvas para mejor rendimiento con imágenes
    configure: {
        enabled: false
    },
    // Configuraciones adicionales para imágenes
    groups: {
        // Grupo específico para nodos con imagen
        withImage: {
            shape: 'image',
            size: 60,
            borderWidth: 3,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.3)',
                size: 8,
                x: 2,
                y: 2
            }
        },
        // Grupo para nodos sin imagen
        withoutImage: {
            shape: 'dot',
            size: 30,
            borderWidth: 2,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.2)',
                size: 6,
                x: 1,
                y: 1
            }
        }
    }
};

// Función mejorada para inicializar la red con soporte de imágenes
async function inicializarRedConImagenes() {
    console.log('🌐 Inicializando red con soporte mejorado para imágenes...');
    
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
        // Cargar datos
        const data = await cargarDatos();
        
        if (data.nodes.length === 0) {
            actualizarEstado('⚠️ Sin datos - Ve a Administración', 'warning');
            return;
        }
        
        // Crear datasets
        nodes = new vis.DataSet(data.nodes);
        edges = new vis.DataSet(data.edges);
        
        // Crear la red con configuración mejorada para imágenes
        network = new vis.Network(container, { nodes, edges }, CONFIG_RED_CON_IMAGENES);
        
        console.log('🖼️ Red creada con configuración optimizada para imágenes');
        
        // Configurar eventos básicos
        configurarEventosBasicosConImagenes();
        
        // Configurar sistema de posiciones
        if (typeof configurarPosiciones === 'function') {
            configurarPosiciones();
        }
        
        // Actualizar estadísticas
        actualizarEstadisticas(data);
        
        // Marcar como iniciado
        sistemaEstado.iniciado = true;
        
        // Configurar funcionalidades adicionales después de estabilización
        configurarEstabilizacionConImagenes();
        
        console.log('🎉 Red con soporte de imágenes inicializada completamente');
        
    } catch (error) {
        console.error('❌ Error inicializando red con imágenes:', error);
        sistemaEstado.error = error.message;
        actualizarEstado(`❌ Error: ${error.message}`, 'error');
    }
}

// Función para configurar eventos básicos con soporte de imágenes
function configurarEventosBasicosConImagenes() {
    if (!network) return;
    
    console.log('⚡ Configurando eventos básicos con soporte de imágenes...');
    
    // Eventos de cursor mejorados para imágenes
    network.on("hoverNode", (params) => {
        const nodo = nodes.get(params.node);
        
        if (nodo && nodo.shape === 'image') {
            // Cursor específico para nodos con imagen
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'pointer';
        }
    });
    
    network.on("blurNode", () => {
        document.body.style.cursor = 'default';
    });
    
    // Eventos de arrastre mejorados
    network.on("dragStart", (params) => {
        if (params.nodes.length > 0) {
            const nodo = nodes.get(params.nodes[0]);
            
            if (nodo && nodo.shape === 'image') {
                document.body.style.cursor = 'grabbing';
                // Aplicar efecto visual durante el arrastre
                console.log(`🖼️ Arrastrando nodo con imagen: ${nodo.id}`);
            } else {
                document.body.style.cursor = 'grabbing';
            }
        }
    });
    
    network.on("dragEnd", (params) => {
        document.body.style.cursor = 'default';
        
        if (params.nodes.length > 0) {
            const nodo = nodes.get(params.nodes[0]);
            if (nodo && nodo.shape === 'image') {
                console.log(`✅ Nodo con imagen soltado: ${nodo.id}`);
                // Guardar posición si el sistema de posiciones está activo
                if (typeof guardarPosiciones === 'function') {
                    setTimeout(guardarPosiciones, 1000);
                }
            }
        }
    });
    
    // Evento específico para detectar errores de carga de imagen
    network.on('afterDrawing', function(ctx) {
        // Este evento se ejecuta después de cada redibujado
        // Podemos usarlo para detectar si las imágenes se renderizaron correctamente
        
        if (typeof window.debugModoImagenes !== 'undefined' && window.debugModoImagenes) {
            console.log('🎨 Canvas redibujado con imágenes');
        }
    });
    
    // Evento de redimensionado optimizado para imágenes
    window.addEventListener('resize', debounce(() => {
        if (network) {
            // Optimizar redimensionado cuando hay imágenes
            console.log('📐 Redimensionando red con imágenes...');
            network.redraw();
            setTimeout(() => network.fit(), 100);
        }
    }, 250));
    
    console.log('✅ Eventos básicos con soporte de imágenes configurados');
}

// Función para configurar estabilización con imágenes
function configurarEstabilizacionConImagenes() {
    if (!network) return;
    
    let estabilizacionCompleta = false;
    
    function completarInicializacionConImagenes() {
        if (estabilizacionCompleta) return;
        
        estabilizacionCompleta = true;
        redLista = true;
        
        console.log('🎯 Red estabilizada, configurando funcionalidades con imágenes...');
        
        // Ajustar vista
        network.fit();
        
        // Configurar funcionalidades adicionales con delay
        setTimeout(() => {
            configurarFuncionalidadesAvanzadasConImagenes();
        }, 500);
    }
    
    // Múltiples eventos para asegurar inicialización
    network.once("stabilizationIterationsDone", completarInicializacionConImagenes);
    network.once("afterDrawing", () => {
        setTimeout(completarInicializacionConImagenes, 300);
    });
    
    // Backup temporal
    setTimeout(completarInicializacionConImagenes, 3000);
}

// Función para configurar funcionalidades avanzadas con imágenes
async function configurarFuncionalidadesAvanzadasConImagenes() {
    console.log('🔧 Configurando funcionalidades avanzadas con soporte de imágenes...');
    
    try {
        // 1. Cargar sistema de imágenes
        if (typeof cargarImagenesDisponibles === 'function') {
            console.log('🖼️ Cargando imágenes disponibles...');
            await cargarImagenesDisponibles();
        }
        
        // 2. Integrar imágenes con canvas
        if (typeof integrarImagenesConCanvas === 'function') {
            setTimeout(integrarImagenesConCanvas, 1000);
        }
        
        // 3. Configurar funcionalidades básicas
        if (typeof configurarDobleClickCrearNodo === 'function') {
            configurarDobleClickCrearNodo();
            console.log('🎯 Funcionalidad de doble clic activada');
        }
        
        if (typeof configurarHoverCrearAristas === 'function') {
            configurarHoverCrearAristas();
            console.log('🔗 Funcionalidad de hover para aristas activada');
        }
        
        // 4. Configurar sistema de grupos y burbujas
        setTimeout(async () => {
            await configurarSistemaGruposConImagenes();
        }, 1000);
        
        console.log('✅ Funcionalidades avanzadas con imágenes configuradas');
        
    } catch (error) {
        console.error('❌ Error configurando funcionalidades avanzadas con imágenes:', error);
    }
}

// Función para configurar sistema de grupos con imágenes
async function configurarSistemaGruposConImagenes() {
    console.log('🫧 Configurando sistema de grupos con soporte de imágenes...');
    
    try {
        // Sincronizar grupos del servidor
        if (typeof sincronizarGruposAlCargar === 'function') {
            await sincronizarGruposAlCargar();
        }
        
        // Verificar nodos con grupos
        if (nodes && nodes.length > 0) {
            const nodosConGrupos = nodes.get().filter(nodo => 
                nodo.grupo && nodo.grupo !== 'sin_grupo'
            );
            
            if (nodosConGrupos.length > 0) {
                console.log(`🫧 Activando burbujas para ${nodosConGrupos.length} nodos con grupos (incluyendo imágenes)`);
                
                // Activar sistema de burbujas
                if (typeof window.burbujasActivas !== 'undefined') {
                    window.burbujasActivas = true;
                }
                
                // Crear burbujas (compatible con imágenes)
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
        
        console.log('✅ Sistema de grupos con imágenes configurado');
        
    } catch (error) {
        console.error('❌ Error configurando sistema de grupos con imágenes:', error);
    }
}

// Función de debug específica para imágenes
window.debugRedConImagenes = function() {
    console.log('🔍 DEBUG RED CON IMÁGENES:');
    console.log('=========================');
    
    if (!network || !nodes) {
        console.log('❌ Network o nodes no disponibles');
        return;
    }
    
    const todosLosNodos = nodes.get();
    const nodosConImagen = todosLosNodos.filter(nodo => nodo.shape === 'image');
    const nodosSinImagen = todosLosNodos.filter(nodo => nodo.shape !== 'image');}