function inicializarSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const ruta = window.location.pathname;
    const esBiblioteca = ruta.includes('biblioteca.html');
    const esIndex = ruta.endsWith('/') || ruta.includes('index.html');

    const links = sidebar.querySelectorAll('.sidebar__link');

    // Estado activo inicial según la página actual
    links.forEach(link => {
        const href = link.getAttribute('href') || '';
        if (esBiblioteca && href.includes('biblioteca.html')) {
            link.classList.add('activo');
        } else if (esIndex && (href === 'index.html#inicio' || href === '#inicio')) {
            link.classList.add('activo');
        }
    });

    sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('.sidebar__link');
        if (!link) return;

        const href = link.getAttribute('href') || '';

        // Si estamos en index y el enlace va a una sección del index, scrolleamos suavemente
        if (esIndex && href.includes('index.html#')) {
            e.preventDefault();
            const id = href.split('#')[1];
            const destino = document.getElementById(id);
            if (destino) {
                destino.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', `#${id}`);
            }
        } else if (href === '#') {
            e.preventDefault();
        }

        sidebar.querySelectorAll('.sidebar__link.activo').forEach(l => l.classList.remove('activo'));
        link.classList.add('activo');
    });
}