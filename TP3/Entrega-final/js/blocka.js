// ==========================================
// 1. VARIABLES Y CONFIGURACIÓN INICIAL
// ==========================================
const btnComenzar = document.getElementById('btn-comenzar');
const btnAyuda = document.getElementById('btn-ayuda');
const grillaBlocka = document.getElementById('grilla-blocka');
const temporizadorUI = document.getElementById('temporizador');
const nivelUI = document.getElementById('nivel-actual');
const tiempoMaximoUI = document.getElementById('tiempo-maximo');

const modalUI = document.getElementById('blocka-modal');
const modalMensaje = document.getElementById('modal-mensaje');
const btnModalAccion = document.getElementById('btn-modal-accion');


// Los 4 canvas del HTML
const canvasList = [
    document.getElementById('pieza-0'),
    document.getElementById('pieza-1'),
    document.getElementById('pieza-2'),
    document.getElementById('pieza-3')
];

let nivel = 1;
let tiempo = 0;
let tiempoMaximo = 27; // arranca en 27 segundos
let timerInterval;
let jugando = false;
let indiceActual = -1; // Nos va a decir qué imagen estamos jugando ahora

let piezasRotacion = [0, 0, 0, 0]; // Controla los grados de cada pieza
let piezaBloqueada = [false, false, false, false]; // Para la 'ayuda'
let imagenActual = new Image(); // Guarda la imagen para sacarle los filtros al ganar

// Banco de imágenes (Asegurate de tener estas 6 imágenes en tu carpeta assets)
const bancoImagenes = [
    'assets/blocka/blocka-1.jpg', 'assets/blocka/blocka-2.jpg', 'assets/blocka/blocka-3.jpg',
    'assets/blocka/blocka-4.jpg', 'assets/blocka/blocka-5.jpg', 'assets/blocka/blocka-6.jpg'
];

// ==========================================
// 2. CARGA DEL NIVEL Y RECORTES
// ==========================================
function cargarNivel() {
    jugando = false;
    tiempo = 0;
    temporizadorUI.innerText = tiempo;
    tiempoMaximoUI.innerText = tiempoMaximo;
    clearInterval(timerInterval);
    
    grillaBlocka.classList.add('inactivo');
    btnAyuda.disabled = true;
    btnComenzar.innerText = "Comenzar Nivel " + nivel;
    piezaBloqueada = [false, false, false, false];

    // Desordenar: Elegimos ángulos aleatorios de 90, 180 o 270 grados
    piezasRotacion = piezasRotacion.map(() => (Math.floor(Math.random() * 3) + 1) * 90);

    // Elegir imagen al azar
    // Solo sacamos una foto nueva si es un nivel nuevo
    if (indiceActual === -1) {
        indiceActual = Math.floor(Math.random() * bancoImagenes.length);
    
        imagenActual.onload = () => { dibujarPiezas(true); };
        imagenActual.src = bancoImagenes[indiceActual];
    } else {
        // Si es un REINTENTO, la imagen es la misma y ya está cargada
        dibujarPiezas(true);
    }
}

function dibujarPiezas(aplicarFiltros) {
    const mitad = imagenActual.width / 2; // Cortamos la imagen por la mitad
    
    // Coordenadas de recorte [X, Y] para las 4 piezas (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
    const coordenadas = [
        { x: 0, y: 0 }, { x: mitad, y: 0 },
        { x: 0, y: mitad }, { x: mitad, y: mitad }
    ];

    canvasList.forEach((canvas, index) => {
        canvas.width = mitad;
        canvas.height = mitad;
        const ctx = canvas.getContext('2d');
        
        // canvas: Recorta y dibuja el pedazo de imagen
        ctx.drawImage(imagenActual, coordenadas[index].x, coordenadas[index].y, mitad, mitad, 0, 0, mitad, mitad);
        
        // rotación CSS desordenada (o 0 si ya ganamos)
        canvas.style.transform = `rotate(${piezasRotacion[index]}deg)`;
        canvas.style.border = "none"; // Limpiar bordes de ayudas anteriores

        // filtro a los píxeles si estamos jugando
        if (aplicarFiltros) {
            aplicarFiltroSegunNivel(ctx, mitad, mitad);
        }
    });
}

