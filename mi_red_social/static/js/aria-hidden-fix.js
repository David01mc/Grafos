// static/js/aria-hidden-fix.js - Corrección específica para el error de aria-hidden - VERSIÓN CORREGIDA

// Función para detectar elementos interactivos - ÚNICA DECLARACIÓN
function esElementoInteractivo(elemento) {
    const tagsInteractivos = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'];
    const rolesInteractivos = ['button', 'link', 'menuitem', 'option', 'tab'];
    
    return tagsInteractivos.includes(elemento.tagName) ||
           elemento.hasAttribute('tabindex') ||
           elemento.hasAttribute('onclick') ||
           rolesInteractivos.includes(elemento.getAttribute('role')) ||
           elemento.hasAttribute('href') ||
           elemento.type === 'button' ||
           elemento.type === 'submit';
}

// Función principal para corregir errores de aria-hidden
function corregirAriaHiddenGlobal() {
    console.log('🔧 Aplicando correcciones para aria-hidden...');
    
    // 1. Corregir elementos con aria-hidden que tienen foco
    function corregirElementosEnfocados() {
        const elementosConFoco = document.querySelectorAll('[aria-hidden="true"]:focus, [aria-hidden="true"] *:focus');
        
        elementosConFoco.forEach(elemento => {
            // Encontrar el contenedor con aria-hidden
            let contenedorAriaHidden = elemento.closest('[aria-hidden="true"]');
            
            if (contenedorAriaHidden) {
                contenedorAriaHidden.removeAttribute('aria-hidden');
                console.log('✅ Removido aria-hidden de elemento con foco:', contenedorAriaHidden.tagName);
            }
        });
    }
    
    // 2. Prevenir que se añada aria-hidden a elementos interactivos
    function prevenirAriaHiddenEnInteractivos() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
                    const elemento = mutation.target;
                    
                    if (elemento.getAttribute('aria-hidden') === 'true') {
                        // Verificar si el elemento o sus hijos tienen foco
                        if (elemento === document.activeElement || elemento.contains(document.activeElement)) {
                            elemento.removeAttribute('aria-hidden');
                            console.log('🛡️ Prevenido aria-hidden en elemento con foco');
                        }
                        
                        // Verificar si el elemento es interactivo
                        if (esElementoInteractivo(elemento)) {
                            elemento.removeAttribute('aria-hidden');
                            console.log('🛡️ Prevenido aria-hidden en elemento interactivo');
                        }
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
    
    // 3. Corregir modales específicamente
    function corregirModales() {
        const modales = document.querySelectorAll('.modal');
        
        modales.forEach(modal => {
            modal.addEventListener('shown.bs.modal', function() {
                // Cuando se abre el modal, asegurar que sus elementos interactivos no tengan aria-hidden
                const elementosInteractivos = modal.querySelectorAll('button, input, select, textarea, a, [tabindex], [role="button"]');
                
                elementosInteractivos.forEach(elemento => {
                    if (elemento.getAttribute('aria-hidden') === 'true') {
                        elemento.removeAttribute('aria-hidden');
                        console.log('🔧 Corregido aria-hidden en elemento de modal');
                    }
                });
                
                // Asegurar que el modal en sí no tenga aria-hidden
                if (modal.getAttribute('aria-hidden') === 'true') {
                    modal.removeAttribute('aria-hidden');
                    console.log('🔧 Corregido aria-hidden en modal');
                }
            });
        });
    }
    
    // 4. Función de limpieza periódica
    function limpiezaPeriodica() {
        setInterval(() => {
            corregirElementosEnfocados();
        }, 2000); // Revisar cada 2 segundos
    }
    
    // Ejecutar correcciones
    corregirElementosEnfocados();
    prevenirAriaHiddenEnInteractivos();
    corregirModales();
    limpiezaPeriodica();
    
    console.log('✅ Correcciones de aria-hidden aplicadas');
}

// Función específica para Bootstrap modales
function corregirBootstrapModales() {
    // Verificar que Bootstrap esté disponible
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        console.warn('⚠️ Bootstrap Modal no disponible para corrección');
        return;
    }
    
    // Override del comportamiento de Bootstrap para modales
    const originalShow = bootstrap.Modal.prototype.show;
    const originalHide = bootstrap.Modal.prototype.hide;
    
    bootstrap.Modal.prototype.show = function() {
        const result = originalShow.apply(this, arguments);
        
        // Después de mostrar el modal, corregir aria-hidden
        setTimeout(() => {
            const modalElement = this._element;
            if (modalElement) {
                modalElement.removeAttribute('aria-hidden');
                
                const elementosInteractivos = modalElement.querySelectorAll('[aria-hidden="true"]');
                elementosInteractivos.forEach(elemento => {
                    if (esElementoInteractivo(elemento)) {
                        elemento.removeAttribute('aria-hidden');
                    }
                });
            }
        }, 100);
        
        return result;
    };
    
    bootstrap.Modal.prototype.hide = function() {
        const result = originalHide.apply(this, arguments);
        
        setTimeout(() => {
            const elementosConFoco = document.querySelectorAll('[aria-hidden="true"]:focus, [aria-hidden="true"] *:focus');
            elementosConFoco.forEach(elemento => {
                elemento.blur();
            });
        }, 100);
        
        return result;
    };
    
    console.log('🔧 Bootstrap Modal sobrescrito para corregir aria-hidden');
}

