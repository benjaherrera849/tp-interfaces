const API_URL = 'https://vj.interfaces.jima.com.ar/api/v2';

async function cargarJuegos() {
    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`); 
        
        const juegos = await respuesta.json(); 


        // traemoss los 8 juegos con mejor puntuacion para el hero:
        const juegosHero = [...juegos].sort((a, b) => b.rating - a.rating).slice(0, 8);
        
        // agrega clones visuales para tapar los huecos
        const juegosSinHuecos = [
            juegosHero[juegosHero.length - 1], // clon del ultimo para tapar el hueco izquierdo
            ...juegosHero,                     // Los 8 reales
            juegosHero[0]                      // clon del primero para tapar el hueco derecho
        ];


        const baseDeportes = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'sports'));
        const baseEstrategia = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'strategy'));
        // Filtrar juegos por categoría revisando el array de géneros
        const juegosAccion = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'action'));
        const juegosAventura = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'adventure'));
        const juegosDeportes = [...baseDeportes, ...baseDeportes, ...baseDeportes, ...baseDeportes, ...baseDeportes, ...baseDeportes];
        const juegosEstrategia = [...baseEstrategia, ...baseEstrategia, ...baseEstrategia];
        const juegosDisparos = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'shooter'));
        const juegosSimulacion = juegos.filter(j => j.genres.some(g => g.name.toLowerCase() === 'simulation'));

        const juegosTendencia = juegos.filter(j => j.rating >= 4.3);
        const juegosRecientes = [...juegos].sort((a, b) => new Date(b.released) - new Date(a.released));
        // Renderizar cada carrusel
        renderizarCarruselHero(juegosSinHuecos, 'hero-contenedor');
        renderizarCarrusel(juegosAccion, 'carrusel-accion', 'Acción');
        renderizarCarrusel(juegosAventura, 'carrusel-aventura', 'Aventura');
        renderizarCarrusel(juegosDeportes, 'carrusel-deportes', 'Deportes');
        renderizarCarrusel(juegosEstrategia, 'carrusel-estrategia', 'Estrategia');
        renderizarCarrusel(juegosDisparos, 'carrusel-disparos', 'Disparos');
        renderizarCarrusel(juegosSimulacion, 'carrusel-simulacion', 'Simulación');
        renderizarCarrusel(juegosTendencia, 'carrusel-tendencia', 'Top');
        renderizarCarrusel(juegosRecientes, 'carrusel-recientes', 'Nuevo');
        inicializarFlechasHero();
        inicializarFlechasNormales()
    } catch (error) {
        console.error('Error al obtener los juegos:', error);
    }
}
function renderizarCarruselHero(listaJuegos, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    contenedor.innerHTML = '';

    listaJuegos.forEach((juego, index) => {
        // La tarjeta de índice 1 (segunda) comienza activa lógicamente
        const claseActiva = index === 1 ? 'activo' : '';
        const generoPrincipal = juego.genres.length > 0 ? juego.genres[0].name : 'Top';

        const cardHTML = `
            <article class="hero-card ${claseActiva}">
                <img src="${juego.background_image_low_res}" alt="${juego.name}" class="hero-card__img" loading="lazy">
                <div class="hero-card__info">
                    <h2 class="hero-card__titulo">${juego.name}</h2>
                    <div class="hero-card__badges">
                        <span class="badge-destacado"><i class="ph-bold ph-trend-up"></i> Top Puntuado</span>
                        <span class="badge-categoria">${generoPrincipal}</span>
                        <span class="badge-estado"><i class="ph-fill ph-star"></i> ${juego.rating}</span>
                    </div>
                </div>
            </article>
        `;
        contenedor.innerHTML += cardHTML;
    });
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
function inicializarFlechasHero() {
    const contenedor = document.getElementById('hero-contenedor');
    const btnPrev = document.querySelector('.hero-btn--prev');
    const btnNext = document.querySelector('.hero-btn--next');

    if (!contenedor) return;
    const cards = Array.from(contenedor.querySelectorAll('.hero-card'));

    // 1. Extraemos toda la matemática de scroll a una sola mini-función
    const moverA = (tarjeta, smooth = true) => {
        if (!tarjeta) return;
        const offset = tarjeta.offsetLeft - (contenedor.clientWidth / 2) + (tarjeta.clientWidth / 2);
        contenedor.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
    };

    // 2. Optimizamos la detección de la tarjeta central usando reduce()
    const actualizarActivo = () => {
        const centro = contenedor.scrollLeft + (contenedor.clientWidth / 2);
        const cercana = cards.reduce((prev, curr) => 
            Math.abs((curr.offsetLeft + curr.clientWidth / 2) - centro) < 
            Math.abs((prev.offsetLeft + prev.clientWidth / 2) - centro) ? curr : prev
        );

        contenedor.querySelector('.activo')?.classList.remove('activo');
        cercana.classList.add('activo');
    };

    contenedor.addEventListener('scroll', () => requestAnimationFrame(actualizarActivo));

    // 3. Arranque inicial sin animación
    setTimeout(() => moverA(cards[1], false), 50);

    // 4. Lógica de flechas e infinito reducida a operadores ternarios
    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            const activa = contenedor.querySelector('.activo');
            moverA((activa === cards[1] || activa === cards[0]) ? cards[cards.length - 2] : activa.previousElementSibling);
        });

        btnNext.addEventListener('click', () => {
            const activa = contenedor.querySelector('.activo');
            moverA((activa === cards[cards.length - 2] || activa === cards[cards.length - 1]) ? cards[1] : activa.nextElementSibling);
        });
    }
}
function inicializarFlechasNormales() {
    document.querySelectorAll('.carrusel-wrapper').forEach(wrapper => {
        const contenedor = wrapper.querySelector('.carrusel-contenedor');
        const btnPrev = wrapper.querySelector('.carrusel-btn--prev');
        const btnNext = wrapper.querySelector('.carrusel-btn--next');

        if (btnPrev && btnNext && contenedor) {
            const moverConInercia = (distancia, clase) => {
                contenedor.scrollBy({ left: distancia, behavior: 'smooth' });
                contenedor.classList.add(clase);
                setTimeout(() => contenedor.classList.remove(clase), 250);
            };

            btnPrev.addEventListener('click', () => moverConInercia(-1200, 'scroll-izq'));
            btnNext.addEventListener('click', () => moverConInercia(1200, 'scroll-der'));
        }
    });
}