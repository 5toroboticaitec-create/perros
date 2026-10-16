
const API = "https://dog.ceo/api";

const imagenPerro = document.getElementById("imagenPerro");
const cargando = document.getElementById("cargando");
const razaSelect = document.getElementById("raza");
const btnBuscar = document.getElementById("btnBuscar");
const btnNuevo = document.getElementById("btnNuevo");
const btnFavorito = document.getElementById("btnFavorito");

const nombreRaza = document.getElementById("nombreRaza");
const etiquetaRaza = document.getElementById("etiquetaRaza");
const descripcionRaza = document.getElementById("descripcionRaza");
const mensaje = document.getElementById("mensaje");

const galeriaFavoritos = document.getElementById("galeriaFavoritos");
const contadorFavoritos = document.getElementById("contadorFavoritos");

let imagenActual = "";
let razaActual = "";
let favoritos = cargarFavoritos();
let solicitudActual = 0;

// Traducciones para algunas razas comunes.
const nombresRazas = {
    affenpinscher: "Affenpinscher",
    african: "Perro africano",
    airedale: "Airedale terrier",
    akita: "Akita",
    australian: "Pastor australiano",
    beagle: "Beagle",
    boxer: "Bóxer",
    briard: "Pastor de Brie",
    bulldog: "Bulldog",
    chihuahua: "Chihuahua",
    collie: "Collie",
    corgi: "Corgi",
    dachshund: "Dachshund",
    dalmatian: "Dálmata",
    doberman: "Dóberman",
    eskimo: "Perro esquimal",
    germanshepherd: "Pastor alemán",
    goldenretriever: "Golden retriever",
    greatdane: "Gran danés",
    greyhound: "Galgo",
    husky: "Husky",
    labrador: "Labrador",
    maltese: "Bichón maltés",
    mastiff: "Mastín",
    papillon: "Papillón",
    pekinese: "Pekinés",
    pomeranian: "Pomerania",
    poodle: "Caniche",
    pug: "Carlino",
    retriever: "Retriever",
    rottweiler: "Rottweiler",
    samoyed: "Samoyedo",
    shiba: "Shiba",
    shihtzu: "Shih tzu",
    terrier: "Terrier",
    vizsla: "Vizsla",
    weimaraner: "Braco de Weimar",
    whippet: "Whippet",
    wolfhound: "Lebrel irlandés",
    yorkshire: "Yorkshire terrier"
};

function traducirRaza(raza) {
    if (!raza) return "Perro sorpresa";

    return raza
        .split("-")
        .map(parte => nombresRazas[parte] ||
            parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(" ");
}

function cargarFavoritos() {
    try {
        const guardados = JSON.parse(
            localStorage.getItem("dogworldFavoritos") || "[]"
        );

        return Array.isArray(guardados) ? guardados : [];
    } catch {
        return [];
    }
}

function guardarFavoritos() {
    try {
        localStorage.setItem(
            "dogworldFavoritos",
            JSON.stringify(favoritos)
        );
    } catch {
        mensaje.textContent =
            "No se pudieron guardar los favoritos en este navegador.";
    }
}

async function consultarAPI(url) {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error("No se pudo conectar con el servicio de imágenes.");
    }

    const datos = await respuesta.json();

    if (datos.status !== "success") {
        throw new Error("No se encontraron imágenes para esa raza.");
    }

    return datos.message;
}

async function cargarRazas() {
    try {
        const razas = await consultarAPI(`${API}/breeds/list/all`);

        Object.keys(razas).sort().forEach(raza => {
            const opcion = document.createElement("option");
            opcion.value = raza;
            opcion.textContent = traducirRaza(raza);
            razaSelect.appendChild(opcion);
        });
    } catch (error) {
        mensaje.textContent =
            "No se pudieron cargar las razas. Revisá tu conexión a internet.";
    }
}

