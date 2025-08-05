// Variables globales
let network;
let physicsEnabled = false;
let nodes, edges;

function actualizarEstado(mensaje) {
    const el = document.getElementById('estado-sistema');
    if (el) {
        el.textContent = mensaje;
        console.log('🔄 Estado:', mensaje);
    }
}

async function cargarDatos() {
    try {
        actualizarEstado('Cargando datos...');
        
        const response = await fetch('/api/grafo');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Datos recibidos:', data);
        actualizarEstado(`✅ ${data.nodes.length} contactos, ${data.edges.length} conexiones`);
        
        // Actualizar estadísticas
        document.getElementById('total-personas').textContent = data.nodes.length;
        document.getElementById('total-conexiones').textContent = data.edges.length;
        
        // Calcular densidad
        const totalNodos = data.nodes.length;
        const maxPosiblesConexiones = totalNodos > 1 ? (totalNodos * (totalNodos - 1)) / 2 : 0;
        const densidad = maxPosiblesConexiones > 0 ? ((data.edges.length / maxPosiblesConexiones) * 100).toFixed(1) : 0;
        document.getElementById('densidad-red').textContent = densidad + '%';
        
        // Calcular persona más conectada
        let personaMasConectada = 'Ninguna';
        if (data.nodes.length > 0) {
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
            
            for (const [nodeId, conexiones] of Object.entries(conteoConexiones)) {
                if (conexiones > maxConexiones) {
                    maxConexiones = conexiones;
                    nodeIdMasConectado = nodeId;
                }
            }
            
            if (nodeIdMasConectado) {
                const nodeMasConectado = data.nodes.find(node => node.id == nodeIdMasConectado);
                if (nodeMasConectado && nodeMasConectado.label) {
                    personaMasConectada = nodeMasConectado.label.replace(/<[^>]*>/g, '').trim();
                }
            }
        }
        
        document.getElementById('mas-conectado').textContent = personaMasConectada;
        
        return data;
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        actualizarEstado(`❌ Error: ${error.message}`);
        return { nodes: [], edges: [] };
    }
}

