// Controlador de las preferencias de lectura (accesibilidad).
// Se guardan en la sesion y se aplican como clases en la etiqueta <html>,
// asi funcionan aunque JavaScript este desactivado.
const { rutaSegura } = require('../utils/helpers');

const OPCIONES = {
  texto: { normal: 'Normal', grande: 'Grande', 'muy-grande': 'Muy grande' },
  contraste: { normal: 'Normal', alto: 'Alto contraste' },
  animaciones: { normal: 'Con animaciones', reducidas: 'Sin animaciones' },
};

const POR_DEFECTO = { texto: 'normal', contraste: 'normal', animaciones: 'normal' };

// { texto: 'grande', contraste: 'alto' } -> "texto-grande alto-contraste"
function clasesDePreferencias(preferencias) {
  if (!preferencias) return '';
  const clases = [];
  if (preferencias.texto !== 'normal') clases.push('texto-' + preferencias.texto);
  if (preferencias.contraste === 'alto') clases.push('alto-contraste');
  if (preferencias.animaciones === 'reducidas') clases.push('sin-animaciones');
  return clases.join(' ');
}

function mostrar(req, res) {
  res.render('preferencias', {
    titulo: 'Preferencias de lectura',
    opciones: OPCIONES,
    actuales: { ...POR_DEFECTO, ...req.session.preferencias },
    volver: rutaSegura(req.query.volver, '/'),
  });
}

function guardar(req, res) {
  const nuevas = {};
  for (const clave in OPCIONES) {
    const valor = String(req.body[clave] || '');
    // si mandan un valor que no existe se deja el de por defecto
    nuevas[clave] = OPCIONES[clave][valor] ? valor : POR_DEFECTO[clave];
  }
  req.session.preferencias = nuevas;
  req.flash('exito', 'Guardamos sus preferencias de lectura.');
  res.redirect('/preferencias?volver=' + encodeURIComponent(rutaSegura(req.body.volver, '/')));
}

module.exports = { mostrar, guardar, clasesDePreferencias };
