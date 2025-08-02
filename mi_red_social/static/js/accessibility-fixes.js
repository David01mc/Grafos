// static/js/accessibility-fixes.js - Correcciones de accesibilidad para modales

// Función para manejar el foco correctamente en modales
function configurarAccesibilidadModales() {
    console.log('🔧 Configurando accesibilidad de modales...');
    
    // Configurar eventos globales para todos los modales
    document.addEventListener('shown.bs.modal', function(event) {
        const modal = event.target;
        const modalId = modal.id;
        
        console.log('📱 Modal abierto:', modalId);
        
        // Asegurar que el modal tenga el foco correcto
        setTimeout(() => {
            // Buscar el primer elemento enfocable dentro del modal
            const focusableElements = modal.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                // Enfocar el primer elemento (usualmente el botón de cerrar o primer input)
                const firstElement = focusableElements[0];
                
                // Si es un input de texto, enfocarlo
                if (firstElement.tagName === 'INPUT' && firstElement.type === 'text') {
                    firstElement.focus();
                } else if (firstElement.classList.contains('btn-close')) {
                    // Si es el botón de cerrar, buscar el siguiente elemento
                    if (focusableElements.length > 1) {
                        focusableElements[1].focus();
                    }
                } else {
                    firstElement.focus();
                }
                
                console.log('🎯 Foco establecido en:', firstElement.tagName, firstElement.className);
            }
            
            // Limpiar cualquier aria-hidden problemático
            limpiarAriaHiddenProblematico(modal);
            
        }, 100);
    });
    
    // Configurar eventos para cuando se cierra el modal
    document.addEventListener('hidden.bs.modal', function(event) {
        const modal = event.target;
        console.log('📱 Modal cerrado:', modal.id);
        
        // Restaurar el foco al elemento que abrió el modal si es posible
        const triggerElement = document.activeElement;
        if (triggerElement) {
            setTimeout(() => {
                triggerElement.blur();
                document.body.focus();
            }, 50);
        }
    });
}

// Función para limpiar aria-hidden problemático
function limpiarAriaHiddenProblematico(modal) {
    // Buscar elementos con aria-hidden dentro del modal que podrían causar problemas
    const elementosConAriaHidden = modal.querySelectorAll('[aria-hidden="true"]');
    
    elementosConAriaHidden.forEach(elemento => {
        // Si el elemento está enfocado o contiene un elemento enfocado, remover aria-hidden
        if (elemento === document.activeElement || elemento.contains(document.activeElement)) {
            elemento.removeAttribute('aria-hidden');
            console.log('🔧 Removido aria-hidden de elemento enfocado:', elemento.tagName);
        }
        
        // Si el elemento es interactivo, remover aria-hidden
        if (esElementoInteractivo(elemento)) {
            elemento.removeAttribute('aria-hidden');
            console.log('🔧 Removido aria-hidden de elemento interactivo:', elemento.tagName);
        }
    });
}

// Función para detectar si un elemento es interactivo
function esElementoInteractivo(elemento) {
    const tagsInteractivos = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'];
    const tieneTabindex = elemento.hasAttribute('tabindex') && elemento.getAttribute('tabindex') !== '-1';
    const tieneOnClick = elemento.onclick || elemento.getAttribute('onclick');
    const esEnfocable = elemento.matches(':focus-visible') || elemento.matches(':focus');
    
    return tagsInteractivos.includes(elemento.tagName) || 
           tieneTabindex || 
           tieneOnClick || 
           esEnfocable ||
           elemento.hasAttribute('role');
}

// Función específica para mejorar la accesibilidad del modal de gestión de grupos
function mejorarAccesibilidadModalGrupos() {
    // Observar cuando se crea el modal de gestión de grupos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.id === 'modalGestionGrupos') {
                    console.log('🔧 Mejorando accesibilidad del modal de gestión de grupos...');
                    
                    // Configurar navegación por teclado en las pestañas
                    const tabs = node.querySelectorAll('.nav-tabs .nav-link');
                    tabs.forEach((tab, index) => {
                        tab.setAttribute('aria-controls', tab.getAttribute('data-bs-target').substring(1));
                        tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
                        
                        // Manejar navegación con flechas del teclado
                        tab.addEventListener('keydown', function(e) {
                            let nextIndex;
                            
                            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                e.preventDefault();
                                nextIndex = (index + 1) % tabs.length;
                                tabs[nextIndex].focus();
                                tabs[nextIndex].click();
                            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                e.preventDefault();
                                nextIndex = (index - 1 + tabs.length) % tabs.length;
                                tabs[nextIndex].focus();
                                tabs[nextIndex].click();
                            } else if (e.key === 'Home') {
                                e.preventDefault();
                                tabs[0].focus();
                                tabs[0].click();
                            } else if (e.key === 'End') {
                                e.preventDefault();
                                tabs[tabs.length - 1].focus();
                                tabs[tabs.length - 1].click();
                            }
                        });
                    });
                    
                    // Mejorar accesibilidad de los checkboxes
                    const checkboxes = node.querySelectorAll('.node-grupo-card input[type="checkbox"]');
                    checkboxes.forEach(checkbox => {
                        const card = checkbox.closest('.node-grupo-card');
                        const nombreNodo = card.querySelector('.fw-bold').textContent;
                        
                        // Agregar label accesible
                        checkbox.setAttribute('aria-label', `Seleccionar ${nombreNodo}`);
                        
                        // Manejar navegación con teclado
                        card.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                checkbox.checked = !checkbox.checked;
                                checkbox.dispatchEvent(new Event('change'));
                            }
                        });
                        
                        // Hacer la card enfocable
                        card.setAttribute('tabindex', '0');
                        card.setAttribute('role', 'checkbox');
                        card.setAttribute('aria-checked', checkbox.checked);
                        
                        // Actualizar aria-checked cuando cambia el checkbox
                        checkbox.addEventListener('change', function() {
                            card.setAttribute('aria-checked', this.checked);
                        });
                    });
                    
                    // Mejorar accesibilidad de los selectores
                    const select = node.querySelector('#grupoDestino');
                    if (select) {
                        select.setAttribute('aria-label', 'Seleccionar grupo destino');
                    }
                    
                    // Mejorar accesibilidad de los sliders
                    const slider = node.querySelector('#opacidadSlider');
                    if (slider) {
                        slider.setAttribute('aria-label', 'Opacidad de las burbujas');
                        slider.setAttribute('aria-valuemin', '0.05');
                        slider.setAttribute('aria-valuemax', '0.5');
                        slider.setAttribute('aria-valuenow', slider.value);
                        
                        slider.addEventListener('input', function() {
                            this.setAttribute('aria-valuenow', this.value);
                        });
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Función para manejar el escape en modales
function configurarEscapeModales() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Buscar modales abiertos
            const modalAbierto = document.querySelector('.modal.show');
            if (modalAbierto) {
                const bsModal = bootstrap.Modal.getInstance(modalAbierto);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        }
    });
}

