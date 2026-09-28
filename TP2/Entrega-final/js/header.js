function inicializarHeader() {
    const btnMenu = document.getElementById('btn-menu');
    const sidebar = document.getElementById('sidebar');
    const contenedorBuscador = document.querySelector('.header__grupo--centro');
    const btnLupa = document.getElementById('btn-lupa');
    const inputBuscador = document.getElementById('input-buscador');

    // Hamburguesa a "X" + mostrar/ocultar la sidebar
    if (btnMenu && sidebar) {
        btnMenu.addEventListener('click', () => {
            btnMenu.classList.toggle('activo');
            sidebar.classList.toggle('expandida');
        });
    }

    // Lupa (solo existe en celular): abre y cierra el buscador
    if (btnLupa && contenedorBuscador && inputBuscador) {
        btnLupa.addEventListener('click', () => {
            contenedorBuscador.classList.toggle('mostrar-buscador');
            if (contenedorBuscador.classList.contains('mostrar-buscador')) {
                inputBuscador.focus();
            }
        });
    }
}
