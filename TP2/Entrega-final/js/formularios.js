/* ==========================================================
   formularios.js
   Se usa en login.html y registro.html.
   ========================================================== */

function inicializarFormularios() {
  activarTogglesDeClave();
  activarCaptchaFalso();
  activarEnvioDeRegistro();
}

/* Muestra u oculta el texto de cada campo de contraseña, y cambia
   el ícono (ojo abierto / ojo tachado) según el estado.
   El botón toggle indica, con data-input, el id del campo que controla. */
function activarTogglesDeClave() {
  document.querySelectorAll('.campo__toggle').forEach((boton) => {
    const input = document.getElementById(boton.dataset.input);
    const icono = boton.querySelector('i');
    if (!input || !icono) return;

    boton.addEventListener('click', () => {
      const seVaAMostrar = input.type === 'password';
      input.type = seVaAMostrar ? 'text' : 'password';
      icono.classList.toggle('ph-eye', !seVaAMostrar);
      icono.classList.toggle('ph-eye-slash', seVaAMostrar);
      boton.setAttribute('aria-pressed', String(seVaAMostrar));
    });
  });
}

/* Casilla "no soy un robot": decorativa, no valida nada (no hay backend). */
function activarCaptchaFalso() {
  const casilla = document.querySelector('.captcha-falso__casilla');
  if (!casilla) return;

  casilla.addEventListener('click', () => {
    casilla.classList.toggle('marcada');
  });
}

/* Al registrarse: valida que las contraseñas coincidan y,
   si está todo bien, muestra el mensaje de éxito animado. */
function activarEnvioDeRegistro() {
  const formulario = document.getElementById('form-registro');
  if (!formulario) return;

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const clave = document.getElementById('clave').value;
    const repetirClave = document.getElementById('repetir-clave').value;

    if (clave !== repetirClave) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    mostrarMensajeExito();
  });
}

function mostrarMensajeExito() {
  const mensaje = document.getElementById('mensaje-exito');
  if (mensaje) mensaje.classList.add('visible');
}

document.addEventListener('DOMContentLoaded', inicializarFormularios);
