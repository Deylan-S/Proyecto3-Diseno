// Controlador del carrito de compras
const Database = require('../config/Database');
const Carrito = require('../models/Carrito');
const { colones, rutaSegura } = require('../utils/helpers');

const db = Database.getInstance();

// Si la peticion viene del JavaScript (fetch) responde JSON, si no redirige con un mensaje
function responder(req, res, ok, mensaje, volver) {
  const carrito = Carrito.desdeSesion(req.session);
  if (req.accepts(['html', 'json']) === 'json') {
    return res.status(ok ? 200 : 422).json({ ok, mensaje, cantidad: carrito.cantidadTotal });
  }
  req.flash(ok ? 'exito' : 'error', mensaje);
  res.redirect(rutaSegura(volver, '/carrito'));
}

function ver(req, res) {
  const carrito = Carrito.desdeSesion(req.session);
  const lineas = carrito.detallar((id) => db.buscarProducto(id));

  let total = 0;
  for (const linea of lineas) total += linea.totalLinea;

  res.render('carrito/index', {
    titulo: 'Carrito',
    lineas,
    total,
    maximo: Carrito.MAXIMO_POR_PRODUCTO,
    tiendas: db.obtenerTiendas(),
  });
}

function agregar(req, res) {
  const producto = db.buscarProducto(req.body.productoId);
  const cantidad = Math.max(1, parseInt(req.body.cantidad) || 1);
  const volver = req.body.volver;

  if (!producto) {
    return responder(req, res, false, 'Ese producto ya no está disponible.', volver);
  }

  const carrito = Carrito.desdeSesion(req.session);
  const linea = carrito.lineas.find((l) => l.productoId === producto.id);
  const enCarrito = linea ? linea.cantidad : 0;

  if (!producto.hayStock(enCarrito + cantidad)) {
    let mensaje = `Solo hay ${producto.stock} unidades de "${producto.nombre}" y ya tiene ${enCarrito} en el carrito.`;
    if (producto.agotado) mensaje = `"${producto.nombre}" está agotado.`;
    return responder(req, res, false, mensaje, volver);
  }

  carrito.agregar(producto.id, cantidad);
  responder(req, res, true, `Agregó "${producto.nombre}" al carrito (${colones(producto.precioFinal)} c/u).`, volver);
}

function actualizar(req, res) {
  const producto = db.buscarProducto(req.body.productoId);
  const cantidad = parseInt(req.body.cantidad);

  if (!producto || isNaN(cantidad)) {
    return responder(req, res, false, 'No se pudo actualizar la cantidad.');
  }
  if (cantidad > 0 && !producto.hayStock(cantidad)) {
    return responder(req, res, false, `Solo hay ${producto.stock} unidades de "${producto.nombre}".`);
  }

  Carrito.desdeSesion(req.session).actualizar(producto.id, cantidad);

  if (cantidad > 0) {
    responder(req, res, true, `Ahora tiene ${cantidad} de "${producto.nombre}".`);
  } else {
    responder(req, res, true, `Quitó "${producto.nombre}" del carrito.`);
  }
}

function quitar(req, res) {
  const producto = db.buscarProducto(req.body.productoId);
  Carrito.desdeSesion(req.session).quitar(req.body.productoId);
  const nombre = producto ? producto.nombre : 'el producto';
  responder(req, res, true, `Quitó "${nombre}" del carrito.`);
}

module.exports = { ver, agregar, actualizar, quitar };
