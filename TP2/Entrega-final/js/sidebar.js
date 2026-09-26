function inicializarSidebar() {
    const links = document.querySelectorAll('.sidebar__link');
    
    // Cambia la clase 'activo' al ítem clickeado
    links.forEach(link => {
        link.addEventListener('click', function() {
            links.forEach(l => l.classList.remove('activo'));
            this.classList.add('activo');
        });
    });
}