async function inicializarRed() {
    // Verificar vis.js
    if (typeof vis === 'undefined') {
        actualizarEstado('❌ vis.js no disponible');
        return;
    }
    
    actualizarEstado('🎨 Iniciando visualización...');
    
    const data = await cargarDatos();
    
    if (data.nodes.length === 0) {
        actualizarEstado('⚠️ Sin datos - Ve a Administración');
        return;
    }
    
    try {
        const container = document.getElementById('network');
        if (!container) {
            actualizarEstado('❌ Contenedor no encontrado');
            return;
        }
        
        // Crear datasets
        nodes = new vis.DataSet(data.nodes);
        edges = new vis.DataSet(data.edges);
        
        // Configuración CORREGIDA - SIN hideEdgesOnDrag
        const options = {
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
                // REMOVIDO: hideEdgesOnDrag: true, <-- Esta era la causa del problema
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
                // Asegurar que las aristas se mantengan visibles
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
                // Mejorar la interacción de los nodos
                chosen: {
                    node: function(values, id, selected, hovering) {
                        values.shadow = true;
                        values.shadowColor = 'rgba(0,0,0,0.3)';
                        values.shadowSize = 10;
                    }
                }
            },
            // Configuración adicional para mejorar el rendimiento durante el arrastre
            configure: {
                enabled: false
            }
        };
        
        // Crear la red
        network = new vis.Network(container, { nodes, edges }, options);
        
        configurarPosiciones();

        // Variable para controlar si ya se mostró el mensaje de éxito
        let redLista = false;

        // Función para marcar la red como lista
        function marcarRedLista() {
            if (!redLista) {
                redLista = true;
                network.fit();
                actualizarEstado('✅ Red funcionando');
                setTimeout(() => actualizarEstado('Sistema listo'), 2000);
                
                // NUEVA FUNCIONALIDAD: Configurar doble clic para crear nodos
                if (typeof configurarDobleClickCrearNodo === 'function') {
                    configurarDobleClickCrearNodo();
                    console.log('🎯 Funcionalidad de doble clic para crear nodos activada');
                }
                
                // NUEVA FUNCIONALIDAD: Configurar hover para crear aristas
                if (typeof configurarHoverCrearAristas === 'function') {
                    configurarHoverCrearAristas();
                    console.log('🔗 Funcionalidad de hover para crear aristas activada');
                }
                
                // NUEVA FUNCIONALIDAD: Activar sistema de burbujas automáticamente
                setTimeout(() => {
                    if (typeof crearBurbujasGrupos === 'function') {
                        console.log('🫧 Activando sistema de burbujas automáticamente...');
                        
                        // Verificar si hay nodos con grupos asignados
                        if (nodes && nodes.length > 0) {
                            const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
                            
                            if (nodosConGrupos.length > 0) {
                                // Activar burbujas si hay grupos
                                if (typeof burbujasActivas !== 'undefined') {
                                    window.burbujasActivas = true;
                                }
                                crearBurbujasGrupos();
                                console.log('✅ Burbujas activadas automáticamente');
                            } else {
                                console.log('📝 No hay grupos asignados, las burbujas se activarán cuando se asignen grupos');
                            }
                        }
                    }
                }, 1000); // Esperar 1 segundo para que todo esté estabilizado
            }
        }
        // Eventos mejorados
        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                const label = node.label ? node.label.replace(/<[^>]*>/g, '').trim() : 'Sin nombre';
                alert(`📊 Información del contacto:\n\n${label}\n\nGrupo: ${node.group || 'Sin grupo'}\nID: ${node.id}`);
            }
        });
        
        network.on("hoverNode", function () {
            document.body.style.cursor = 'pointer';
        });
        
        network.on("blurNode", function () {
            document.body.style.cursor = 'default';
        });
        
        // Eventos específicos para el arrastre
        network.on("dragStart", function (params) {
            if (params.nodes.length > 0) {
                document.body.style.cursor = 'grabbing';
                console.log('🎯 Iniciando arrastre de nodo:', params.nodes[0]);
            }
        });
        
        network.on("dragging", function (params) {
            if (params.nodes.length > 0) {
                // Durante el arrastre, podemos añadir efectos visuales si queremos
                // Las aristas ahora permanecerán visibles
            }
        });
        
        network.on("dragEnd", function (params) {
            if (params.nodes.length > 0) {
                document.body.style.cursor = 'default';
                console.log('✅ Arrastre completado para nodo:', params.nodes[0]);
            }
        });
        
        // Eventos para marcar la red como lista
        network.once("stabilizationIterationsDone", marcarRedLista);
        network.once("afterDrawing", function() {
            setTimeout(marcarRedLista, 300);
        });
        
        // Backup: actualizar estado después de un tiempo
        setTimeout(marcarRedLista, 2000);
        
        // Redimensionar automáticamente
        window.addEventListener('resize', function() {
            if (network) {
                network.redraw();
                setTimeout(() => {
                    network.fit();
                }, 100);
            }
        });

        
    } catch (error) {
        console.error('❌ Error inicializando red:', error);
        actualizarEstado(`❌ Error: ${error.message}`);
    }
}

function centrarRed() {
    if (network) {
        network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
        actualizarEstado('🎯 Vista centrada');
        setTimeout(() => actualizarEstado('Sistema listo'), 2000);
    } else {
        actualizarEstado('❌ Red no inicializada');
    }
}

function togglePhysics() {
    if (network) {
        physicsEnabled = !physicsEnabled;
        network.setOptions({ 
            physics: { 
                enabled: physicsEnabled,
                // Si activamos física, usar configuración suave
                ...(physicsEnabled && {
                    barnesHut: {
                        gravitationalConstant: -2000,
                        centralGravity: 0.1,
                        springLength: 100,
                        springConstant: 0.02,
                        damping: 0.09,
                        avoidOverlap: 0.1
                    }
                })
            } 
        });
        
        // Actualizar texto del botón
        const botonFisica = document.querySelector('button[onclick="togglePhysics()"]');
        if (botonFisica) {
            const icono = botonFisica.querySelector('i');
            botonFisica.innerHTML = `${icono.outerHTML} ${physicsEnabled ? 'Desactivar Física' : 'Activar Física'}`;
        }
        
        actualizarEstado(`⚡ Física ${physicsEnabled ? 'ON' : 'OFF'}`);
        if (!physicsEnabled) {
            actualizarEstado('✅ Red funcionando');
            setTimeout(() => actualizarEstado('Sistema listo'), 2000);
        }
    } else {
        actualizarEstado('❌ Red no inicializada');
    }
}

