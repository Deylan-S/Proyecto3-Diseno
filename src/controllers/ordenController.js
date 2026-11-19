// Controlador de las ordenes.
// Los botones y las acciones permitidas no se deciden aqui: se le preguntan
// al estado actual de la orden (patron State) con orden.accionesPara(rol).
const Database = require('../config/Database');
const Resena = require('../models/Resena');
const { ErrorOrden } = require('../patrones/state/EstadoOrden');
const { rutaSegura } = require('../utils/helpers');

const db = Database.getInstance();

// admin ve todo, el vendedor sus ventas y el comprador sus compras
function puedeVer(usuario, orden) {
  if (!usuario || !orden) return false;
  if (usuario.rol === 'admin') return true;
  if (usuario.rol === 'vendedor') return orden.vendedorId === usuario.id;
  return orden.compradorId === usuario.id;
}

function noLePertenece(res) {
  res.status(403).render('error', { titulo: 'Acceso restringido', mensaje: 'Este pedido no le pertenece.' });
}

function misOrdenes(req, res) {
  res.render('ordenes/index', {
    titulo: 'Mis pedidos',
    ordenes: db.ordenesDeComprador(req.usuario.id),
    tiendas: db.obtenerTiendas(),
  });
}

function detalle(req, res, next) {
  const orden = db.buscarOrden(req.params.id);
  if (!orden) return next();
  if (!puedeVer(req.usuario, orden)) return noLePertenece(res);

  // reseña que ya tiene cada producto de la orden (o null)
  const resenasOrden = {};
  for (const item of orden.items) {
    resenasOrden[item.productoId] = db.resenaDe(orden.id, item.productoId);
  }

  res.render('ordenes/detalle', {
    titulo: 'Pedido ' + orden.codigo,
    orden,
    comprador: db.buscarUsuario(orden.compradorId),
    tienda: db.obtenerTiendas()[orden.vendedorId],
    acciones: orden.accionesPara(req.usuario.rol),
    puedeResenar: req.usuario.rol === 'comprador' && orden.estado.permiteResenas,
    resenasOrden,
  });
}

// La regla de "solo se califica despues de la entrega" la revisa el estado (Orden.resenar)
function resenar(req, res, next) {
  const orden = db.buscarOrden(req.params.id);
  if (!orden) return next();
  if (orden.compradorId !== req.usuario.id) return noLePertenece(res);

  const volver = `/ordenes/${orden.id}#calificar`;
  const productoId = String(req.body.productoId || '');

  if (db.resenaDe(orden.id, productoId)) {
    req.flash('error', 'Ya calificó este producto en este pedido.');
    return res.redirect(volver);
  }

  const { errores, valores } = Resena.validar(req.body);
  if (errores.length > 0) {
    req.flash('error', errores[0].mensaje);
    return res.redirect(volver);
  }

  try {
    const resena = orden.resenar({ id: db.siguienteId('resena', 'r'), productoId, ...valores });
    db.agregarResena(resena);
    req.flash('exito', '¡Gracias! Su reseña ya aparece en la página del producto.');
  } catch (error) {
    if (!(error instanceof ErrorOrden)) throw error;
    req.flash('error', error.message);
  }
  res.redirect(volver);
}

function ejecutarAccion(req, res, next) {
  const orden = db.buscarOrden(req.params.id);
  if (!orden) return next();
  if (!puedeVer(req.usuario, orden)) return noLePertenece(res);

  const volver = rutaSegura(req.body.volver, '/ordenes/' + orden.id);
  const accion = String(req.body.accion || '');

  // solo se permite lo que el estado actual ofrece para ese rol
  const permitida = orden.accionesPara(req.usuario.rol).some((a) => a.id === accion);
  if (!permitida) {
    req.flash('error', `Esa acción no está disponible para el pedido ${orden.codigo} en su estado actual.`);
    return res.redirect(volver);
  }

  try {
    if (accion === 'confirmarPago') {
      orden.confirmarPago();
      req.flash('exito', `Pago del pedido ${orden.codigo} confirmado. El vendedor ya puede despacharlo.`);
    } else if (accion === 'despachar') {
      orden.despachar(req.body.guia);
      req.flash('exito', `Pedido ${orden.codigo} marcado como despachado. Le avisamos a la persona compradora.`);
    } else if (accion === 'confirmarEntrega') {
      orden.confirmarEntrega();
      req.flash('exito', `¡Gracias! Confirmó la entrega del pedido ${orden.codigo}.`);
    } else if (accion === 'liquidar') {
      orden.liquidar();
      req.flash('exito', `Pago del pedido ${orden.codigo} liberado al vendedor.`);
    } else if (accion === 'cancelar') {
      const motivo = req.usuario.rol === 'admin' ? 'Cancelada por administración' : 'Cancelada por la persona compradora';
      orden.cancelar(motivo);
      req.flash('exito', `Pedido ${orden.codigo} cancelado.`);
    }
  } catch (error) {
    if (!(error instanceof ErrorOrden)) throw error;
    req.flash('error', error.message);
  }
  res.redirect(volver);
}

module.exports = { misOrdenes, detalle, resenar, ejecutarAccion };
