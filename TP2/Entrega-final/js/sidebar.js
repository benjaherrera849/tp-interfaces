function inicializarSidebar() {
    const links = document.querySelectorAll('.sidebar__link');
    
    // Cambia la clase 'activo' al ítem clickeado
    links.forEach(link => {
        link.addEventListener('click', function() {
            // Remueve la clase de todos
            links.forEach(l => l.classList.remove('activo'));
            // Se la agrega solo al clickeado
            this.classList.add('activo');
        });
    });
}