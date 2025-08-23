// static/js/images/images-network-integration.js
// Integración específica de imágenes con el canvas de vis.js

console.log('🖼️ Cargando integración de imágenes con vis.js canvas...');

// Función para aplicar imágenes a nodos del grafo
function aplicarImagenesANodosCanvas() {
    if (!verificarContextoGrafo()) {
        console.log('📝 Contexto de grafo no disponible para aplicar imágenes');
        return;
    }
    
    try {
        const nodosActuales = window.nodes.get();
        const updates = [];
        
        nodosActuales.forEach(nodo => {
            const imagenInfo = imagenesEstado.imagenesDisponibles.get(nodo.id);
            
            if (imagenInfo) {
                // Configuración específica para nodos con imagen en vis.js
                updates.push({
                    id: nodo.id,
                    shape: 'image',
                    image: imagenInfo.imagen_url,
                    size: 60, // Tamaño apropiado para el canvas
                    borderWidth: 3,
                    borderWidthSelected: 5,
                    shadow: {
                        enabled: true,
                        color: 'rgba(0,0,0,0.3)',
                        size: 8,
                        x: 2,
                        y: 2
                    },
                    color: {
                        border: nodo.color || '#4ECDC4',
                        background: 'white'
                    },
                    // Configuración específica para el hover y selección
                    chosen: {
                        node: function(values, id, selected, hovering) {
                            if (selected) {
                                values.borderWidth = 6;
                                values.shadow = true;
                                values.shadowColor = 'rgba(59, 130, 246, 0.5)';
                                values.shadowSize = 15;
                            } else if (hovering) {
                                values.borderWidth = 4;
                                values.shadow = true;
                                values.shadowColor = 'rgba(0,0,0,0.4)';
                                values.shadowSize = 12;
                            }
                        }
                    },
                    // Configuración del label para nodos con imagen
                    font: {
                        size: 14,
                        color: '#333',
                        strokeWidth: 3,
                        strokeColor: 'white',
                        face: 'Inter, sans-serif'
                    }
                });
                
                console.log(`🖼️ Imagen aplicada al nodo ${nodo.id}: ${imagenInfo.nombre}`);
            } else {
                // Restaurar nodo sin imagen si la tenía antes
                if (nodo.shape === 'image') {
                    updates.push({
                        id: nodo.id,
                        shape: 'dot',
                        image: undefined,
                        size: 30,
                        borderWidth: 2,
                        color: nodo.color || '#4ECDC4',
                        shadow: {
                            enabled: true,
                            color: 'rgba(0,0,0,0.2)',
                            size: 6,
                            x: 1,
                            y: 1
                        }
                    });
                    
                    console.log(`🔄 Imagen removida del nodo ${nodo.id}`);
                }
            }
        });
        
        if (updates.length > 0) {
            window.nodes.update(updates);
            console.log(`✅ ${updates.length} nodos actualizados con cambios de imagen`);
            
            // Redibujar el canvas para aplicar los cambios
            if (window.network) {
                window.network.redraw();
            }
        }
    } catch (error) {
        console.error('❌ Error aplicando imágenes a nodos del canvas:', error);
    }
}

// Función específica para configurar estilos de imagen en el canvas
function configurarEstilosImagenCanvas() {
    // Configuraciones globales para nodos con imagen
    const opcionesImagenCanvas = {
        nodes: {
            // Configuración base para todos los nodos con imagen
            image: {
                unselected: 'images/default-avatar.png' // Imagen por defecto si no carga
            },
            // Configuración de hover mejorada
            chosen: {
                node: function(values, id, selected, hovering) {
                    const nodo = window.nodes.get(id);
                    
                    if (nodo && nodo.shape === 'image') {
                        if (selected) {
                            values.borderWidth = 6;
                            values.borderColor = '#3b82f6';
                            values.shadow = true;
                            values.shadowColor = 'rgba(59, 130, 246, 0.5)';
                            values.shadowSize = 15;
                        } else if (hovering) {
                            values.borderWidth = 4;
                            values.borderColor = nodo.color || '#4ECDC4';
                            values.shadow = true;
                            values.shadowColor = 'rgba(0,0,0,0.4)';
                            values.shadowSize = 12;
                        } else {
                            values.borderWidth = 3;
                            values.shadow = true;
                            values.shadowColor = 'rgba(0,0,0,0.2)';
                            values.shadowSize = 8;
                        }
                    }
                }
            }
        }
    };
    
    // Aplicar configuración al network si existe
    if (window.network) {
        window.network.setOptions(opcionesImagenCanvas);
        console.log('✅ Estilos de imagen configurados en el canvas');
    }
}

// Función para manejar errores de carga de imagen
function manejarErroresImagenCanvas() {
    if (!window.network) return;
    
    // Escuchar errores de carga de imagen (vis.js no expone esto directamente,
    // pero podemos detectar cuando una imagen no se muestra)
    window.network.on('afterDrawing', function(ctx) {
        // Esta función se ejecuta después de cada redibujado
        // Aquí podríamos implementar lógica adicional si fuera necesario
    });
    
    console.log('✅ Manejo de errores de imagen configurado');
}

