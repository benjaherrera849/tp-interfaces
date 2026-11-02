// Carrito puramente frontend (en memoria, sin backend ni precios):
// agregar y eliminar juegos, mostrando portada y nombre.
let carrito = [];

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function renderizarCarrito() {
    const lista = document.getElementById('carrito-lista');
    if (!lista) return;

    if (carrito.length === 0) {
        lista.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío.</p>';
    } else {
        lista.innerHTML = carrito.map(item => `
            <article class="carrito-item">
                <img src="${escaparHtml(item.imagen)}" alt="${escaparHtml(item.nombre)}" class="carrito-item__img" loading="lazy">
                <span class="carrito-item__nombre">${escaparHtml(item.nombre)}</span>
                <i class="ph ph-trash carrito-item__borrar" data-id="${escaparHtml(item.id)}" role="button" tabindex="0" aria-label="Eliminar ${escaparHtml(item.nombre)} del carrito"></i>
            </article>
        `).join('');
    }

    // Marca las cards que ya están en el carrito
    document.querySelectorAll('.card-game__cart, .card-game__btn-plus').forEach(boton => {
        boton.classList.toggle('en-carrito', carrito.some(item => item.id === boton.dataset.id));
    });
}

function agregarAlCarrito(juego) {
    if (!juego || !juego.id || !juego.nombre) return;

    // Sin duplicados: si ya está, solo abrimos el panel
    if (!carrito.some(item => item.id === juego.id)) {
        carrito.push(juego);
        renderizarCarrito();
    }

    const panel = document.getElementById('carrito-panel');
    if (panel) panel.classList.add('abierto');
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    renderizarCarrito();
}

// Delegación en document: funciona aunque las cards se rendericen después (api.js)
document.addEventListener('click', (e) => {
    const botonAgregar = e.target.closest('.card-game__cart, .card-game__btn-plus');
    if (botonAgregar) {
        agregarAlCarrito({
            id: botonAgregar.dataset.id,
            nombre: botonAgregar.dataset.nombre,
            imagen: botonAgregar.dataset.imagen
        });
        return;
    }

    const botonBorrar = e.target.closest('.carrito-item__borrar');
    if (botonBorrar) {
        eliminarDelCarrito(botonBorrar.dataset.id);
    }
});

// Permite borrar con Enter/Espacio cuando el tacho tiene el foco
document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('carrito-item__borrar')) {
        e.preventDefault();
        eliminarDelCarrito(e.target.dataset.id);
    }
});

document.addEventListener('DOMContentLoaded', renderizarCarrito);
