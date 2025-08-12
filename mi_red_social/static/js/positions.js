// Agregar al final de static/js/index.js

// Sistema simple de posiciones
let timeoutPosiciones = null;

async function guardarPosiciones() {
    if (!network || !nodes) return;
    
    const posiciones = {};
    const pos = network.getPositions();
    
    nodes.forEach(nodo => {
        if (pos[nodo.id]) {
            posiciones[nodo.id] = {
                x: Math.round(pos[nodo.id].x),
                y: Math.round(pos[nodo.id].y)
            };
        }
    });
    
    try {
        await fetch('/api/posiciones', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({posiciones})
        });
        console.log('📍 Posiciones guardadas');
    } catch (error) {
        console.error('Error guardando posiciones:', error);
    }
}

async function cargarPosiciones() {
    try {
        const response = await fetch('/api/posiciones');
        const data = await response.json();
        
        if (data.posiciones && Object.keys(data.posiciones).length > 0) {
            const updates = [];
            Object.entries(data.posiciones).forEach(([id, pos]) => {
                updates.push({id: parseInt(id), x: pos.x, y: pos.y, physics: false});
            });
            
            nodes.update(updates);
            console.log('📍 Posiciones cargadas:', updates.length);
            
            // Reactivar física después de 1 segundo
            setTimeout(() => {
                const reactivar = updates.map(u => ({id: u.id, physics: true}));
                nodes.update(reactivar);
            }, 1000);
        }
    } catch (error) {
        console.error('Error cargando posiciones:', error);
    }
}

// Configurar guardado automático
function configurarPosiciones() {
    if (!network) return;
    
    network.on('dragEnd', function(params) {
        if (params.nodes.length > 0) {
            clearTimeout(timeoutPosiciones);
            timeoutPosiciones = setTimeout(guardarPosiciones, 2000);
        }
    });
    
    // Cargar posiciones al iniciar
    setTimeout(cargarPosiciones, 2000);
    
    console.log('📍 Sistema de posiciones configurado');
}

// Llamar después de crear la red
// Agregar configurarPosiciones(); en la función inicializarRed() después de crear network