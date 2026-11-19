// Controlador de registro, inicio y cierre de sesion
const Database = require('../config/Database');
const Usuario = require('../models/Usuario');
const { crearErrorDe, rutaSegura } = require('../utils/helpers');

const db = Database.getInstance();

// a donde se manda a cada rol despues de entrar
const INICIO_POR_ROL = { vendedor: '/vendedor', admin: '/admin', comprador: '/' };

// Se regenera la sesion para evitar fijacion de sesion,
// pero se guarda el carrito y las preferencias para no perderlos
function iniciarSesion(req, res, next, usuario, mensaje, destino) {
  const carrito = req.session.carrito || [];
  const preferencias = req.session.preferencias;

  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.usuarioId = usuario.id;
    req.session.carrito = carrito;
    if (preferencias) req.session.preferencias = preferencias;
    req.session.flash = [{ tipo: 'exito', mensaje }];
    res.redirect(destino);
  });
}

function formulario(req, res) {
  if (req.usuario) return res.redirect(INICIO_POR_ROL[req.usuario.rol]);
  res.render('auth/login', {
    titulo: 'Iniciar sesión',
    volver: rutaSegura(req.query.volver, ''),
    email: '',
  });
}

function entrar(req, res, next) {
  const email = String(req.body.email || '').trim();
  const usuario = db.buscarUsuarioPorEmail(email);

  if (!usuario || !usuario.verificarPassword(String(req.body.password || ''))) {
    return res.status(401).render('auth/login', {
      titulo: 'Iniciar sesión',
      volver: rutaSegura(req.body.volver, ''),
      email,
      errorLogin: 'El correo o la contraseña no coinciden. Revise e intente de nuevo.',
    });
  }

  const destino = rutaSegura(req.body.volver, INICIO_POR_ROL[usuario.rol]);
  iniciarSesion(req, res, next, usuario, `¡Hola, ${usuario.primerNombre}! Inició sesión.`, destino);
}

function mostrarRegistro(res, valores, errores, volver, estado = 200) {
  res.status(estado).render('auth/registro', {
    titulo: 'Crear cuenta',
    valores,
    errores,
    errorDe: crearErrorDe(errores),
    volver,
  });
}

function formularioRegistro(req, res) {
  if (req.usuario) return res.redirect(INICIO_POR_ROL[req.usuario.rol]);
  mostrarRegistro(res, {}, [], rutaSegura(req.query.volver, ''));
}

function registrar(req, res, next) {
  const valores = {
    nombre: String(req.body.nombre || '').trim().slice(0, 80),
    email: String(req.body.email || '').trim().slice(0, 120),
    telefono: String(req.body.telefono || '').trim().slice(0, 9),
  };
  const volver = rutaSegura(req.body.volver, '');

  const datos = { ...valores, password: req.body.password, confirmar: req.body.confirmar };
  const correoEnUso = (correo) => db.buscarUsuarioPorEmail(correo) !== null;
  const errores = Usuario.validarRegistro(datos, correoEnUso);

  if (errores.length > 0) {
    return mostrarRegistro(res, valores, errores, volver, 422);
  }

  const usuario = new Usuario({
    id: db.siguienteId('usuario', 'u'),
    ...valores,
    password: String(req.body.password),
    rol: 'comprador',
  });
  db.agregarUsuario(usuario);

  iniciarSesion(req, res, next, usuario, `¡Bienvenido, ${usuario.primerNombre}! Su cuenta está lista.`, volver || '/');
}

function salir(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.redirect('/');
  });
}

module.exports = { formulario, entrar, formularioRegistro, registrar, salir };
