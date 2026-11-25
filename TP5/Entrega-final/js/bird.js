/* ==========================================================
     1. Configuración (todos los números del juego en un solo lugar)
     2. Sprites y capas de parallax (SVG generados por código)
     3. Referencias al DOM y estado de la partida
     4. Ciclo de juego (bucle, física, generación de obstáculos)
     5. Colisiones
     6. Dibujado (parallax, tubos, entidades, pelota)
     7. Interfaz (HUD, mensajes, efectos)
     8. Controles (teclado, mouse, botones)
   ========================================================== */
   "use strict";

   (function () {
   
     /* ========================================================
        1. CONFIGURACIÓN
        ======================================================== */
     const CONFIG = {
       // Tamaño "lógico" de la escena. Se escala por CSS al tamaño real.
       ancho: 800,
       alto: 500,
       alturaSuelo: 80,
   
       // La pelota avanza siempre a la misma velocidad (px por segundo)
       velocidadMundo: 190,
   
       // Física vertical
       gravedad: 1500,
       impulso: -430,          // velocidad hacia arriba al patear
       velocidadMaxCaida: 650,
   
       pelota: { x: 200, radioVisual: 22, radioHitbox: 17 },
   
       tubo: {
         ancho: 72,
         saliente: 8,          // cuánto sobresale el borde del poste
         altoBorde: 26,
         separacionMin: 260,   // distancia horizontal ENTRE tubos: variable
         separacionMax: 400,
         huecoInicial: 190,    // hueco vertical al empezar
         huecoMinimo: 110,     // el hueco nunca baja de acá
         reduccionPorTubo: 6,  // cuánto se achica por cada tubo creado
         margenVertical: 35,
         cambioMaxAltura: 170  // máx. diferencia de altura entre dos huecos seguidos
       },
   
       vidasIniciales: 3,
       invulnerabilidadSeg: 1.5,
       puntosPorTubo: 1,
       puntosPorMoneda: 5,
   
       gaviota: { radio: 20, velocidadExtra: 60, probabilidad: 0.35 },
       moneda: { radio: 16, probabilidad: 0.40 }
     };
   
     const CLAVE_MEJOR = "flappyFutbolMejorPuntaje";
     const ZONA_JUGABLE = CONFIG.alto - CONFIG.alturaSuelo;
   
     /* ========================================================
        2. SPRITES Y CAPAS (SVG -> data URI)
        Todo el arte se dibuja con código, así no hace falta
        subir imágenes al repositorio.
        ======================================================== */
   
     /** Convierte el contenido de un SVG en un valor válido para background-image. */
     function svgAUrl(contenido, ancho, alto) {
       const svg =
         `<svg xmlns='http://www.w3.org/2000/svg' width='${ancho}' height='${alto}' viewBox='0 0 ${ancho} ${alto}'>` +
         `${contenido}</svg>`;
       return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
     }
   
     /** Puntos de una estrella (se usa para la explosión y la moneda). */
     function puntosEstrella(cx, cy, rExt, rInt, puntas) {
       const puntos = [];
       for (let i = 0; i < puntas * 2; i++) {
         const radio = i % 2 === 0 ? rExt : rInt;
         const angulo = (Math.PI * i) / puntas;
         puntos.push(`${(cx + radio * Math.cos(angulo)).toFixed(1)},${(cy + radio * Math.sin(angulo)).toFixed(1)}`);
       }
       return puntos.join(" ");
     }
   
     /* --- Tipos de pelota (opciones del selector) --- */
     const TIPOS_PELOTA = {
       clasica: { nombre: "Clásica", base: "#ffffff", detalle: "#222222" },
       dorada:  { nombre: "Dorada",  base: "#f7c948", detalle: "#7a5200" },
       naranja: { nombre: "Naranja", base: "#ff8a3d", detalle: "#4a1f00" },
       azul:    { nombre: "Azul",    base: "#5aa9ff", detalle: "#0b2a55" }
     };
   
     function crearPelota(tipo) {
       const { base, detalle } = TIPOS_PELOTA[tipo];
       return svgAUrl(
         `<circle cx='22' cy='22' r='20' fill='${base}' stroke='#1b1b1b' stroke-width='2'/>` +
         `<polygon points='22,13 30,19 27,29 17,29 14,19' fill='${detalle}'/>` +
         `<path d='M22 13V3M30 19L40 15M27 29L34 38M17 29L10 38M14 19L4 15' stroke='${detalle}' stroke-width='2' fill='none'/>`,
         44, 44
       );
     }
   
     /* --- Spritesheet de la gaviota: 4 cuadros de 64x48 (aleteo) --- */
     function crearSpriteGaviota() {
       const puntaAla = [4, 16, 42, 16]; // altura de la punta del ala en cada cuadro
       let cuadros = "";
       puntaAla.forEach((punta, i) => {
         cuadros +=
           `<g transform='translate(${i * 64},0)'>` +
           `<polygon points='50,28 62,23 62,33' fill='#d9dee5'/>` +                       // cola
           `<ellipse cx='34' cy='28' rx='17' ry='9' fill='#ffffff' stroke='#8a94a3' stroke-width='1.5'/>` + // cuerpo
           `<circle cx='15' cy='24' r='7' fill='#ffffff' stroke='#8a94a3' stroke-width='1.5'/>` +          // cabeza
           `<polygon points='9,23 1,27 9,28' fill='#ff9f1c'/>` +                          // pico
           `<circle cx='13' cy='22' r='1.6' fill='#111'/>` +                              // ojo
           `<polygon points='26,26 40,${punta} 48,26' fill='#eef2f7' stroke='#8a94a3' stroke-width='1.5'/>` + // ala
           `</g>`;
       });
       return svgAUrl(cuadros, 256, 48);
     }
   
     /* --- Spritesheet de la moneda: 6 cuadros de 40x40 (giro) --- */
     function crearSpriteMoneda() {
       const anchos = [18, 14, 8, 3, 8, 14]; // radio horizontal: simula que gira
       let cuadros = "";
       anchos.forEach((rx, i) => {
         cuadros +=
           `<g transform='translate(${i * 40 + 20},20)'>` +
           `<ellipse rx='${rx}' ry='18' fill='#f5c542' stroke='#b8860b' stroke-width='2'/>` +
           (rx > 8
             ? `<polygon points='${puntosEstrella(0, 0, 10, 4.5, 5)}' fill='#b8860b' transform='scale(${rx / 18},1)'/>`
             : "") +
           `</g>`;
       });
       return svgAUrl(cuadros, 240, 40);
     }
   
     /* --- Spritesheet de la explosión: 6 cuadros de 96x96 --- */
     function crearSpriteExplosion() {
       let cuadros = "";
       for (let i = 0; i < 6; i++) {
         const cx = i * 96 + 48;
         const radio = 14 + i * 6.5;
         const opacidad = (1 - i * 0.14).toFixed(2);
         cuadros +=
           `<g opacity='${opacidad}'>` +
           `<polygon points='${puntosEstrella(cx, 48, radio, radio * 0.55, 10)}' fill='#ff6b1a' stroke='#b32d00' stroke-width='2'/>` +
           `<polygon points='${puntosEstrella(cx, 48, radio * 0.6, radio * 0.3, 8)}' fill='#ffd400'/>` +
           (i < 3 ? `<circle cx='${cx}' cy='48' r='${8 - i * 2}' fill='#fff'/>` : "") +
           `</g>`;
       }
       return svgAUrl(cuadros, 576, 96);
     }
   
     /* --- Capas del parallax: cada una es un tile horizontal repetible --- */
   
     // Capa 1: nubes (la más lejana)
     function crearCapaNubes() {
       const nube = (cx, cy, s) =>
         `<g fill='#fff' opacity='.85'>` +
         `<ellipse cx='${cx}' cy='${cy}' rx='${50 * s}' ry='${18 * s}'/>` +
         `<ellipse cx='${cx - 30 * s}' cy='${cy + 6 * s}' rx='${30 * s}' ry='${14 * s}'/>` +
         `<ellipse cx='${cx + 32 * s}' cy='${cy + 6 * s}' rx='${34 * s}' ry='${14 * s}'/></g>`;
       return { url: svgAUrl(nube(120, 60, 1) + nube(360, 120, 0.7) + nube(600, 50, 0.9), 800, 200), ancho: 800, alto: 200 };
     }
   
     // Capa 2: edificios y reflectores del estadio
     function crearCapaCiudad() {
       const edificios = [[10, 60, 90], [80, 40, 130], [130, 70, 70], [210, 50, 110], [270, 80, 60],
                          [360, 40, 140], [410, 70, 90], [490, 50, 120], [550, 70, 80]];
       let contenido = edificios.map(([x, w, h]) => `<rect x='${x}' y='${180 - h}' width='${w}' height='${h}' fill='#7aa7cc'/>`).join("");
       contenido += `<rect x='618' y='20' width='6' height='160' fill='#5f84a3'/>` +
                    `<rect x='606' y='12' width='30' height='18' fill='#fff6c2' stroke='#5f84a3' stroke-width='2'/>`;
       return { url: svgAUrl(contenido, 640, 180), ancho: 640, alto: 180 };
     }
   
     // Capa 3: tribuna con hinchas
     function crearCapaTribuna() {
       const colores = ["#e63946", "#ffd166", "#f1faee", "#4cc9f0", "#ff9f1c"];
       let contenido = `<rect width='400' height='120' fill='#4b5d7a'/><rect width='400' height='8' fill='#2f3b52'/>`;
       for (let fila = 0; fila < 6; fila++) {
         for (let col = 0; col < 20; col++) {
           contenido += `<circle cx='${10 + col * 20}' cy='${24 + fila * 17}' r='6' fill='${colores[(col + fila * 2) % colores.length]}'/>`;
         }
       }
       return { url: svgAUrl(contenido, 400, 120), ancho: 400, alto: 120 };
     }
   
     // Capa 4: vallas publicitarias
     function crearCapaVallas() {
       const colores = ["#e63946", "#1d3557", "#f4a261"];
       let contenido = "";
       colores.forEach((color, i) => {
         contenido += `<rect x='${i * 100}' y='0' width='100' height='44' fill='${color}'/>` +
                      `<rect x='${i * 100 + 15}' y='14' width='70' height='8' rx='3' fill='#fff' opacity='.9'/>` +
                      `<rect x='${i * 100 + 30}' y='28' width='40' height='6' rx='3' fill='#fff' opacity='.7'/>`;
       });
       return { url: svgAUrl(contenido, 300, 44), ancho: 300, alto: 44 };
     }
   
     // Capa 5: césped (se mueve a la misma velocidad que los tubos)
     function crearCapaSuelo() {
       const contenido = `<rect width='40' height='80' fill='#43a047'/><rect x='40' width='40' height='80' fill='#4caf50'/>` +
                         `<rect width='80' height='6' fill='#2e7d32'/>`;
       return { url: svgAUrl(contenido, 80, 80), ancho: 80, alto: 80 };
     }
   
     const CAPAS = {
       nubes: crearCapaNubes(),
       ciudad: crearCapaCiudad(),
       tribuna: crearCapaTribuna(),
       vallas: crearCapaVallas(),
       suelo: crearCapaSuelo()
     };
   
     /* ========================================================
        3. DOM Y ESTADO
        ======================================================== */
     const $ = (id) => document.getElementById(id);
   
     const el = {
       tablero: $("tablero"),
       escena: $("escena"),
       tubos: $("tubos"),
       entidades: $("entidades"),
       efectos: $("efectos"),
       pelota: $("pelota"),
       pelotaGiro: $("pelota-giro"),
       pelotaCuerpo: $("pelota-cuerpo"),
       explosion: $("explosion"),
       mensaje: $("mensaje"),
       mensajeTitulo: $("mensaje-titulo"),
       mensajeTexto: $("mensaje-texto"),
       tiempo: $("timer"),
       puntos: $("puntos"),
       vidas: $("vidas"),
       mejor: $("mejor"),
       selectPelota: $("tipoPelota"),
       btnComenzar: $("btn-comenzar"),
       btnReiniciar: $("btn-reiniciar")
     };
   
     // Cada capa guarda su nodo y su factor de velocidad (0 = quieta, 1 = igual que el mundo)
     const capasParallax = Array.from(document.querySelectorAll(".capa")).map((nodo) => ({
       nodo,
       factor: parseFloat(nodo.dataset.factor)
     }));
   
     let juego = null;        // datos de la partida actual
     let mejorPuntaje = 0;
     let idAnimacion = 0;     // id del requestAnimationFrame
     let tiempoAnterior = 0;
     let segundoMostrado = -1;
   
     /** Crea el estado inicial de una partida. */
     function nuevaPartida(fase) {
       return {
         fase,                       // "inicio" | "jugando" | "terminado"
         camara: 0,                  // distancia total recorrida (px). Mueve todo el escenario
         tiempo: 0,
         puntos: 0,
         vidas: CONFIG.vidasIniciales,
         pelota: { y: ZONA_JUGABLE / 2, vy: 0 },
         invulnerableHasta: 0,
         tubos: [],
         items: [],
         proximoTuboX: 650,          // posición (en el mundo) del próximo tubo a crear
         tubosCreados: 0,
         ultimoCentro: ZONA_JUGABLE / 2,
         ultimoTuboX: null,
         finTs: 0
       };
     }
   
     const aleatorio = (min, max) => min + Math.random() * (max - min);
     const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));
   
     /* ========================================================
        4. CICLO DE JUEGO
        ======================================================== */
   
     function iniciarPartida() {
       cancelAnimationFrame(idAnimacion);
   
       // Limpiar lo que quedó de la partida anterior
       el.tubos.innerHTML = "";
       el.entidades.innerHTML = "";
       el.efectos.innerHTML = "";
       el.explosion.classList.remove("explosion--activa");
       el.pelota.classList.remove("pelota--invulnerable");
       el.pelotaCuerpo.className = "pelota__cuerpo";
       el.pelotaGiro.classList.add("pelota__giro--girando");
   
       juego = nuevaPartida("jugando");
       juego.pelota.vy = CONFIG.impulso * 0.7; // pequeño envión inicial
       segundoMostrado = -1;
   
       el.mensaje.hidden = true;
       actualizarHUD();
       actualizarBotones();
   
       tiempoAnterior = performance.now();
       idAnimacion = requestAnimationFrame(bucle);
     }
   
     function bucle(ahora) {
       if (juego.fase !== "jugando") return;
   
       // dt en segundos; se limita para que un tirón no "teletransporte" la pelota
       const dt = Math.min((ahora - tiempoAnterior) / 1000, 0.05);
       tiempoAnterior = ahora;
   
       actualizar(dt);
       if (juego.fase === "jugando") {
         dibujar();
         idAnimacion = requestAnimationFrame(bucle);
       }
     }
   
     function actualizar(dt) {
       // El escenario avanza a velocidad constante
       juego.camara += CONFIG.velocidadMundo * dt;
       juego.tiempo += dt;
   
       // Física de la pelota
       const p = juego.pelota;
       p.vy = Math.min(p.vy + CONFIG.gravedad * dt, CONFIG.velocidadMaxCaida);
       p.y += p.vy * dt;
   
       // El techo frena la pelota pero no la elimina
       if (p.y < CONFIG.pelota.radioHitbox) {
         p.y = CONFIG.pelota.radioHitbox;
         p.vy = 0;
       }
   
       // Fin de la invulnerabilidad tras el golpe de una gaviota
       if (juego.invulnerableHasta && juego.tiempo >= juego.invulnerableHasta) {
         juego.invulnerableHasta = 0;
         el.pelota.classList.remove("pelota--invulnerable");
       }
   
       generarTubos();
       moverItems(dt);
       detectarColisiones();
       limpiarFueraDePantalla();
       actualizarHUD();
     }
   
     /* --- Generación de tubos --- */
   
     function generarTubos() {
       const limiteDerecho = juego.camara + CONFIG.ancho + 100;
       while (juego.proximoTuboX < limiteDerecho) {
         crearTubo(juego.proximoTuboX);
         // Distancia horizontal distinta cada vez
         juego.proximoTuboX += aleatorio(CONFIG.tubo.separacionMin, CONFIG.tubo.separacionMax);
       }
     }
   
     function crearTubo(x) {
       const c = CONFIG.tubo;
   
       // El hueco se achica a medida que se crean más tubos, hasta un mínimo
       const hueco = Math.max(c.huecoMinimo, c.huecoInicial - c.reduccionPorTubo * juego.tubosCreados);
   
       // La altura del hueco varía, pero sin saltos imposibles respecto al tubo anterior
       const minCentro = c.margenVertical + hueco / 2;
       const maxCentro = ZONA_JUGABLE - c.margenVertical - hueco / 2;
       const desde = Math.max(minCentro, juego.ultimoCentro - c.cambioMaxAltura);
       const hasta = Math.min(maxCentro, juego.ultimoCentro + c.cambioMaxAltura);
       const centro = aleatorio(desde, hasta);
       const huecoY = centro - hueco / 2;
   
       // DOM: un contenedor que se desplaza + poste de arriba y poste de abajo
       const par = document.createElement("div");
       par.className = "tubo-par";
       par.innerHTML =
         `<div class="tubo tubo--arriba" style="top:0;height:${huecoY}px"><div class="tubo__borde"></div></div>` +
         `<div class="tubo tubo--abajo" style="top:${huecoY + hueco}px;bottom:0"><div class="tubo__borde"></div></div>`;
       el.tubos.appendChild(par);
   
       // Entre el tubo anterior y este aparece un elemento animado (gaviota o moneda)
       if (juego.ultimoTuboX !== null) {
         crearItemEntreTubos(juego.ultimoTuboX, juego.ultimoCentro, x, centro);
       }
   
       juego.tubos.push({ x, huecoY, hueco, puntuado: false, nodo: par });
       juego.tubosCreados++;
       juego.ultimoCentro = centro;
       juego.ultimoTuboX = x;
     }
   
     /* --- Elementos animados: gaviotas (restan vida) y monedas (suman puntos) --- */
   
     function crearItemEntreTubos(xAnterior, centroAnterior, xNuevo, centroNuevo) {
       const sorteo = Math.random();
       let tipo = null;
       if (sorteo < CONFIG.moneda.probabilidad) tipo = "moneda";
       else if (sorteo < CONFIG.moneda.probabilidad + CONFIG.gaviota.probabilidad) tipo = "gaviota";
       if (!tipo) return;
   
       const x = (xAnterior + xNuevo) / 2 + CONFIG.tubo.ancho / 2;
       const yCamino = (centroAnterior + centroNuevo) / 2; // altura aproximada del recorrido
       const dispersion = tipo === "gaviota" ? 70 : 40;
       const y = limitar(yCamino + aleatorio(-dispersion, dispersion), 45, ZONA_JUGABLE - 45);
   
       const nodo = document.createElement("div");
       nodo.className = `entidad entidad--${tipo}`;
       el.entidades.appendChild(nodo);
   
       juego.items.push({
         tipo, x, y, y0: y, nodo,
         radio: CONFIG[tipo].radio,
         edad: 0,
         fase: Math.random() * Math.PI * 2,
         activo: true
       });
     }
   
     function moverItems(dt) {
       for (const item of juego.items) {
         item.edad += dt;
         if (item.tipo === "gaviota") {
           // La gaviota viene hacia la pelota y ondula verticalmente
           item.x -= CONFIG.gaviota.velocidadExtra * dt;
           item.y = item.y0 + Math.sin(item.edad * 3 + item.fase) * 22;
         }
       }
     }
   
     function limpiarFueraDePantalla() {
       juego.tubos = juego.tubos.filter((t) => {
         const fuera = t.x + CONFIG.tubo.ancho + 40 < juego.camara;
         if (fuera) t.nodo.remove();
         return !fuera;
       });
       juego.items = juego.items.filter((it) => {
         const fuera = it.x + 60 < juego.camara;
         if (fuera) it.nodo.remove();
         return !fuera;
       });
     }
   
     /* ========================================================
        5. COLISIONES
        ======================================================== */
   
     /** ¿Se superponen un círculo y un rectángulo? */
     function circuloContraRect(cx, cy, r, rx, ry, rw, rh) {
       const cercanoX = limitar(cx, rx, rx + rw);
       const cercanoY = limitar(cy, ry, ry + rh);
       const dx = cx - cercanoX;
       const dy = cy - cercanoY;
       return dx * dx + dy * dy < r * r;
     }
   
     function chocaConTubo(t, bx, by, r) {
       const c = CONFIG.tubo;
       const yAbajo = t.huecoY + t.hueco;
       return (
         circuloContraRect(bx, by, r, t.x, 0, c.ancho, t.huecoY) ||                                   // poste de arriba
         circuloContraRect(bx, by, r, t.x, yAbajo, c.ancho, CONFIG.alto) ||                           // poste de abajo
         circuloContraRect(bx, by, r, t.x - c.saliente, t.huecoY - c.altoBorde, c.ancho + 2 * c.saliente, c.altoBorde) || // borde de arriba
         circuloContraRect(bx, by, r, t.x - c.saliente, yAbajo, c.ancho + 2 * c.saliente, c.altoBorde)                    // borde de abajo
       );
     }
   
     function detectarColisiones() {
       const r = CONFIG.pelota.radioHitbox;
       const bx = juego.camara + CONFIG.pelota.x; // posición de la pelota en coordenadas del mundo
       const by = juego.pelota.y;
   
       // Suelo: fin de la partida
       if (by + r >= ZONA_JUGABLE) {
         juego.pelota.y = ZONA_JUGABLE - r;
         terminarPartida("suelo");
         return;
       }
   
       for (const t of juego.tubos) {
         // Tubo: fin de la partida con animación de choque
         if (chocaConTubo(t, bx, by, r)) {
           terminarPartida("tubo", t);
           return;
         }
         // Pasó el tubo: suma punto
         if (!t.puntuado && bx > t.x + CONFIG.tubo.ancho) {
           t.puntuado = true;
           juego.puntos += CONFIG.puntosPorTubo;
           mostrarFlotante(`+${CONFIG.puntosPorTubo}`, CONFIG.pelota.x, by - 30, "flotante--punto");
         }
       }
   
       for (const item of juego.items) {
         if (!item.activo) continue;
         const dx = bx - item.x;
         const dy = by - item.y;
         const distanciaMinima = r + item.radio;
         if (dx * dx + dy * dy >= distanciaMinima * distanciaMinima) continue;
   
         if (item.tipo === "moneda") {
           recogerMoneda(item);
         } else if (juego.invulnerableHasta === 0) {
           golpeConGaviota(item);
           if (juego.fase !== "jugando") return;
         }
       }
     }
   
     /** La moneda SUMA puntos y desaparece. */
     function recogerMoneda(item) {
       item.activo = false;
       item.nodo.remove();
       juego.puntos += CONFIG.puntosPorMoneda;
       mostrarFlotante(`+${CONFIG.puntosPorMoneda}`, item.x - juego.camara, item.y - 20, "flotante--moneda");
     }
   
     /** La gaviota RESTA una vida, pero el juego sigue (salvo que no queden vidas). */
     function golpeConGaviota(item) {
       item.activo = false;
       item.nodo.classList.add("entidad--golpeada");
       juego.vidas--;
       mostrarFlotante("-1 vida", CONFIG.pelota.x, juego.pelota.y - 30, "flotante--dano");
   
       if (juego.vidas <= 0) {
         terminarPartida("gaviota");
         return;
       }
       juego.invulnerableHasta = juego.tiempo + CONFIG.invulnerabilidadSeg;
       el.pelota.classList.add("pelota--invulnerable");
       reproducir(el.pelotaCuerpo, "pelota__cuerpo--golpe");
     }
   
     function terminarPartida(causa, tuboGolpeado) {
       juego.fase = "terminado";
       juego.finTs = performance.now();
       cancelAnimationFrame(idAnimacion);
   
       // Animaciones del choque: el tubo se sacude y la pelota explota
       if (tuboGolpeado) tuboGolpeado.nodo.classList.add("tubo-par--golpeado");
       el.pelota.classList.remove("pelota--invulnerable");
       el.pelotaGiro.classList.remove("pelota__giro--girando");
       el.pelotaCuerpo.className = "pelota__cuerpo pelota__cuerpo--explota";
       dibujar();
       el.explosion.style.transform = `translate3d(${CONFIG.pelota.x}px, ${juego.pelota.y}px, 0)`;
       reproducir(el.explosion, "explosion--activa");
   
       // Puntaje máximo guardado
       if (juego.puntos > mejorPuntaje) {
         mejorPuntaje = juego.puntos;
         try { localStorage.setItem(CLAVE_MEJOR, String(mejorPuntaje)); } catch (e) { /* sin almacenamiento */ }
       }
       actualizarHUD();
       actualizarBotones();
   
       const motivos = {
         tubo: "Chocaste contra un poste.",
         suelo: "La pelota cayó al césped.",
         gaviota: "Las gaviotas te dejaron sin vidas."
       };
       setTimeout(() => {
         if (juego.fase !== "terminado") return;
         mostrarMensaje(
           "¡Fin del partido!",
           `${motivos[causa]} Puntos: ${juego.puntos}. Mejor puntaje: ${mejorPuntaje}. Presioná Reiniciar o hacé clic para jugar de nuevo.`
         );
       }, 650);
     }
   
     /* ========================================================
        6. DIBUJADO
        ======================================================== */
   
     function dibujar() {
       // Parallax: cada capa se desplaza la distancia recorrida × su factor.
       // Capas lejanas (factor chico) se mueven lento; el césped (factor 1)
       // se mueve igual que los tubos, por eso se ve "pegado" al mundo.
       for (const capa of capasParallax) {
         capa.nodo.style.backgroundPositionX = `${-juego.camara * capa.factor}px`;
       }
   
       for (const t of juego.tubos) {
         t.nodo.style.transform = `translate3d(${t.x - juego.camara}px, 0, 0)`;
       }
   
       for (const item of juego.items) {
         item.nodo.style.transform = `translate3d(${item.x - juego.camara}px, ${item.y}px, 0)`;
       }
   
       // La pelota se inclina según su velocidad vertical (sube = hacia arriba)
       const angulo = limitar(juego.pelota.vy * 0.08, -25, 60);
       el.pelota.style.transform =
         `translate3d(${CONFIG.pelota.x}px, ${juego.pelota.y}px, 0) rotate(${angulo}deg)`;
     }
   
     /* ========================================================
        7. INTERFAZ
        ======================================================== */
   
     /** Reinicia una animación CSS de un solo uso sobre un elemento. */
     function reproducir(nodo, clase) {
       nodo.classList.remove(clase);
       void nodo.offsetWidth; // fuerza el reflow para que la animación arranque de nuevo
       nodo.classList.add(clase);
     }
   
     function mostrarFlotante(texto, x, y, clase) {
       const nodo = document.createElement("div");
       nodo.className = `flotante ${clase}`;
       nodo.textContent = texto;
       nodo.style.left = `${x}px`;
       nodo.style.top = `${y}px`;
       nodo.addEventListener("animationend", () => nodo.remove());
       el.efectos.appendChild(nodo);
     }
   
     function mostrarMensaje(titulo, texto) {
       el.mensajeTitulo.textContent = titulo;
       el.mensajeTexto.textContent = texto;
       el.mensaje.hidden = false;
     }
   
     function formatearTiempo(segundos) {
       const m = String(Math.floor(segundos / 60)).padStart(2, "0");
       const s = String(Math.floor(segundos % 60)).padStart(2, "0");
       return `${m}:${s}`;
     }
   
     function actualizarHUD() {
       const segundo = Math.floor(juego.tiempo);
       if (segundo !== segundoMostrado) {
         segundoMostrado = segundo;
         el.tiempo.textContent = formatearTiempo(juego.tiempo);
       }
       el.puntos.textContent = juego.puntos;
       el.mejor.textContent = mejorPuntaje;
   
       let corazones = "";
       for (let i = 0; i < CONFIG.vidasIniciales; i++) {
         corazones += `<i class="ph-fill ph-heart${i >= juego.vidas ? " vida--perdida" : ""}"></i>`;
       }
       el.vidas.innerHTML = corazones;
       el.vidas.setAttribute("aria-label", `${juego.vidas} vidas`);
     }
   
     function actualizarBotones() {
       el.btnComenzar.disabled = juego.fase === "jugando";
       el.btnReiniciar.disabled = juego.fase === "inicio";
     }
   
     /** Escala la escena de 800x500 al ancho real disponible. */
     function ajustarEscala() {
       const escala = el.tablero.clientWidth / CONFIG.ancho;
       el.escena.style.transform = `scale(${escala})`;
     }
   
     function aplicarTipoPelota(tipo) {
       el.escena.style.setProperty("--sprite-pelota", crearPelota(tipo));
     }
   
     /** Pantalla inicial: asigna los sprites y deja la pelota flotando. */
     function prepararEscena() {
       // Sprites como variables CSS (las animaciones keyframe están en runner.css)
       el.escena.style.setProperty("--sprite-gaviota", crearSpriteGaviota());
       el.escena.style.setProperty("--sprite-moneda", crearSpriteMoneda());
       el.escena.style.setProperty("--sprite-explosion", crearSpriteExplosion());
   
       // Capas de parallax
       for (const capa of capasParallax) {
         const datos = CAPAS[capa.nodo.dataset.capa];
         capa.nodo.style.backgroundImage = datos.url;
         capa.nodo.style.backgroundSize = `${datos.ancho}px ${datos.alto}px`;
         capa.nodo.style.height = `${datos.alto}px`;
       }
   
       // Selector de pelota
       for (const [clave, tipo] of Object.entries(TIPOS_PELOTA)) {
         el.selectPelota.add(new Option(tipo.nombre, clave));
       }
       aplicarTipoPelota(el.selectPelota.value);
   
       try { mejorPuntaje = Number(localStorage.getItem(CLAVE_MEJOR)) || 0; } catch (e) { mejorPuntaje = 0; }
   
       juego = nuevaPartida("inicio");
       el.pelotaCuerpo.classList.add("pelota__cuerpo--flotar");
       dibujar();
       actualizarHUD();
       actualizarBotones();
       mostrarMensaje(
         "Flappy Fútbol",
         "Presioná Comenzar o hacé clic en la pantalla. Usá Espacio, la flecha arriba o el clic para patear."
       );
       ajustarEscala();
     }
   
     /* ========================================================
        8. CONTROLES
        ======================================================== */
   
     function impulsar() {
       juego.pelota.vy = CONFIG.impulso;
       reproducir(el.pelotaCuerpo, "pelota__cuerpo--impulso");
     }
   
     /** Clic o toque sobre la escena: impulsa, o empieza / reinicia según la fase. */
     function accionPrincipal() {
       if (juego.fase === "jugando") {
         impulsar();
       } else if (juego.fase === "inicio") {
         iniciarPartida();
       } else if (juego.fase === "terminado" && performance.now() - juego.finTs > 600) {
         iniciarPartida();
       }
     }
   
     function esCampoDeTexto(nodo) {
       return nodo.matches && nodo.matches("textarea, input, select");
     }
   
     document.addEventListener("keydown", (e) => {
       const esTeclaDeVuelo = e.code === "Space" || e.code === "ArrowUp";
       // Solo se usa el teclado mientras se juega y sin escribir una reseña
       if (!esTeclaDeVuelo || juego.fase !== "jugando" || esCampoDeTexto(e.target)) return;
       e.preventDefault(); // evita que la página haga scroll
       if (!e.repeat) impulsar();
     });
   
     // Evita que Espacio "haga clic" en un botón que quedó con el foco
     document.addEventListener("keyup", (e) => {
       if (e.code === "Space" && juego.fase === "jugando" && !esCampoDeTexto(e.target)) e.preventDefault();
     });
   
     el.escena.addEventListener("pointerdown", (e) => {
       e.preventDefault();
       accionPrincipal();
     });
   
     el.btnComenzar.addEventListener("click", (e) => {
       e.currentTarget.blur();
       iniciarPartida();
     });
   
     el.btnReiniciar.addEventListener("click", (e) => {
       e.currentTarget.blur();
       iniciarPartida();
     });
   
     el.selectPelota.addEventListener("change", (e) => {
       aplicarTipoPelota(e.target.value);
       e.target.blur();
     });
   
     // Las animaciones de un solo uso se limpian al terminar para poder repetirlas
     el.pelotaCuerpo.addEventListener("animationend", () => {
       el.pelotaCuerpo.classList.remove("pelota__cuerpo--impulso", "pelota__cuerpo--golpe");
     });
   
     new ResizeObserver(ajustarEscala).observe(el.tablero);
   
     prepararEscena();
   
   })();