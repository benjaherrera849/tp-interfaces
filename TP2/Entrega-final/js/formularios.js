/* ==========================================================
   formularios.js
   Se usa en login.html y registro.html.
   ========================================================== */

function inicializarFormularios() {
  activarTogglesDeClave();
  activarEnvioDeRegistro();
  activarEnvioDeLogin();
}
function activarEnvioDeLogin() {
  const formLogin = document.getElementById('form-login');
  if (!formLogin) return;

  formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault(); 

    const email = document.getElementById('email').value;
    const clave = document.getElementById('clave').value;
    const msjError = document.getElementById('mensaje-error');

    if (email === 'tudai@hitbox.com' && clave === '123456') {
      msjError.style.display = 'none';
      mostrarMensajeExito(); 
      setTimeout(() => window.location.href = 'index.html', 1500); 
    } else {
      msjError.style.display = 'block';
    }
  });
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

/* Al registrarse: valida que las contraseñas coincidan y,
   si está todo bien, muestra el mensaje de éxito animado. */
function activarEnvioDeRegistro() {
  const formulario = document.getElementById('form-registro');
  if (!formulario) return;

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const clave = document.getElementById('clave').value;
    const repetirClave = document.getElementById('repetir-clave').value;
    const msjError = document.getElementById('mensaje-error');

    if (clave == repetirClave) {
      msjError.style.display = 'none';
      mostrarMensajeExito();
      setTimeout(() => window.location.href = 'index.html', 1500);
    }else{

     msjError.style.display = 'block';
    }
  });
}

function mostrarMensajeExito() {
  const mensaje = document.getElementById('mensaje-exito');
  if (mensaje) mensaje.classList.add('visible');
}

document.addEventListener('DOMContentLoaded', inicializarFormularios);
