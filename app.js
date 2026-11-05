/* ===== Configuración ===== */
const RUTA_MODELO = 'modelo/model.json';
const RUTA_METADATA = 'modelo/metadata.json';
const UMBRAL = 0.6; // por debajo de esta confianza no afirmamos nada

// Las claves coinciden exactamente con las clases del modelo V2.
const INFO = {
    CARTON: {
        nombre: 'Cartón',
        material: 'cardboard',
        texto: 'Retirá restos de comida, mantenelo limpio y seco y, si podés, plegalo para reducir su volumen.',
    },
    PAPEL: {
        nombre: 'Papel',
        material: 'paper',
        texto: 'Reciclalo limpio y seco. Si está muy sucio, mojado o engrasado, conviene descartarlo como residuo común.',
    },
    METAL: {
        nombre: 'Metal',
        material: 'metal',
        texto: 'Enjuagá latas y envases metálicos y, si es seguro hacerlo, aplastalos para ocupar menos espacio.',
    },
    PLASTICO: {
        nombre: 'Plástico',
        material: 'plastic',
        texto: 'Vacialo, enjuagalo y dejalo seco antes de separarlo. Revisá las indicaciones locales para cada tipo de plástico.',
    },
    ORGANICO: {
        nombre: 'Orgánico',
        material: 'organic',
        texto: 'Separalo de los reciclables. Si tenés acceso a compostaje, muchos restos de frutas y verduras pueden aprovecharse.',
    },
    VIDRIO: {
        nombre: 'Vidrio',
        material: 'glass',
        texto: 'Vacialo y enjuagalo. Manipulá con cuidado los vidrios rotos y seguí las indicaciones locales para su disposición.',
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
const iconoResultado = document.getElementById('resultado_icono');

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
        const predicciones = await modelo.predict(vistaPrevia);
        const mejor = predicciones.reduce((a, b) =>
            b.probability > a.probability ? b : a
        );
        mostrarResultado(mejor.className, mejor.probability);
    } catch (err) {
        console.error(err);
        seccionResultado.dataset.material = '';
        iconoResultado.textContent = '⚠';
        elTipo.textContent = 'Error';
        elConfianza.textContent = 'No se pudo analizar la imagen. Probá con otra.';
        elReciclar.textContent = '';
    }

    btnAnalizar.textContent = 'Analizar foto';
    actualizarBoton();
}

function limpiarResultado() {
    seccionResultado.dataset.material = '';
    iconoResultado.textContent = '♻';
    elTipo.textContent = '—';
    elConfianza.textContent = '';
    elReciclar.textContent = 'Subí una foto y tocá “Analizar foto”.';
}

function mostrarResultado(clase, confianza) {
    const porcentaje = Math.round(confianza * 100);
    const info = INFO[clase];

    if (confianza < UMBRAL || !info) {
        seccionResultado.dataset.material = '';
        iconoResultado.textContent = '?';
        elTipo.textContent = 'No pude identificarlo';
        elConfianza.textContent = `Confianza baja (${porcentaje}%). Probá con otra foto, con más luz y el objeto bien centrado.`;
        elReciclar.textContent = 'Intentá mostrar un solo residuo y que ocupe una buena parte de la imagen.';
        return;
    }

    seccionResultado.dataset.material = info.material;
    iconoResultado.textContent = '♻';
    elTipo.textContent = info.nombre;
    elConfianza.textContent = `Confianza: ${porcentaje}%`;
    elReciclar.textContent = info.texto;
}

btnAnalizar.addEventListener('click', analizar);
cargarModelo();
