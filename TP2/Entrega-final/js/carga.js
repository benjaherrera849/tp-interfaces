const progreso = document.getElementById('progreso-carga');
const numero = document.getElementById('numero-carga');
const pantalla = document.querySelector('.pantalla-carga');

let porcentaje = 0;


const intervalo= setInterval(() => {
        porcentaje+=1;
        progreso.style.width = `${porcentaje}%`;
        numero.textContent = porcentaje;

        if(porcentaje>=100){
        clearInterval(intervalo);
        pantalla.classList.add("oculta");
        }
    },  50);
