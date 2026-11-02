/* ==========================================================
   juego.js
   Galería de imágenes de la descripción y formulario de reseñas.
   ========================================================== */

function inicializarPaginaJuego() {
  activarGaleria();
  activarFormularioResena();
}

/* Galería con puntos: al tocar un punto, se muestra esa imagen
   con un fundido (la transición la hace el CSS, con .activa). */
function activarGaleria() {
  const imagenes = document.querySelectorAll('.galeria-juego__imagen');
  const puntos = document.querySelectorAll('.galeria-juego__punto');
  if (imagenes.length === 0) return;

  puntos.forEach((punto, indice) => {
    punto.addEventListener('click', () => {
      imagenes.forEach((imagen) => imagen.classList.remove('activa'));
      puntos.forEach((p) => p.classList.remove('activo'));

      imagenes[indice].classList.add('activa');
      punto.classList.add('activo');
    });
  });
}

/* Reseña: como no hay backend, solo se agrega al panel y se
   limpia el formulario (no se guarda entre visitas). */
function activarFormularioResena() {
  const formulario = document.getElementById('form-resena');
  if (!formulario) return;

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const texto = document.getElementById('texto-resena').value.trim();
    const puntaje = document.getElementById('puntaje-resena').value;
    if (!texto) return;

    agregarResena('Vos', puntaje || '-', texto);
    formulario.reset();
  });
}

function agregarResena(usuario, puntaje, texto) {
  const lista = document.getElementById('lista-resenas');
  if (!lista) return;

  const articulo = document.createElement('article');
  articulo.className = 'resena';
  articulo.innerHTML = `
    <header class="resena__encabezado">
      <span class="resena__usuario">${usuario}</span>
      <span class="resena__puntaje">${puntaje}/10</span>
    </header>
    <p class="resena__texto">${texto}</p>
  `;

  lista.prepend(articulo);
}

document.addEventListener('DOMContentLoaded', inicializarPaginaJuego);
