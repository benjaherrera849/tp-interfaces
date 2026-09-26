document.addEventListener('DOMContentLoaded', () => {
    
    Promise.all([
        fetch('header.html').then(res => res.text()),
        fetch('sidebar.html').then(res => res.text())
    ])
    .then(([headerHtml, sidebarHtml]) => {
        // Inyectamos el HTML en los contenedores
        document.getElementById('header-container').innerHTML = headerHtml;
        document.getElementById('sidebar-container').innerHTML = sidebarHtml;
        
        // Ejecutamos las funciones que viven en los otros archivos
        if (typeof inicializarHeader === 'function') inicializarHeader();
        if (typeof inicializarSidebar === 'function') inicializarSidebar();
        if (typeof cargarJuegos === 'function') cargarJuegos();
    })
    .catch(error => console.error('Error cargando componentes:', error));

});