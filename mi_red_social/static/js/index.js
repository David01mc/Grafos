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
        
        // Configuración optimizada para el espacio compacto
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
                hideEdgesOnDrag: true,
                selectConnectedEdges: false
            },
            edges: {
                smooth: {
                    type: "continuous",
                    forceDirection: "none"
                },
                font: { 
                    color: '#333', 
                    size: 11,
                    strokeWidth: 2,
                    strokeColor: 'white'
                },
                width: 2
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
                }
            }
        };
        
        // Crear la red
        network = new vis.Network(container, { nodes, edges }, options);
        
        // Variable para controlar si ya se mostró el mensaje de éxito
        let redLista = false;
        
        // Función para marcar la red como lista
        function marcarRedLista() {
            if (!redLista) {
                redLista = true;
                network.fit();
                actualizarEstado('✅ Red funcionando');
                setTimeout(() => actualizarEstado('Sistema listo'), 2000);
            }
        }
        
        // Eventos
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
        
        // Eventos para marcar la red como lista
        network.once("stabilizationIterationsDone", marcarRedLista);
        network.once("afterDrawing", function() {
            setTimeout(marcarRedLista, 300);
        });
        
        // Backup: actualizar estado después de un tiempo
        setTimeout(marcarRedLista, 2000);
        
    } catch (error) {
        console.error('❌ Error inicializando red:', error);
        actualizarEstado(`❌ Error: ${error.message}`);
    }
}

function centrarRed() {
    if (network) {
        network.fit();
        actualizarEstado('🎯 Vista centrada');
        setTimeout(() => actualizarEstado('Sistema listo'), 2000);
    } else {
        actualizarEstado('❌ Red no inicializada');
    }
}

function togglePhysics() {
    if (network) {
        physicsEnabled = !physicsEnabled;
        network.setOptions({ physics: { enabled: physicsEnabled } });
        
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
        actualizarEstado('🔄 Red reorganizada');
        setTimeout(() => actualizarEstado('Sistema listo'), 2000);
    } else {
        actualizarEstado('❌ Red no inicializada');
    }
}

async function recargarDatos() {
    actualizarEstado('🔄 Recargando...');
    await inicializarRed();
}

// Función para ajustar el tamaño de la red cuando cambia la ventana
function ajustarTamanoRed() {
    if (network) {
        network.redraw();
        network.fit();
    }
}

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