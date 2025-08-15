// Función para configurar eventos de creación de arista
function configurarEventosCreacionArista() {
    console.log('🔄 Configurando eventos de creación de arista...');
    
    // Evento UNIFICADO para manejar todos los clics durante la creación de arista
    function onClickCreacionArista(params) {
        if (!modoCrearArista) return;
        
        console.log('🔍 Click durante creación de arista:', params);
        
        // Si se hizo clic en un nodo
        if (params.nodes.length > 0) {
            const nodeDestino = params.nodes[0];
            console.log('🎯 Click en nodo destino:', nodeDestino);
            
            // Verificar que no sea el mismo nodo
            if (nodeDestino === nodoOrigenArista) {
                mostrarNotificacion('warning', 'No puedes crear una relación de un contacto consigo mismo');
                return;
            }
            
            // Verificar que no exista ya una relación
            if (existeRelacion(nodoOrigenArista, nodeDestino)) {
                mostrarNotificacion('warning', 'Ya existe una relación entre estos contactos');
                cancelarCreacionArista();
                return;
            }
            
            // Completar la creación de arista
            completarCreacionArista(nodeDestino);
        } else {
            // Si se hizo clic en área vacía, cancelar
            console.log('❌ Click en área vacía, cancelando...');
            cancelarCreacionArista();
        }
    }
    
    // Evento para cancelar con tecla ESC
    function onEscapeKey(event) {
        if (event.key === 'Escape' && modoCrearArista) {
            console.log('🔄 ESC presionado, cancelando creación de arista');
            cancelarCreacionArista();
        }
    }
    
    // Remover eventos anteriores primero
    if (window.onClickCreacionArista) {
        network.off("click", window.onClickCreacionArista);
        console.log('🔄 Evento click anterior removido');
    }
    if (window.onEscapeKeyArista) {
        document.removeEventListener('keydown', window.onEscapeKeyArista);
        console.log('🔄 Evento ESC anterior removido');
    }
    
    // Registrar evento unificado
    network.on("click", onClickCreacionArista);
    document.addEventListener('keydown', onEscapeKey);
    
    // Guardar referencias para poder removerlas después
    window.onClickCreacionArista = onClickCreacionArista;
    window.onEscapeKeyArista = onEscapeKey;
    
    console.log('✅ Eventos de creación de arista configurados');
}

// Función para verificar si existe una relación entre dos nodos
function existeRelacion(nodeId1, nodeId2) {
    if (!edges) return false;
    
    const aristaExistente = edges.get().find(edge => 
        (edge.from === nodeId1 && edge.to === nodeId2) ||
        (edge.from === nodeId2 && edge.to === nodeId1)
    );
    
    return !!aristaExistente;
}

// Función para completar la creación de arista
async function completarCreacionArista(nodeDestino) {
    console.log('✅ Completando creación de arista:', nodoOrigenArista, '->', nodeDestino);
    
    // Validar que tenemos los IDs
    if (!nodoOrigenArista) {
        console.error('❌ Error: nodoOrigenArista es null o undefined');
        mostrarNotificacion('error', 'Error: No se encontró el nodo origen');
        return;
    }
    
    if (!nodeDestino) {
        console.error('❌ Error: nodeDestino es null o undefined');
        mostrarNotificacion('error', 'Error: No se encontró el nodo destino');
        return;
    }
    
    // IMPORTANTE: Obtener la información de los nodos ANTES de limpiar el estado
    console.log('🔍 Buscando nodo origen con ID:', nodoOrigenArista);
    const nodoOrigen = nodes.get(nodoOrigenArista);
    console.log('🔍 Nodo origen encontrado:', nodoOrigen);
    
    console.log('🔍 Buscando nodo destino con ID:', nodeDestino);
    const nodoDestinoObj = nodes.get(nodeDestino);
    console.log('🔍 Nodo destino encontrado:', nodoDestinoObj);
    
    if (!nodoOrigen) {
        console.error('❌ Error: No se pudo obtener el nodo origen con ID:', nodoOrigenArista);
        mostrarNotificacion('error', 'Error: No se encontró información del nodo origen');
        return;
    }
    
    if (!nodoDestinoObj) {
        console.error('❌ Error: No se pudo obtener el nodo destino con ID:', nodeDestino);
        mostrarNotificacion('error', 'Error: No se encontró información del nodo destino');
        return;
    }
    
    console.log('📋 Nodos para la relación:', {
        origen: { id: nodoOrigen.id, label: nodoOrigen.label },
        destino: { id: nodoDestinoObj.id, label: nodoDestinoObj.label }
    });
    
    // AHORA sí limpiar el estado temporal (después de obtener los nodos)
    limpiarEstadoTemporal();
    
    // Abrir modal para configurar la relación
    try {
        await abrirModalCrearRelacion(nodoOrigen, nodoDestinoObj);
    } catch (error) {
        console.error('❌ Error abriendo modal:', error);
        mostrarNotificacion('error', 'Error abriendo formulario de relación: ' + error.message);
    }
}

// Función para cancelar la creación de arista
function cancelarCreacionArista() {
    console.log('❌ Cancelando creación de arista');
    
    mostrarNotificacion('info', 'Creación de relación cancelada');
    limpiarEstadoTemporal();
}