// Función para mejorar la navegación por teclado
function mejorarNavegacionTeclado() {
    // Manejar navegación con Tab en elementos personalizados
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const elementoActivo = document.activeElement;
            
            // Si estamos en una card de nodo, manejar la navegación
            if (elementoActivo && elementoActivo.classList.contains('node-grupo-card')) {
                const cards = Array.from(document.querySelectorAll('.node-grupo-card'));
                const indexActual = cards.indexOf(elementoActivo);
                
                if (e.shiftKey) {
                    // Tab hacia atrás
                    if (indexActual > 0) {
                        e.preventDefault();
                        cards[indexActual - 1].focus();
                    }
                } else {
                    // Tab hacia adelante
                    if (indexActual < cards.length - 1) {
                        e.preventDefault();
                        cards[indexActual + 1].focus();
                    }
                }
            }
        }
    });
}

// Función para anunciar cambios importantes a lectores de pantalla
function anunciarCambio(mensaje) {
    // Crear elemento para anuncio a lectores de pantalla
    let anunciador = document.getElementById('accessibility-announcer');
    if (!anunciador) {
        anunciador = document.createElement('div');
        anunciador.id = 'accessibility-announcer';
        anunciador.setAttribute('aria-live', 'polite');
        anunciador.setAttribute('aria-atomic', 'true');
        anunciador.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(anunciador);
    }
    
    anunciador.textContent = mensaje;
    
    // Limpiar después de un momento
    setTimeout(() => {
        anunciador.textContent = '';
    }, 1000);
}

// Función para mejorar tooltips y labels
function mejorarTooltipsYLabels() {
    // Buscar elementos que necesiten mejores labels
    const botonesSinLabel = document.querySelectorAll('button:not([aria-label]):not([title])');
    
    botonesSinLabel.forEach(boton => {
        const icono = boton.querySelector('.icon');
        const texto = boton.textContent.trim();
        
        if (icono && !texto) {
            // Determinar label basado en clases de icono
            let label = 'Botón';
            
            if (icono.classList.contains('icon-settings')) label = 'Configuración';
            else if (icono.classList.contains('icon-target')) label = 'Enfocar';
            else if (icono.classList.contains('icon-trash')) label = 'Eliminar';
            else if (icono.classList.contains('icon-plus')) label = 'Agregar';
            else if (icono.classList.contains('icon-refresh')) label = 'Actualizar';
            else if (icono.classList.contains('icon-chart')) label = 'Estadísticas';
            
            boton.setAttribute('aria-label', label);
        }
    });
}

// Función de inicialización principal
function inicializarAccesibilidad() {
    console.log('♿ Inicializando mejoras de accesibilidad...');
    
    configurarAccesibilidadModales();
    mejorarAccesibilidadModalGrupos();
    configurarEscapeModales();
    mejorarNavegacionTeclado();
    mejorarTooltipsYLabels();
    
    console.log('✅ Accesibilidad configurada');
    
    // Anunciar que el sistema está listo
    setTimeout(() => {
        anunciarCambio('Sistema de red social cargado y listo para usar');
    }, 2000);
}

// Función para limpiar warnings de aria-hidden específicos
function limpiarWarningsAriaHidden() {
    // Buscar y corregir elementos problemáticos comunes
    const elementosProblematicos = document.querySelectorAll('[aria-hidden="true"]:focus, [aria-hidden="true"] *:focus');
    
    elementosProblematicos.forEach(elemento => {
        const contenedor = elemento.closest('[aria-hidden="true"]');
        if (contenedor) {
            contenedor.removeAttribute('aria-hidden');
            console.log('🔧 Corregido aria-hidden en elemento enfocado');
        }
    });
    
    // Observar cambios futuros
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
                const elemento = mutation.target;
                if (elemento.getAttribute('aria-hidden') === 'true' && 
                    (elemento.contains(document.activeElement) || elemento === document.activeElement)) {
                    elemento.removeAttribute('aria-hidden');
                    console.log('🔧 Prevención automática de aria-hidden en elemento enfocado');
                }
            }
        });
    });
    
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['aria-hidden'],
        subtree: true 
    });
}

// Exportar funciones
window.anunciarCambio = anunciarCambio;
window.limpiarWarningsAriaHidden = limpiarWarningsAriaHidden;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAccesibilidad);
} else {
    inicializarAccesibilidad();
}

// Limpiar warnings inmediatamente
limpiarWarningsAriaHidden();

console.log('♿ Sistema de accesibilidad cargado');