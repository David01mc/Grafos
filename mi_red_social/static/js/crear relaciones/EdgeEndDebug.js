// Función para guardar la nueva relación
async function guardarNuevaRelacion() {
    const form = document.getElementById('formCrearRelacion');
    if (!form) {
        console.error('❌ Formulario de relación no encontrado');
        return;
    }
    
    const formData = new FormData();
    formData.append('persona1_id', form.dataset.origenId);
    formData.append('persona2_id', form.dataset.destinoId);
    formData.append('tipo', document.getElementById('tipoRelacion').value);
    formData.append('fortaleza', document.getElementById('fortalezaRelacion').value);
    formData.append('contexto', document.getElementById('contextoRelacion').value);
    
    const botonGuardar = document.getElementById('btnGuardarRelacion');
    if (!botonGuardar) {
        console.error('❌ Botón guardar relación no encontrado');
        return;
    }
    
    const textoOriginal = botonGuardar.innerHTML;
    
    try {
        // Mostrar estado de carga
        botonGuardar.innerHTML = '<i class="icon icon-refresh icon-spin"></i> Creando relación...';
        botonGuardar.disabled = true;
        
        console.log('📤 Enviando datos de relación:', Object.fromEntries(formData));
        
        // Enviar datos al servidor
        const response = await fetch('/api/relaciones', {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        if (response.ok) {
            console.log('✅ Relación creada exitosamente');
            
            // Cerrar modal
            if (modalCrearRelacion) {
                modalCrearRelacion.hide();
            }
            
            // Esperar un poco para que el modal se cierre
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Recargar datos del grafo
            await recargarSoloDatos();
            
            mostrarNotificacion('success', 'Relación creada exitosamente');
            
        } else {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            mostrarNotificacion('error', 'Error al crear la relación: ' + errorText);
            
            // Restaurar botón en caso de error
            botonGuardar.innerHTML = textoOriginal;
            botonGuardar.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Error creando relación:', error);
        mostrarNotificacion('error', 'Error de conexión al crear la relación');
        
        // Restaurar botón en caso de error
        botonGuardar.innerHTML = textoOriginal;
        botonGuardar.disabled = false;
    }
}

// Función para configurar eventos de hover en nodos
function configurarHoverCrearAristas() {
    if (!network) {
        console.warn('⚠️ Red no inicializada, no se pueden configurar eventos de hover');
        return;
    }
    
    // Evento cuando el mouse entra en un nodo
    network.on("hoverNode", function(params) {
        // No mostrar botón si estamos en modo creación de arista
        if (modoCrearArista) return;
        
        const nodeId = params.node;
        
        // Cancelar timeout anterior si existe
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        
        // Mostrar botón después de un pequeño delay
        hoverTimeout = setTimeout(() => {
            // Verificar nuevamente que no estamos en modo creación de arista
            if (modoCrearArista) return;
            
            const posicionesNodos = network.getPositions([nodeId]);
            const posicionNodo = posicionesNodos[nodeId];
            
            if (posicionNodo) {
                // Convertir coordenadas del grafo a coordenadas DOM
                const posicionDOM = network.canvasToDOM(posicionNodo);
                mostrarBotonCrearArista(nodeId, posicionDOM);
            }
        }, 500); // Delay de 500ms para evitar mostrar el botón accidentalmente
    });
    
    // Evento cuando el mouse sale del nodo
    network.on("blurNode", function(params) {
        // Cancelar timeout si existe
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        // Ocultar botón después de un pequeño delay
        setTimeout(() => {
            // Solo ocultar si no estamos en modo creación de arista
            if (!modoCrearArista) {
                ocultarBotonCrearArista();
            }
        }, 200);
    });
    
    // Evento cuando se hace clic en cualquier parte
    network.on("click", function(params) {
        // Solo procesar si NO estamos en modo creación de arista
        if (modoCrearArista) return;
        
        // Ocultar botón si no se hizo clic en un nodo
        if (params.nodes.length === 0) {
            ocultarBotonCrearArista();
        }
    });
    
    console.log('✅ Eventos de hover para crear aristas configurados');
}

// Función principal para inicializar la funcionalidad
function inicializarCreacionAristas() {
    // Esperar a que la red esté lista
    if (typeof network !== 'undefined' && network) {
        configurarHoverCrearAristas();
        console.log('🔗 Sistema de creación de aristas inicializado');
    } else {
        // Reintentar después de un momento
        setTimeout(inicializarCreacionAristas, 1000);
    }
}

// Función para manejar tecla ESC global
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (modoCrearArista) {
            cancelarCreacionArista();
        } else if (botonCrearVisible) {
            ocultarBotonCrearArista();
        }
    }
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCreacionAristas);
} else {
    inicializarCreacionAristas();
}