// ==========================================
// 3. FILTROS POR NIVELES
// ==========================================
function aplicarFiltroSegunNivel(ctx, w, h) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];

        if (nivel === 1) {
            // Nivel 1: Escala de grises (Fórmula BT.601)
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = data[i+1] = data[i+2] = gray;
        } 
        else if (nivel === 2) {
            // Nivel 2: Brillo (+76 que equivale al 30% de 255)
            data[i] = Math.min(255, r + 76);
            data[i+1] = Math.min(255, g + 76);
            data[i+2] = Math.min(255, b + 76);
        } 
        else {
            // Nivel 3 en adelante: Negativo
            data[i] = 255 - r;
            data[i+1] = 255 - g;
            data[i+2] = 255 - b;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// ==========================================
// 4. CONTROLES Y ROTACIÓN
// ==========================================
canvasList.forEach((canvas, index) => {
    // Clic Izquierdo: Gira a la izquierda (-90deg)
    canvas.addEventListener('click', () => {
        if (!jugando || piezaBloqueada[index]) return;
        piezasRotacion[index] -= 90; 
        canvas.style.transform = `rotate(${piezasRotacion[index]}deg)`;
        verificarVictoria();
    });

    // Clic Derecho: Gira a la derecha (+90deg)
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Evita que se abra el menú de Chrome
        if (!jugando || piezaBloqueada[index]) return;
        piezasRotacion[index] += 90;
        canvas.style.transform = `rotate(${piezasRotacion[index]}deg)`;
        verificarVictoria();
    });
});

// ==========================================
// 5. LÓGICA DE PARTIDA (Extras incluidos)
// ==========================================
btnComenzar.addEventListener('click', () => {
    if (jugando) return;
    jugando = true;
    grillaBlocka.classList.remove('inactivo');
    btnAyuda.disabled = false;

    // Extra: Límite de tiempo
    timerInterval = setInterval(() => {
        tiempo++;
        temporizadorUI.innerText = tiempo;
        if (tiempo >= tiempoMaximo) {
            clearInterval(timerInterval);
            mostrarModal("¡Tiempo agotado!", "Reintentar", () => {
                cargarNivel(); 
            });
        }
    }, 500);
});

// Extra: Botón "Ayudita" (+5 segundos)
btnAyuda.addEventListener('click', () => {
    if (!jugando) return;
    
    // Buscamos qué piezas todavía están rotadas
    let desordenadas = [];
    piezasRotacion.forEach((rot, i) => {
        if (rot % 360 !== 0 && !piezaBloqueada[i]) desordenadas.push(i);
    });

    if (desordenadas.length > 0) {
        // Elegimos una al azar y la clavamos en 0 grados
        let elegida = desordenadas[Math.floor(Math.random() * desordenadas.length)];
        piezasRotacion[elegida] = 0; 
        canvasList[elegida].style.transform = `rotate(0deg)`;
        canvasList[elegida].style.border = "2px solid var(--color-secundario)";
        piezaBloqueada[elegida] = true;
        
        // Castigo: Sumar 5 segundos
        tiempo += 5;
        temporizadorUI.innerText = tiempo;
        verificarVictoria();
    }
});

function verificarVictoria() {
    // Si todos los ángulos son múltiplos de 360, la imagen está derecha
    if (piezasRotacion.every(rot => rot % 360 === 0)) {
        clearInterval(timerInterval);
        jugando = false;
        btnAyuda.disabled = true;
        
        // Le sacamos los filtros redibujando la imagen original limpia
        dibujarPiezas(false); 

     setTimeout(() => {
            //Borra la foto del arreglo SOLO CUANDO EL USUARIO GANA
            bancoImagenes.splice(indiceActual, 1);
            indiceActual = -1; // Reiniciamos para que el próximo nivel busque una nueva foto
            if (bancoImagenes.length > 0) {
                mostrarModal(`¡Nivel ${nivel}/6 completado en ${tiempo}s!`, "Siguiente Nivel", () => {
                    nivel++;
                    nivelUI.innerText = nivel;
                    tiempoMaximo = Math.max(5, tiempoMaximo - 5);
                    cargarNivel();
                });
            } else {
                // Si el arreglo está vacío (0), se terminó el juego completo
                mostrarModal(`¡FELICIDADES! Completaste todos los niveles.`, "Volver a jugar", () => {
                    window.location.reload(); // Recarga la página entera para resetear el juego
                });
            }
        }, 1000);
    }
}
function mostrarModal(mensaje, textoBoton, accionAlCerrar) {
    modalMensaje.innerText = mensaje;
    btnModalAccion.innerHTML = `<span>${textoBoton}</span>`;
    modalUI.classList.remove('oculto');
    
    // Al hacer clic, ocultamos y ejecutamos la acción (cargar el nivel)
    btnModalAccion.onclick = () => {
        modalUI.classList.add('oculto');
        if(accionAlCerrar) accionAlCerrar();
    };
}
// Inicializar el primer nivel al entrar a la página
cargarNivel();