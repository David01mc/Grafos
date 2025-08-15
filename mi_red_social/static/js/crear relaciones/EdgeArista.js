// Función para crear arista temporal que sigue al mouse
function crearAristaTemporalSigueMouse(posicionOrigen) {
    console.log('🔄 Creando arista temporal...');
    
    // Eliminar arista temporal anterior si existe
    if (aristaTemporalId && edges.get(aristaTemporalId)) {
        edges.remove(aristaTemporalId);
    }
    
    // Crear nodo temporal invisible para el extremo de la arista
    const nodoTemporalId = 'temp_node_' + Date.now();
    aristaTemporalId = 'temp_edge_' + Date.now();
    
    try {
        // Agregar nodo temporal invisible
        nodes.add({
            id: nodoTemporalId,
            x: posicionOrigen.x + 50,
            y: posicionOrigen.y,
            size: 0.1,
            opacity: 0,
            physics: false,
            hidden: true
        });
        
        // Agregar arista temporal
        edges.add({
            id: aristaTemporalId,
            from: nodoOrigenArista,
            to: nodoTemporalId,
            color: {
                color: '#10b981',
                opacity: 0.8
            },
            width: 3,
            dashes: [5, 5],
            smooth: false,
            physics: false
        });
        
        console.log('✅ Arista temporal creada');
    } catch (error) {
        console.error('❌ Error creando arista temporal:', error);
    }
    
    // Evento para mover el nodo temporal con el mouse
    const container = document.getElementById('network');
    
    function moverAristaTemporal(event) {
        if (!modoCrearArista) return;
        
        try {
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Convertir coordenadas de pantalla a coordenadas del grafo
            const coordenadasGrafo = network.DOMtoCanvas({x, y});
            
            // Actualizar posición del nodo temporal
            nodes.update({
                id: nodoTemporalId,
                x: coordenadasGrafo.x,
                y: coordenadasGrafo.y
            });
        } catch (error) {
            console.error('❌ Error moviendo arista temporal:', error);
        }
    }
    
    container.addEventListener('mousemove', moverAristaTemporal);
    
    // Guardar función para poder removerla después
    window.moverAristaTemporal = moverAristaTemporal;
    window.nodoTemporalId = nodoTemporalId;
    
    console.log('✅ Eventos de mouse configurados para arista temporal');
}