function randomizePositions() {
    if (nodes && network) {
        const updates = [];
        nodes.forEach(node => {
            updates.push({
                id: node.id,
                x: Math.random() * 600 - 300,
                y: Math.random() * 400 - 200
            });
        });
        nodes.update(updates);
        
        // Centrar la vista después de reorganizar
        setTimeout(() => {
            network.fit({
                animation: {
                    duration: 500,
                    easingFunction: 'easeInOutQuad'
                }
            });
        }, 100);
        
        actualizarEstado('🔄 Red reorganizada');
        setTimeout(() => actualizarEstado('Sistema listo'), 2000);
    } else {
        actualizarEstado('❌ Red no inicializada');
    }
}

// Función CORREGIDA para recargar datos - reemplazar en index.js
// Esta función debe reemplazar la función recargarDatos existente

async function recargarDatos() {
    console.log('🔄 Iniciando recarga completa del sistema...');
    actualizarEstado('🔄 Recargando sistema completo...');
    
    try {
        // 1. LIMPIAR SISTEMAS EXISTENTES
        console.log('🧹 Limpiando sistemas existentes...');
        
        // Limpiar burbujas y eventos
        if (typeof limpiarBurbujasAnteriores === 'function') {
            limpiarBurbujasAnteriores();
        }
        
        // Limpiar eventos de red si existen
        if (network) {
            try {
                network.off('zoom');
                network.off('dragStart');
                network.off('dragging'); 
                network.off('dragEnd');
                network.off('stabilizationIterationsDone');
                network.off('afterDrawing');
                console.log('🔄 Eventos de red limpiados');
            } catch (e) {
                console.log('⚠️ Algunos eventos ya estaban limpiados');
            }
        }
        
        // 2. RECARGAR DATOS FRESCOS
        console.log('📥 Cargando datos frescos del servidor...');
        const data = await cargarDatos();
        
        if (data.nodes.length === 0) {
            actualizarEstado('⚠️ Sin datos - Ve a Administración');
            return;
        }
        
        // 3. RECREAR LA RED COMPLETAMENTE
        console.log('🎨 Recreando visualización de red...');
        
        const container = document.getElementById('network');
        if (!container) {
            actualizarEstado('❌ Contenedor no encontrado');
            return;
        }
        
        // Limpiar completamente el contenedor
        container.innerHTML = '';
        
        // Recrear datasets con datos frescos
        nodes = new vis.DataSet(data.nodes);
        edges = new vis.DataSet(data.edges);
        
        console.log(`📊 Datasets recreados: ${data.nodes.length} nodos, ${data.edges.length} aristas`);
        
        // Verificar grupos en los datos
        const nodosConGrupos = data.nodes.filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
        console.log(`🏷️ ${nodosConGrupos.length} nodos tienen grupos asignados`);
        
        // 4. RECREAR LA RED CON CONFIGURACIÓN COMPLETA
        const options = {
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
        
        // Crear nueva instancia de red
        network = new vis.Network(container, { nodes, edges }, options);
        console.log('✅ Nueva instancia de red creada');
        
        // 5. RECONFIGURAR TODOS LOS EVENTOS Y SISTEMAS
        let redCompletamenteLista = false;
        
        function marcarRedCompletamenteLista() {
            if (!redCompletamenteLista) {
                redCompletamenteLista = true;
                
                console.log('🎯 Red completamente lista, configurando sistemas...');
                
                // Ajustar vista
                network.fit();
                actualizarEstado('✅ Red recargada exitosamente');
                
                // 6. RECONFIGURAR FUNCIONALIDADES ADICIONALES
                setTimeout(() => {
                    console.log('🔧 Reconfigurando funcionalidades adicionales...');
                    
                    // Reconfigurar creación de nodos
                    if (typeof configurarDobleClickCrearNodo === 'function') {
                        configurarDobleClickCrearNodo();
                        console.log('🎯 Funcionalidad de doble clic reconfigurada');
                    }
                    
                    // Reconfigurar creación de aristas
                    if (typeof configurarHoverCrearAristas === 'function') {
                        configurarHoverCrearAristas();
                        console.log('🔗 Funcionalidad de hover para aristas reconfigurada');
                    }
                    
                    // 7. SINCRONIZAR GRUPOS Y RECREAR BURBUJAS
                    setTimeout(async () => {
                        console.log('🔄 Sincronizando grupos y recreando burbujas...');
                        
                        try {
                            // Sincronizar grupos del servidor
                            if (typeof sincronizarGruposAlCargar === 'function') {
                                await sincronizarGruposAlCargar();
                                console.log('✅ Grupos sincronizados');
                            }
                            
                            // Recrear burbujas SI hay grupos
                            const nodosActualizados = nodes.get();
                            const nodosConGruposActualizados = nodosActualizados.filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
                            
                            if (nodosConGruposActualizados.length > 0) {
                                console.log(`🫧 Recreando burbujas para ${nodosConGruposActualizados.length} nodos con grupos...`);
                                
                                // Activar burbujas
                                if (typeof window.burbujasActivas !== 'undefined') {
                                    window.burbujasActivas = true;
                                }
                                
                                // Crear burbujas
                                if (typeof crearBurbujasGrupos === 'function') {
                                    crearBurbujasGrupos();
                                    console.log('✅ Burbujas recreadas exitosamente');
                                    
                                    // 8. RECONFIGURAR EVENTOS DE ZOOM DESPUÉS DE LAS BURBUJAS
                                    setTimeout(() => {
                                        console.log('⚡ Reconfigurando eventos de zoom...');
                                        
                                        // Reconfigurar eventos optimizados de zoom
                                        if (typeof configurarEventosBurbujas === 'function') {
                                            configurarEventosBurbujas();
                                            console.log('✅ Eventos de zoom reconfigurados');
                                        }
                                        
                                        // Aplicar mejoras de rendimiento de zoom
                                        if (typeof aplicarMejorasZoom === 'function') {
                                            aplicarMejorasZoom();
                                            console.log('⚡ Mejoras de zoom reaplicadas');
                                        }
                                        
                                        console.log('🎉 ¡Recarga completa exitosa con todas las funcionalidades!');
                                        mostrarNotificacion('success', '¡Red recargada completamente! Todas las funcionalidades están activas.');
                                        
                                        // Estado final
                                        setTimeout(() => {
                                            actualizarEstado('Sistema completamente listo');
                                        }, 1000);
                                        
                                    }, 500);
                                } else {
                                    console.warn('⚠️ Función crearBurbujasGrupos no disponible');
                                }
                            } else {
                                console.log('📝 No hay grupos asignados después de la recarga');
                                actualizarEstado('Sistema listo - Sin grupos');
                            }
                            
                        } catch (error) {
                            console.error('❌ Error en sincronización post-recarga:', error);
                            actualizarEstado('Red recargada - Error en grupos');
                        }
                        
                    }, 1000); // Esperar 1 segundo para estabilización
                    
                }, 500); // Esperar 500ms para configurar funcionalidades
            }
        }
        
        // Configurar eventos básicos de la red INMEDIATAMENTE
        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                const label = node.label ? node.label.replace(/<[^>]*>/g, '').trim() : 'Sin nombre';
                alert(`📊 Información del contacto:\n\n${label}\n\nGrupo: ${node.grupo || 'Sin grupo'}\nID: ${node.id}`);
            }
        });
        
        network.on("hoverNode", function () {
            document.body.style.cursor = 'pointer';
        });
        
        network.on("blurNode", function () {
            document.body.style.cursor = 'default';
        });
        
        // Eventos para marcar como lista
        network.once("stabilizationIterationsDone", marcarRedCompletamenteLista);
        network.once("afterDrawing", function() {
            setTimeout(marcarRedCompletamenteLista, 300);
        });
        
        // Backup temporal
        setTimeout(marcarRedCompletamenteLista, 3000);
        
        console.log('✅ Red recreada con eventos básicos configurados');
        
    } catch (error) {
        console.error('❌ Error durante la recarga:', error);
        actualizarEstado(`❌ Error en recarga: ${error.message}`);
        mostrarNotificacion('error', `Error recargando: ${error.message}`);
    }
}

