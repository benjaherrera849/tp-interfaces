function inicializarHeader() {
    const btnMenu = document.getElementById('btn-menu');
    const sidebar = document.getElementById('sidebar');
    const contenedorBuscador = document.querySelector('.header__grupo--centro');
    const btnLupa = document.getElementById('btn-lupa');
    const inputBuscador = document.getElementById('input-buscador');

    // Toggle Hamburguesa a "X" + Expandir/Colapsar Sidebar
    if (btnMenu && sidebar) {
        btnMenu.addEventListener('click', () => {
            btnMenu.classList.toggle('activo');
            sidebar.classList.toggle('expandida');
        });
    }

    // Lógica del buscador en Móvil
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