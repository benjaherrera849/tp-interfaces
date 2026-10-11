// Aca guardamos en memoria la respuesta de la API
let juegos = [];

// Pedimos los datos al endpoint v2
fetch('https://vj.interfaces.jima.com.ar/api/v2')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    juegos = data;                      // guardamos TODOS los juegos en memoria
    mostrarJuegos(juegos.slice(0, 20)); // pero mostramos solo los primeros 20
  })
  .catch(error => {
    console.error('Error al obtener los juegos:', error);
  });

// Arma el HTML de las tarjetas y lo mete en el track del carrusel
function mostrarJuegos(lista) {
  const track = document.getElementById('track');
  let html = '';

  lista.forEach((juego, i) => {
    const generos = juego.genres.map(g => g.name).join(', ');

    html += `
      <article class="card" id="juego-${i + 1}">
        <img src="${juego.background_image_low_res}" alt="${juego.name}">
        <div class="info">
          <h2>${juego.name}</h2>
          <p class="fecha">${juego.released}</p>
          <p class="generos">${generos}</p>
          <p class="rating">&#9733; ${juego.rating}</p>
        </div>
      </article>
    `;
  });

  track.innerHTML = html;
}