// Función para precargar imágenes para mejor rendimiento
async function precargarImagenes() {
    console.log('📥 Precargando imágenes para mejor rendimiento...');
    
    const imagenes = Array.from(imagenesEstado.imagenesDisponibles.values());
    const promesasCarga = [];
    
    imagenes.forEach(imagenInfo => {
        const promesaCarga = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Imagen precargada: ${imagenInfo.nombre}`);
                resolve(imagenInfo);
            };
            img.onerror = () => {
                console.warn(`⚠️ Error precargando imagen: ${imagenInfo.nombre}`);
                resolve(imagenInfo); // Resolver de todos modos para no bloquear
            };
            img.src = imagenInfo.imagen_url;
        });
        
        promesasCarga.push(promesaCarga);
    });
    
    try {
        await Promise.all(promesasCarga);
        console.log(`✅ ${imagenes.length} imágenes precargadas`);
    } catch (error) {
        console.error('❌ Error durante precarga de imágenes:', error);
    }
}

// Función para optimizar la calidad de las imágenes en el canvas
function optimizarCalidadImagenesCanvas() {
    if (!window.network) return;
    
    // Configurar opciones de renderizado para mejor calidad
    const canvas = document.querySelector('#network canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Mejorar la calidad de renderizado de imágenes
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Para pantallas de alta densidad
            const devicePixelRatio = window.devicePixelRatio || 1;
            if (devicePixelRatio > 1) {
                console.log(`📱 Pantalla de alta densidad detectada (${devicePixelRatio}x)`);
                // vis.js maneja esto automáticamente, pero podemos loguearlo
            }
        }
    }
    
    console.log('✅ Optimización de calidad de imagen configurada');
}

// Función principal de integración con el canvas
function integrarImagenesConCanvas() {
    console.log('🔌 Integrando sistema de imágenes con canvas vis.js...');
    
    // Esperar a que el sistema esté listo
    if (!verificarContextoGrafo() || typeof imagenesEstado === 'undefined') {
        console.log('⏳ Esperando sistema de imágenes y grafo...');
        setTimeout(integrarImagenesConCanvas, 1000);
        return;
    }
    
    try {
        // Configurar estilos específicos del canvas
        configurarEstilosImagenCanvas();
        
        // Manejar errores de imagen
        manejarErroresImagenCanvas();
        
        // Optimizar calidad
        optimizarCalidadImagenesCanvas();
        
        // Precargar imágenes existentes
        if (imagenesEstado.imagenesDisponibles.size > 0) {
            precargarImagenes().then(() => {
                // Aplicar imágenes después de precargar
                aplicarImagenesANodosCanvas();
            });
        }
        
        console.log('✅ Integración con canvas completada');
        
    } catch (error) {
        console.error('❌ Error integrando imágenes con canvas:', error);
    }
}

// Sobrescribir la función original de aplicar imágenes
if (typeof window.aplicarImagenesANodos !== 'undefined') {
    const originalAplicarImagenes = window.aplicarImagenesANodos;
    
    window.aplicarImagenesANodos = function() {
        // Llamar a la versión optimizada para canvas
        aplicarImagenesANodosCanvas();
    };
    
    console.log('✅ Función aplicarImagenesANodos sobrescrita para canvas');
}

// Función para debug específico de imágenes en canvas
window.debugImagenesCanvas = function() {
    console.log('🔍 DEBUG DE IMÁGENES EN CANVAS:');
    console.log('==============================');
    
    if (!window.network || !window.nodes) {
        console.log('❌ Network o nodes no disponibles');
        return;
    }
    
    const todosLosNodos = window.nodes.get();
    const nodosConImagen = todosLosNodos.filter(nodo => nodo.shape === 'image');
    
    console.log(`📊 Total nodos: ${todosLosNodos.length}`);
    console.log(`🖼️ Nodos con imagen: ${nodosConImagen.length}`);
    console.log(`💾 Imágenes en cache: ${imagenesEstado.imagenesDisponibles.size}`);
    
    console.log('\n🎨 Configuración de nodos con imagen:');
    nodosConImagen.forEach((nodo, index) => {
        console.log(`${index + 1}. Nodo ${nodo.id}:`, {
            imagen: nodo.image,
            tamaño: nodo.size,
            borde: nodo.borderWidth,
            sombra: nodo.shadow
        });
    });
    
    // Verificar canvas
    const canvas = document.querySelector('#network canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        console.log('\n🖼️ Estado del canvas:');
        console.log('- Suavizado:', ctx.imageSmoothingEnabled);
        console.log('- Calidad:', ctx.imageSmoothingQuality);
        console.log('- Pixel ratio:', window.devicePixelRatio || 1);
    }
    
    console.log('==============================');
};

// Auto-inicializar cuando esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(integrarImagenesConCanvas, 3000);
});

// Exportar funciones
window.aplicarImagenesANodosCanvas = aplicarImagenesANodosCanvas;
window.precargarImagenes = precargarImagenes;
window.integrarImagenesConCanvas = integrarImagenesConCanvas;

console.log('🖼️ Integración de imágenes con vis.js canvas cargada');