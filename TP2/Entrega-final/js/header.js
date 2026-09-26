document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Cargar el componente Header
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar el header');
            return response.text();
        })
        .then(html => {
            // Inyectamos el HTML
            document.getElementById('header-container').innerHTML = html;
            
            // 2. Inicializamos la lógica AHORA que los elementos existen en el DOM
            inicializarEventosHeader();
        })
        .catch(error => console.error('Error:', error));

});

// Función que contiene la lógica de las animaciones e interacciones
function inicializarEventosHeader() {
    const btnMenu = document.getElementById('btn-menu');
    const contenedorBuscador = document.querySelector('.header__grupo--centro');
    const btnLupa = document.getElementById('btn-lupa');
    const inputBuscador = document.getElementById('input-buscador');

    // Animación Menú Hamburguesa a "X"
    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            btnMenu.classList.toggle('activo');
        });
    }

    // Lógica para el buscador en móvil
    if (btnLupa && contenedorBuscador && inputBuscador) {
        btnLupa.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                contenedorBuscador.classList.toggle('mostrar-buscador');
                
                if(contenedorBuscador.classList.contains('mostrar-buscador')){
                    inputBuscador.focus();
                }
            }
        });
    }
}