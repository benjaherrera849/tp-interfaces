document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('footer-container');
    if (!contenedor) return;

    fetch('footer.html')
        .then(res => res.text())
        .then(html => {
            contenedor.innerHTML = html;
        })
        .catch(error => console.error('Error cargando footer:', error));
});