// Función para corregir específicamente los iconos
function corregirIconos() {
    const iconos = document.querySelectorAll('.icon');
    
    iconos.forEach(icono => {
        if (!icono.hasAttribute('aria-hidden')) {
            icono.setAttribute('aria-hidden', 'true');
        }
        
        if (icono.hasAttribute('tabindex')) {
            icono.removeAttribute('tabindex');
        }
        
        icono.style.pointerEvents = 'none';
    });
}

// Función de inicialización completa
function inicializarCorreccionAriaHidden() {
    console.log('🚀 Inicializando correcciones de aria-hidden...');
    
    // Esperar a que Bootstrap esté disponible
    if (typeof bootstrap !== 'undefined') {
        corregirBootstrapModales();
    } else {
        const checkBootstrap = setInterval(() => {
            if (typeof bootstrap !== 'undefined') {
                clearInterval(checkBootstrap);
                corregirBootstrapModales();
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkBootstrap);
            console.warn('⚠️ Bootstrap no se cargó en 5 segundos');
        }, 5000);
    }
    
    // Aplicar correcciones generales
    corregirAriaHiddenGlobal();
    corregirIconos();
    
    // Observer para nuevos elementos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Corregir iconos nuevos
                    const iconosNuevos = node.querySelectorAll('.icon');
                    iconosNuevos.forEach(icono => {
                        icono.setAttribute('aria-hidden', 'true');
                        icono.style.pointerEvents = 'none';
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Sistema de corrección de aria-hidden inicializado');
}

// Funciones de utilidad para debugging
window.debugAriaHidden = function() {
    console.log('🔍 Elementos con aria-hidden="true":');
    const elementos = document.querySelectorAll('[aria-hidden="true"]');
    elementos.forEach((el, index) => {
        const estaEnfocado = el === document.activeElement || el.contains(document.activeElement);
        const esInteractivo = esElementoInteractivo(el);
        
        console.log(`${index + 1}. ${el.tagName}${el.className ? '.' + el.className : ''}`, {
            enfocado: estaEnfocado,
            interactivo: esInteractivo,
            debeSolucionarse: estaEnfocado || esInteractivo
        });
    });
};

window.limpiarAriaHiddenAhora = function() {
    console.log('🧹 Limpieza manual de aria-hidden...');
    
    const elementosConFoco = document.querySelectorAll('[aria-hidden="true"]:focus, [aria-hidden="true"] *:focus');
    elementosConFoco.forEach(elemento => {
        const contenedor = elemento.closest('[aria-hidden="true"]');
        if (contenedor) {
            contenedor.removeAttribute('aria-hidden');
            console.log('🔧 Removido aria-hidden manualmente de:', contenedor.tagName);
        }
    });
    
    const modalesAbiertos = document.querySelectorAll('.modal.show[aria-hidden="true"]');
    modalesAbiertos.forEach(modal => {
        modal.removeAttribute('aria-hidden');
        console.log('🔧 Removido aria-hidden de modal abierto');
    });
    
    console.log('✅ Limpieza manual completada');
};

// Exportar funciones para uso externo
window.corregirAriaHiddenGlobal = corregirAriaHiddenGlobal;
window.corregirBootstrapModales = corregirBootstrapModales;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCorreccionAriaHidden);
} else {
    inicializarCorreccionAriaHidden();
}

console.log('♿ Sistema de corrección aria-hidden cargado (versión corregida)');