async function cargarPerro() {
    const idSolicitud = ++solicitudActual;

    btnNuevo.disabled = true;
    btnBuscar.disabled = true;
    btnFavorito.disabled = true;

    imagenPerro.classList.add("oculto");
    cargando.classList.remove("oculto");
    cargando.textContent = "🐾 Buscando un perrito...";
    mensaje.textContent = "";

    try {
        const razaElegida = razaSelect.value;

        let url;

        if (razaElegida === "all") {
            url = `${API}/breeds/image/random`;
        } else {
            url = `${API}/breed/${encodeURIComponent(razaElegida)}/images/random`;
        }

        const imagen = await consultarAPI(url);

        if (idSolicitud !== solicitudActual) return;

        imagenActual = imagen;
        razaActual = obtenerRazaDeURL(imagen);

        imagenPerro.onload = () => {
            if (idSolicitud !== solicitudActual) return;

            cargando.classList.add("oculto");
            imagenPerro.classList.remove("oculto");
        };

        imagenPerro.onerror = () => {
            if (idSolicitud !== solicitudActual) return;

            cargando.textContent =
                "No se pudo mostrar la imagen. Intentá cargar otro perro.";
            cargando.classList.remove("oculto");
            imagenPerro.classList.add("oculto");
        };

        imagenPerro.alt = `Perro de raza ${traducirRaza(razaActual)}`;
        imagenPerro.src = imagen;

        nombreRaza.textContent = traducirRaza(razaActual);
        etiquetaRaza.textContent =
            razaElegida === "all" ? "RAZA ALEATORIA" : "RAZA SELECCIONADA";

        descripcionRaza.textContent =
            `¡Conocé a este adorable perro de raza ${traducirRaza(razaActual)}!`;

        actualizarBotonFavorito();
    } catch (error) {
        if (idSolicitud === solicitudActual) {
            cargando.textContent = error.message;
            cargando.classList.remove("oculto");
            mensaje.textContent = "Probá nuevamente en unos segundos.";
        }
    } finally {
        if (idSolicitud === solicitudActual) {
            btnNuevo.disabled = false;
            btnBuscar.disabled = false;
            btnFavorito.disabled = false;
        }
    }
}

function obtenerRazaDeURL(url) {
    const partes = url.split("/breeds/")[1];

    if (!partes) return "perro";

    return partes.split("/")[0].replaceAll("-", "-");
}

function actualizarBotonFavorito() {
    const guardado = favoritos.some(perro => perro.url === imagenActual);

    btnFavorito.textContent = guardado
        ? "♥ Quitar de favoritos"
        : "♡ Agregar a favoritos";
}

function alternarFavorito() {
    if (!imagenActual) return;

    const existe = favoritos.some(perro => perro.url === imagenActual);

    if (existe) {
        favoritos = favoritos.filter(perro => perro.url !== imagenActual);
        mensaje.textContent = "El perro se quitó de tus favoritos.";
    } else {
        favoritos.unshift({
            url: imagenActual,
            raza: razaActual
        });

        mensaje.textContent = "¡Perro guardado en tus favoritos! ♥";
    }

    guardarFavoritos();
    actualizarBotonFavorito();
    mostrarFavoritos();
}

function mostrarFavoritos() {
    contadorFavoritos.textContent =
        `${favoritos.length} ${favoritos.length === 1 ? "perro" : "perros"}`;

    galeriaFavoritos.innerHTML = "";

    if (favoritos.length === 0) {
        galeriaFavoritos.innerHTML = `
            <div class="vacio">
                <div>🐕</div>
                <h3>Todavía no tenés favoritos</h3>
                <p>Cuando encuentres un perro que te guste, guardalo con el botón de favoritos.</p>
            </div>
        `;
        return;
    }

    favoritos.forEach(perro => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";

        const imagen = document.createElement("img");
        imagen.src = perro.url;
        imagen.alt = `Perro ${traducirRaza(perro.raza)}`;
        imagen.loading = "lazy";

        imagen.onerror = () => {
            imagen.alt = "Imagen no disponible";
            imagen.style.opacity = "0.3";
        };

        const info = document.createElement("div");
        info.className = "tarjeta-info";

        const titulo = document.createElement("h3");
        titulo.textContent = traducirRaza(perro.raza);

        const boton = document.createElement("button");
        boton.textContent = "♥ Quitar de favoritos";

        boton.addEventListener("click", () => {
            favoritos = favoritos.filter(item => item.url !== perro.url);
            guardarFavoritos();
            mostrarFavoritos();
            actualizarBotonFavorito();
        });

        info.append(titulo, boton);
        tarjeta.append(imagen, info);
        galeriaFavoritos.appendChild(tarjeta);
    });
}

btnNuevo.addEventListener("click", cargarPerro);

btnBuscar.addEventListener("click", () => {
    cargarPerro();
});

btnFavorito.addEventListener("click", alternarFavorito);

razaSelect.addEventListener("change", () => {
    // La selección de raza se aplica al presionar "Buscar raza".
    mensaje.textContent = "Presioná «Buscar raza» para ver un perro de esta raza.";
});

cargarRazas();
mostrarFavoritos();
cargarPerro();