// Exportar funciones para uso externo
window.configurarHoverCrearAristas = configurarHoverCrearAristas;
window.guardarNuevaRelacion = guardarNuevaRelacion;
window.cancelarCreacionArista = cancelarCreacionArista;

// Exportar variables de estado para otros scripts
Object.defineProperty(window, 'modoCrearArista', {
    get: function() { return modoCrearArista; },
    configurable: true
});

// Función de debug manual
window.debugCrearArista = function() {
    console.log('🔍 Estado actual del sistema de creación de aristas:');
    console.log('- modoCrearArista:', modoCrearArista);
    console.log('- nodoOrigenArista:', nodoOrigenArista);
    console.log('- botonCrearVisible:', botonCrearVisible);
    console.log('- modalCrearRelacion:', modalCrearRelacion);
    console.log('- aristaTemporalId:', aristaTemporalId);
    console.log('- Bootstrap disponible:', typeof bootstrap !== 'undefined');
    console.log('- Network disponible:', typeof network !== 'undefined');
    console.log('- Nodes disponible:', typeof nodes !== 'undefined');
    console.log('- Edges disponible:', typeof edges !== 'undefined');
    
    // Verificar si hay modal en el DOM
    const modalElement = document.getElementById('modalCrearRelacion');
    console.log('- Modal en DOM:', !!modalElement);
    if (modalElement) {
        console.log('- Modal visible:', modalElement.classList.contains('show'));
        console.log('- Modal display:', modalElement.style.display);
    }
};

// Función para test manual del modal
window.testModalRelacion = async function() {
    console.log('🧪 Test manual del modal de relación');
    
    // Crear nodos de prueba
    const nodoTest1 = { id: 'test1', label: 'Nodo Test 1', color: '#ff0000' };
    const nodoTest2 = { id: 'test2', label: 'Nodo Test 2', color: '#00ff00' };
    
    try {
        await abrirModalCrearRelacion(nodoTest1, nodoTest2);
        console.log('✅ Test completado');
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
};

// Función para test directo del botón +
window.testBotonMas = function(nodeId) {
    if (!nodeId) nodeId = 1; // Usar nodo 1 por defecto
    console.log('🧪 Test manual del botón + para nodo:', nodeId);
    iniciarCreacionArista(nodeId);
};

// Función para verificar los nodos disponibles
window.verificarNodos = function() {
    console.log('🔍 Verificando nodos disponibles...');
    if (!nodes) {
        console.error('❌ Variable nodes no disponible');
        return;
    }
    
    const todosLosNodos = nodes.get();
    console.log('📊 Total de nodos:', todosLosNodos.length);
    
    todosLosNodos.forEach((nodo, index) => {
        console.log(`Nodo ${index + 1}:`, {
            id: nodo.id,
            label: nodo.label,
            color: nodo.color,
            tipo: typeof nodo
        });
    });
    
    return todosLosNodos;
};

// Función para test completo paso a paso
window.testCreacionCompleta = function(origenId, destinoId) {
    if (!origenId) origenId = 1;
    if (!destinoId) destinoId = 2;
    
    console.log('🧪 Test completo de creación de arista:', origenId, '->', destinoId);
    
    // Verificar nodos
    const nodos = verificarNodos();
    const nodoOrigen = nodes.get(origenId);
    const nodoDestino = nodes.get(destinoId);
    
    console.log('🔍 Nodo origen:', nodoOrigen);
    console.log('🔍 Nodo destino:', nodoDestino);
    
    if (!nodoOrigen) {
        console.error('❌ No se encontró nodo origen con ID:', origenId);
        return;
    }
    
    if (!nodoDestino) {
        console.error('❌ No se encontró nodo destino con ID:', destinoId);
        return;
    }
    
    // Simular el proceso completo
    console.log('🎯 Simulando completarCreacionArista...');
    completarCreacionArista(destinoId);
};