/* ===== Configuración ===== */
const RUTA_MODELO = 'modelo/model.json';
const RUTA_METADATA = 'modelo/metadata.json';
const UMBRAL = 0.6; // por debajo de esta confianza no afirmamos nada

// Las claves son los nombres exactos de las clases del entrenamiento
// (metadata.json: metal, papel, plastico)
const INFO = {
    metal: {
        nombre: 'Metal',
        contenedor: 'gris',
        texto: 'Enjuagá las latas y envases, aplastalos si podés y llevalos al contenedor gris.',
    },
    papel: {
        nombre: 'Papel',
        contenedor: 'azul',
        texto: 'Tiene que estar limpio y seco. Si está engrasado o muy sucio, no se recicla. Va al contenedor azul.',
    },
    plastico: {
        nombre: 'Plástico',
        contenedor: 'amarillo',
        texto: 'Enjuagalo y aplastalo antes de llevarlo al contenedor amarillo.',
    },
};

/* ===== Elementos ===== */
const inputGaleria = document.getElementById('input_galeria');
const inputCamara = document.getElementById('input_camara');
const vistaPrevia = document.getElementById('vista_previa');
const btnAnalizar = document.getElementById('analizar_foto');
const seccionResultado = document.getElementById('resultado');
const elTipo = document.getElementById('resultado_tipo');
const elConfianza = document.getElementById('resultado_confianza');
const elReciclar = document.getElementById('resultado_reciclar');

let modelo = null;
let hayImagen = false;
let urlActual = null;

function actualizarBoton() {
    btnAnalizar.disabled = !(modelo && hayImagen);
}

/* ===== Modelo (Teachable Machine) ===== */
async function cargarModelo() {
    btnAnalizar.textContent = 'Cargando modelo...';
    try {
        modelo = await tmImage.load(RUTA_MODELO, RUTA_METADATA);
        btnAnalizar.textContent = 'Analizar foto';
    } catch (err) {
        console.error('No se pudo cargar el modelo:', err);
        btnAnalizar.textContent = 'Error al cargar el modelo';
    }
    actualizarBoton();
}

/* ===== Foto ===== */
function mostrarFoto(archivo) {
    if (!archivo) return;
    if (urlActual) URL.revokeObjectURL(urlActual);
    hayImagen = false;
    actualizarBoton();
    limpiarResultado();
    urlActual = URL.createObjectURL(archivo);
    vistaPrevia.onload = () => {
        hayImagen = true;
        actualizarBoton();
    };
    vistaPrevia.src = urlActual;
    vistaPrevia.hidden = false;
}

[inputGaleria, inputCamara].forEach((input) => {
    input.addEventListener('change', (e) => {
        mostrarFoto(e.target.files[0]);
        e.target.value = ''; // permite elegir la misma foto dos veces seguidas
    });
});

/* ===== Clasificación ===== */
async function analizar() {
    btnAnalizar.disabled = true;
    btnAnalizar.textContent = 'Analizando...';
    try {
        // devuelve [{ className, probability }, ...] en el orden del entrenamiento
        const predicciones = await modelo.predict(vistaPrevia);
        const mejor = predicciones.reduce((a, b) => (b.probability > a.probability ? b : a));
        mostrarResultado(mejor.className, mejor.probability);
    } catch (err) {
        console.error(err);
        elTipo.textContent = 'error';
        elConfianza.textContent = 'No se pudo analizar la imagen. Probá con otra.';
        elReciclar.textContent = '';
    }
    btnAnalizar.textContent = 'Analizar foto';
    actualizarBoton();
}

function limpiarResultado() {
    seccionResultado.dataset.contenedor = '';
    elTipo.textContent = '—';
    elConfianza.textContent = '';
    elReciclar.textContent = 'Tocá "Analizar foto".';
}

function mostrarResultado(clase, confianza) {
    const porcentaje = Math.round(confianza * 100);
    const info = INFO[clase];

    if (confianza < UMBRAL || !info) {
        seccionResultado.dataset.contenedor = '';
        elTipo.textContent = 'no pude identificarlo';
        elConfianza.textContent = `Confianza baja (${porcentaje}%). Probá con otra foto, con más luz y el objeto bien centrado.`;
        elReciclar.textContent = '';
        return;
    }

    seccionResultado.dataset.contenedor = info.contenedor;
    elTipo.textContent = info.nombre;
    elConfianza.textContent = `Confianza: ${porcentaje}%. Contenedor ${info.contenedor}.`;
    elReciclar.textContent = info.texto;
}

btnAnalizar.addEventListener('click', analizar);
cargarModelo();
