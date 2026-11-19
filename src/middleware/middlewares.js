const crypto = require('crypto');
const Database = require('../config/Database');
const Carrito = require('../models/Carrito');
const { clasesDePreferencias } = require('../controllers/preferenciasController');
const helpers = require('../utils/helpers');

const db = Database.getInstance();

// Se ejecuta en cada peticion y deja listo lo que usan todas las vistas
function cargarDatosVista(req, res, next) {
  // mensajes flash: se guardan en la sesion y se muestran una sola vez
  req.flash = (tipo, mensaje) => {
    if (!req.session.flash) req.session.flash = [];
    req.session.flash.push({ tipo, mensaje });
  };
  res.locals.flash = req.session.flash || [];
  req.session.flash = [];

  // token para proteger los formularios (CSRF)
  if (!req.session.csrf) {
    req.session.csrf = crypto.randomBytes(24).toString('hex');
  }

  let usuario = null;
  if (req.session.usuarioId) {
    usuario = db.buscarUsuario(req.session.usuarioId);
  }
  req.usuario = usuario;

  res.locals.usuario = usuario;
  res.locals.csrf = req.session.csrf;
  res.locals.carritoCantidad = Carrito.desdeSesion(req.session).cantidadTotal;
  res.locals.notificacionesNoLeidas = usuario ? db.notificacionesDe(usuario.id).filter((n) => !n.leida).length : 0;
  res.locals.rutaActual = req.path;
  res.locals.urlActual = req.originalUrl;
  res.locals.clasesHtml = clasesDePreferencias(req.session.preferencias);
  res.locals.errores = [];
  res.locals.errorDe = () => null;

  res.locals.colones = helpers.colones;
  res.locals.fecha = helpers.fecha;
  res.locals.estrellas = helpers.estrellas;
  res.locals.decimal = helpers.decimal;
  next();
}

// Todo POST tiene que traer el token de la sesion
function verificarCSRF(req, res, next) {
  if (req.method !== 'POST') return next();

  const token = (req.body && req.body._csrf) || req.get('x-csrf-token');
  if (token && token === req.session.csrf) return next();

  res.status(403).render('error', {
    titulo: 'Sesión vencida',
    mensaje: 'Por seguridad, recargue la página e intente de nuevo.',
  });
}

function requiereSesion(req, res, next) {
  if (req.usuario) return next();
  req.flash('info', 'Inicie sesión para continuar.');
  res.redirect('/login?volver=' + encodeURIComponent(req.originalUrl));
}

// uso: requiereRol('vendedor') o requiereRol('admin', 'vendedor')
function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return requiereSesion(req, res, next);
    if (roles.includes(req.usuario.rol)) return next();

    res.status(403).render('error', {
      titulo: 'Acceso restringido',
      mensaje: 'Su cuenta no tiene permiso para ver esta página.',
    });
  };
}

// Encabezados basicos de seguridad
function encabezadosSeguridad(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; form-action 'self'");
  next();
}

module.exports = { cargarDatosVista, verificarCSRF, requiereSesion, requiereRol, encabezadosSeguridad };
