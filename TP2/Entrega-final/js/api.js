const API_URL = 'https://vj.interfaces.jima.com.ar/api/v2';

async function cargarJuegos() {
    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`); 
        
        const juegos = await respuesta.json(); 

        // Filtrar juegos por categoría revisando el array de géneros[cite: 19]
        const juegosAccion = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'action'));
        const juegosAventura = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'adventure'));
        const juegosDeportes = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'sports'));

        // Renderizar cada carrusel
        renderizarCarrusel(juegosAccion, 'carrusel-accion', 'Acción');
        renderizarCarrusel(juegosAventura, 'carrusel-aventura', 'Aventura');
        renderizarCarrusel(juegosDeportes, 'carrusel-deportes', 'Deportes');

    } catch (error) {
        console.error('Error al obtener los juegos:', error);
    }
}

function renderizarCarrusel(listaJuegos, contenedorId, nombreCategoria) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    
    contenedor.innerHTML = '';

    listaJuegos.forEach(juego => {
        const cardHTML = `
            <article class="card-game">
                <img src="${juego.background_image_low_res}" alt="${juego.name}" class="card-game__bg" loading="lazy">
                
                <div class="card-game__overlay">
                    <div class="card-game__header">
                        <!-- Ahora usa la categoría que le pasamos por parámetro -->
                        <span class="card-game__badge"><i class="ph ph-clock"></i> ${nombreCategoria}</span>
                        <span class="card-game__rating"><i class="ph-fill ph-star"></i> ${juego.rating}</span>
                    </div>
                    
                    <div class="card-game__footer">
                        <h3 class="card-game__title">${juego.name}</h3>
                        <i class="ph ph-shopping-cart card-game__cart"></i>
                    </div>
                </div>

                <div class="card-game__btn-plus">
                    <i class="ph ph-plus"></i>
                </div>
            </article>
        `;
        
        contenedor.innerHTML += cardHTML;
    });
}