// Función auxiliar para verificar que todo esté funcionando después de la recarga
window.verificarSistemaPostRecarga = function() {
    console.log('🔍 VERIFICACIÓN POST-RECARGA:');
    console.log('=============================');
    
    // Verificar red principal
    console.log('📊 Red:', typeof network !== 'undefined' && network ? '✅ Funcionando' : '❌ Error');
    console.log('👥 Nodos:', typeof nodes !== 'undefined' && nodes ? `✅ ${nodes.length} nodos` : '❌ Error');
    console.log('🔗 Aristas:', typeof edges !== 'undefined' && edges ? `✅ ${edges.length} aristas` : '❌ Error');
    
    // Verificar funcionalidades adicionales
    console.log('🎯 Creación nodos:', typeof configurarDobleClickCrearNodo === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('🔗 Creación aristas:', typeof configurarHoverCrearAristas === 'function' ? '✅ Disponible' : '❌ No disponible');
    
    // Verificar sistema de burbujas
    console.log('🫧 Sistema burbujas:', typeof crearBurbujasGrupos === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('🫧 Burbujas activas:', typeof burbujasActivas !== 'undefined' ? (burbujasActivas ? '✅ Activadas' : '⚠️ Desactivadas') : '❌ No definido');
    
    // Verificar burbujas en DOM
    const container = document.getElementById('network');
    const svg = container?.querySelector('.burbujas-svg');
    const burbujas = svg?.querySelectorAll('.burbuja-grupo');
    console.log('🖼️ Burbujas en DOM:', burbujas ? `✅ ${burbujas.length} encontradas` : '❌ No encontradas');
    
    // Verificar eventos de zoom
    if (network) {
        console.log('📏 Zoom actual:', network.getScale().toFixed(2));
        const viewPos = network.getViewPosition();
        console.log('📍 Posición vista:', `(${viewPos.x.toFixed(1)}, ${viewPos.y.toFixed(1)})`);
    }
    
    console.log('=============================');
    
    // Test rápido de zoom si hay burbujas
    if (burbujas && burbujas.length > 0) {
        console.log('🧪 Realizando test rápido de zoom...');
        const zoomOriginal = network.getScale();
        
        network.moveTo({ 
            scale: zoomOriginal * 1.5, 
            animation: { duration: 500 }
        });
        
        setTimeout(() => {
            network.moveTo({ 
                scale: zoomOriginal, 
                animation: { duration: 500 }
            });
            console.log('✅ Test de zoom completado');
        }, 1000);
    }
};

// Función para test completo de funcionalidades después de recarga
window.testCompletoPostRecarga = function() {
    console.log('🧪 INICIANDO TEST COMPLETO POST-RECARGA...');
    
    setTimeout(() => {
        verificarSistemaPostRecarga();
        
        // Test de creación de grupos si hay nodos suficientes
        if (nodes && nodes.length >= 4) {
            console.log('🧪 Probando creación de grupos demo...');
            if (typeof crearGruposDemo === 'function') {
                crearGruposDemo();
                
                setTimeout(() => {
                    console.log('🧪 Probando zoom con burbujas...');
                    if (typeof testZoomOptimizado === 'function') {
                        testZoomOptimizado();
                    }
                }, 2000);
            }
        }
    }, 1000);
};

console.log('🔄 Función de recarga corregida cargada');

// Función para ajustar el tamaño de la red cuando cambia la ventana
function ajustarTamanoRed() {
    if (network) {
        network.redraw();
        setTimeout(() => {
            network.fit();
        }, 100);
    }
}

// Agregar esta función mejorada para recargar datos al archivo index.js
// Reemplazar la función cargarDatos existente con esta versión mejorada

async function cargarDatos() {
    try {
        actualizarEstado('Cargando datos...');
        
        const response = await fetch('/api/grafo');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Datos recibidos:', data);
        
        // NUEVO: Verificar que los nodos tengan grupos actualizados
        if (data.nodes) {
            console.log('📋 Verificando grupos en los nodos recibidos...');
            const nodosConGrupos = data.nodes.filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
            console.log(`🏷️ ${nodosConGrupos.length} de ${data.nodes.length} nodos tienen grupos asignados`);
            
            if (nodosConGrupos.length > 0) {
                console.log('📊 Distribución de grupos recibida:');
                const distribucion = {};
                nodosConGrupos.forEach(nodo => {
                    distribucion[nodo.grupo] = (distribucion[nodo.grupo] || 0) + 1;
                });
                console.table(distribucion);
            }
        }
        
        actualizarEstado(`✅ ${data.nodes.length} contactos, ${data.edges.length} conexiones`);
        
        // Actualizar estadísticas
        document.getElementById('total-personas').textContent = data.nodes.length;
        document.getElementById('total-conexiones').textContent = data.edges.length;
        
        // Calcular densidad
        const totalNodos = data.nodes.length;
        const maxPosiblesConexiones = totalNodos > 1 ? (totalNodos * (totalNodos - 1)) / 2 : 0;
        const densidad = maxPosiblesConexiones > 0 ? ((data.edges.length / maxPosiblesConexiones) * 100).toFixed(1) : 0;
        document.getElementById('densidad-red').textContent = densidad + '%';
        
        // Calcular persona más conectada
        let personaMasConectada = 'Ninguna';
        if (data.nodes.length > 0) {
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
            
            for (const [nodeId, conexiones] of Object.entries(conteoConexiones)) {
                if (conexiones > maxConexiones) {
                    maxConexiones = conexiones;
                    nodeIdMasConectado = nodeId;
                }
            }
            
            if (nodeIdMasConectado) {
                const nodeMasConectado = data.nodes.find(node => node.id == nodeIdMasConectado);
                if (nodeMasConectado && nodeMasConectado.label) {
                    personaMasConectada = nodeMasConectado.label.replace(/<[^>]*>/g, '').trim();
                }
            }
        }
        
        document.getElementById('mas-conectado').textContent = personaMasConectada;
        
        return data;
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        actualizarEstado(`❌ Error: ${error.message}`);
        return { nodes: [], edges: [] };
    }
}

// Función mejorada para recargar SOLO los datos sin recrear toda la red - CON SINCRONIZACIÓN
async function recargarSoloDatos() {
    try {
        console.log('🔄 Recargando solo datos con sincronización...');
        
        const response = await fetch('/api/grafo');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Nuevos datos recibidos:', data);
        
        if (nodes && edges) {
            // IMPORTANTE: Actualizar datasets existentes con datos del servidor
            nodes.clear();
            nodes.add(data.nodes);
            
            edges.clear();
            edges.add(data.edges);
            
            console.log('✅ Datasets actualizados con datos del servidor');
            
            // Verificar grupos después de la actualización
            const nodosConGrupos = data.nodes.filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
            console.log(`🏷️ ${nodosConGrupos.length} nodos con grupos después de recargar`);
            
            // Actualizar estadísticas
            document.getElementById('total-personas').textContent = data.nodes.length;
            document.getElementById('total-conexiones').textContent = data.edges.length;
            
            // Calcular densidad
            const totalNodos = data.nodes.length;
            const maxPosiblesConexiones = totalNodos > 1 ? (totalNodos * (totalNodos - 1)) / 2 : 0;
            const densidad = maxPosiblesConexiones > 0 ? ((data.edges.length / maxPosiblesConexiones) * 100).toFixed(1) : 0;
            document.getElementById('densidad-red').textContent = densidad + '%';
            
            // Calcular persona más conectada
            let personaMasConectada = 'Ninguna';
            if (data.nodes.length > 0) {
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
                
                for (const [nodeId, conexiones] of Object.entries(conteoConexiones)) {
                    if (conexiones > maxConexiones) {
                        maxConexiones = conexiones;
                        nodeIdMasConectado = nodeId;
                    }
                }
                
                if (nodeIdMasConectado) {
                    const nodeMasConectado = data.nodes.find(node => node.id == nodeIdMasConectado);
                    if (nodeMasConectado && nodeMasConectado.label) {
                        personaMasConectada = nodeMasConectado.label.replace(/<[^>]*>/g, '').trim();
                    }
                }
            }
            
            document.getElementById('mas-conectado').textContent = personaMasConectada;
            
            console.log('✅ Datos actualizados correctamente con grupos sincronizados');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error recargando datos:', error);
        throw error;
    }
}

// Función CORREGIDA marcarRedLista - reemplazar en index.js
// Esta función debe reemplazar la función marcarRedLista existente

function marcarRedLista() {
    if (!redLista) {
        redLista = true;
        network.fit();
        actualizarEstado('✅ Red funcionando');
        setTimeout(() => actualizarEstado('Sistema listo'), 2000);
        
        console.log('🎯 Red marcada como lista, configurando funcionalidades...');
        
        // NUEVA FUNCIONALIDAD: Configurar doble clic para crear nodos
        if (typeof configurarDobleClickCrearNodo === 'function') {
            configurarDobleClickCrearNodo();
            console.log('🎯 Funcionalidad de doble clic para crear nodos activada');
        }
        
        // NUEVA FUNCIONALIDAD: Configurar hover para crear aristas
        if (typeof configurarHoverCrearAristas === 'function') {
            configurarHoverCrearAristas();
            console.log('🔗 Funcionalidad de hover para crear aristas activada');
        }
        
        // FUNCIONALIDAD MEJORADA: Sincronizar grupos y activar burbujas de forma robusta
        setTimeout(async () => {
            console.log('🔄 Iniciando configuración avanzada de grupos y burbujas...');
            
            try {
                // 1. Sincronizar grupos del servidor primero
                if (typeof sincronizarGruposAlCargar === 'function') {
                    console.log('🔄 Sincronizando grupos con servidor...');
                    await sincronizarGruposAlCargar();
                    console.log('✅ Grupos sincronizados con servidor');
                }
                
                // 2. Verificar si hay nodos con grupos después de la sincronización
                if (nodes && nodes.length > 0) {
                    const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
                    console.log(`📊 Después de sincronización: ${nodosConGrupos.length} nodos tienen grupos`);
                    
                    if (nodosConGrupos.length > 0) {
                        // 3. Activar sistema de burbujas
                        console.log('🫧 Activando sistema de burbujas...');
                        
                        // Asegurar que las burbujas estén activadas
                        if (typeof burbujasActivas !== 'undefined') {
                            window.burbujasActivas = true;
                        }
                        
                        // 4. Crear burbujas
                        if (typeof crearBurbujasGrupos === 'function') {
                            crearBurbujasGrupos();
                            console.log(`✅ Burbujas activadas para ${nodosConGrupos.length} nodos con grupos`);
                            
                            // 5. Configurar eventos de burbujas después de crearlas
                            setTimeout(() => {
                                if (typeof configurarEventosBurbujas === 'function') {
                                    configurarEventosBurbujas();
                                    console.log('⚡ Eventos de burbujas configurados');
                                }
                                
                                // 6. Aplicar mejoras de rendimiento de zoom
                                if (typeof aplicarMejorasZoom === 'function') {
                                    aplicarMejorasZoom();
                                    console.log('⚡ Mejoras de zoom aplicadas');
                                }
                                
                                console.log('🎉 ¡Sistema completamente configurado con todas las funcionalidades!');
                                
                            }, 500);
                            
                        } else {
                            console.warn('⚠️ Función crearBurbujasGrupos no disponible');
                        }
                    } else {
                        console.log('📝 No hay grupos asignados, las burbujas se activarán cuando se asignen grupos');
                    }
                } else {
                    console.log('⚠️ No hay nodos disponibles para configurar grupos');
                }
                
            } catch (error) {
                console.error('❌ Error en configuración avanzada:', error);
                console.log('🔄 Continuando con configuración básica...');
                
                // Fallback: intentar solo crear burbujas sin sincronización
                if (typeof crearBurbujasGrupos === 'function' && nodes && nodes.length > 0) {
                    const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
                    if (nodosConGrupos.length > 0) {
                        if (typeof burbujasActivas !== 'undefined') {
                            window.burbujasActivas = true;
                        }
                        crearBurbujasGrupos();
                        console.log('✅ Burbujas creadas en modo fallback');
                    }
                }
            }
            
        }, 1500); // Esperar 1.5 segundos para que todo esté estabilizado
    }
}

// Función auxiliar para verificar el estado del sistema
window.verificarEstadoSistema = function() {
    console.log('🔍 ESTADO ACTUAL DEL SISTEMA:');
    console.log('============================');
    
    console.log('📊 Red lista:', redLista ? '✅ Sí' : '❌ No');
    console.log('🌐 Network:', typeof network !== 'undefined' && network ? '✅ Disponible' : '❌ No disponible');
    console.log('👥 Nodos:', typeof nodes !== 'undefined' && nodes ? `✅ ${nodes.length} nodos` : '❌ No disponible');
    console.log('🔗 Aristas:', typeof edges !== 'undefined' && edges ? `✅ ${edges.length} aristas` : '❌ No disponible');
    
    // Verificar funcionalidades
    console.log('🎯 Doble clic:', typeof configurarDobleClickCrearNodo === 'function' ? '✅ Configurado' : '❌ No disponible');
    console.log('🔗 Hover aristas:', typeof configurarHoverCrearAristas === 'function' ? '✅ Configurado' : '❌ No disponible');
    console.log('🫧 Burbujas:', typeof crearBurbujasGrupos === 'function' ? '✅ Disponible' : '❌ No disponible');
    console.log('💾 Persistencia:', typeof sincronizarGruposAlCargar === 'function' ? '✅ Disponible' : '❌ No disponible');
    
    // Verificar estado de burbujas
    if (typeof burbujasActivas !== 'undefined') {
        console.log('🫧 Burbujas activas:', burbujasActivas ? '✅ Sí' : '❌ No');
        
        if (burbujasActivas) {
            const container = document.getElementById('network');
            const svg = container?.querySelector('.burbujas-svg');
            const burbujas = svg?.querySelectorAll('.burbuja-grupo');
            console.log('🖼️ Burbujas en DOM:', burbujas ? `✅ ${burbujas.length}` : '❌ 0');
        }
    } else {
        console.log('🫧 Estado burbujas: ❌ No definido');
    }
    
    console.log('============================');
    
    // Contar nodos con grupos
    if (nodes && nodes.length > 0) {
        const nodosConGrupos = nodes.get().filter(nodo => nodo.grupo && nodo.grupo !== 'sin_grupo');
        console.log(`📋 Nodos con grupos: ${nodosConGrupos.length} de ${nodes.length}`);
        
        if (nodosConGrupos.length > 0) {
            const distribucion = {};
            nodosConGrupos.forEach(nodo => {
                distribucion[nodo.grupo] = (distribucion[nodo.grupo] || 0) + 1;
            });
            console.log('📊 Distribución de grupos:');
            console.table(distribucion);
        }
    }
};

console.log('🎯 Función marcarRedLista corregida cargada');

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    actualizarEstado('📄 Iniciando sistema...');
    
    // Verificar que vis.js esté disponible antes de continuar
    function verificarYEmpezar() {
        if (typeof vis !== 'undefined') {
            console.log('✅ vis.js confirmado, iniciando red...');
            inicializarRed();
        } else {
            console.log('⏳ Esperando vis.js...');
            setTimeout(verificarYEmpezar, 500);
        }
    }
    
    verificarYEmpezar();
});

// Verificación adicional por si acaso
window.addEventListener('load', function() {
    setTimeout(() => {
        if (!network && typeof vis !== 'undefined') {
            actualizarEstado('🔄 Reintentando...');
            inicializarRed();
        }
    }, 1000);
});

// Ajustar tamaño cuando cambia la ventana
window.addEventListener('resize', ajustarTamanoRed);

// Función de debugging para verificar el estado de las aristas
function debugAristas() {
    if (network && edges) {
        console.log('🔍 Estado de las aristas:');
        console.log('Total aristas:', edges.length);
        edges.forEach(edge => {
            console.log(`Arista ${edge.id}: ${edge.from} -> ${edge.to}`);
        });
    }
}

// Hacer disponible globalmente para debugging
window.debugAristas = debugAristas;