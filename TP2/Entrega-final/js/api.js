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

    // 1. Extraemos la matemática y la explicamos con variables claras
    const moverA = (tarjeta, smooth = true) => {
        if (!tarjeta) return;
        
        // Para centrar: Posición izquierda de la tarjeta menos la mitad de la pantalla, más la mitad de la tarjeta
        const mitadPantalla = contenedor.clientWidth / 2;
        const mitadTarjeta = tarjeta.clientWidth / 2;
        const posicionFinal = tarjeta.offsetLeft - mitadPantalla + mitadTarjeta;
        
        contenedor.scrollTo({ left: posicionFinal, behavior: smooth ? 'smooth' : 'auto' });
    };

    // 2. cambio de "reduce" complejo por un bucle forEach tradicional
    const actualizarActivo = () => {
        const centroDelContenedor = contenedor.scrollLeft + (contenedor.clientWidth / 2);
        
        let tarjetaMasCercana = cards[0];
        let distanciaMinima = Infinity;

        // Recorremos todas las tarjetas para ver cuál está más cerca del centro
        cards.forEach(tarjeta => {
            const centroDeEstaTarjeta = tarjeta.offsetLeft + (tarjeta.clientWidth / 2);
            const distancia = Math.abs(centroDeEstaTarjeta - centroDelContenedor);

            if (distancia < distanciaMinima) {
                distanciaMinima = distancia;
                tarjetaMasCercana = tarjeta;
            }
        });

        // Actualizamos la clase CSS
        const tarjetaActivaAnterior = contenedor.querySelector('.activo');
        if (tarjetaActivaAnterior) {
            tarjetaActivaAnterior.classList.remove('activo');
        }
        tarjetaMasCercana.classList.add('activo');
    };

    // Actualizamos al hacer scroll
    contenedor.addEventListener('scroll', () => requestAnimationFrame(actualizarActivo));

    // 3. Arranque inicial sin animación (índice 1 es el primer juego real)
    setTimeout(() => moverA(cards[1], false), 50);

    // 4. Lógica de flechas separada en condicionales IF / ELSE limpios
    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            const activa = contenedor.querySelector('.activo');
            
            // Si retrocedemos y estamos en la primera (o su clon), saltamos al final
            if (activa === cards[0] || activa === cards[1]) {
                moverA(cards[cards.length - 2]); 
            } else {
                // Comportamiento normal: ir a la anterior
                moverA(activa.previousElementSibling); 
            }
        });

        btnNext.addEventListener('click', () => {
            const activa = contenedor.querySelector('.activo');
            
            // Si avanzamos y estamos en la última (o su clon), volvemos al principio
            if (activa === cards[cards.length - 1] || activa === cards[cards.length - 2]) {
                moverA(cards[1]); 
            } else {
                // Comportamiento normal: ir a la siguiente
                moverA(activa.nextElementSibling); 
            }
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