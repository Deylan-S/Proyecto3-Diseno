// Controlador para que el vendedor agregue y edite sus productos.
// Las validaciones estan en el modelo Producto.
const Database = require('../config/Database');
const Producto = require('../models/Producto');
const { precioConIVA } = require('../patrones/decorator/precios');
const { crearErrorDe } = require('../utils/helpers');

const db = Database.getInstance();

function mostrarFormulario(res, producto, valores, errores = [], estado = 200) {
  let precioCliente = null;
  if (Number.isInteger(valores.precioBase) && valores.precioBase > 0) {
    precioCliente = precioConIVA(valores.precioBase);
  }

  res.status(estado).render('vendedor/producto-form', {
    titulo: producto ? 'Editar: ' + producto.nombre : 'Agregar producto',
    producto,
    valores,
    errores,
    errorDe: crearErrorDe(errores),
    categorias: db.categorias,
    precioCliente,
  });
}

// un vendedor solo puede editar sus propios productos
function buscarProductoPropio(req) {
  const producto = db.buscarProducto(req.params.id);
  if (producto && producto.vendedorId === req.usuario.id) return producto;
  return null;
}

function nuevo(req, res) {
  const vacio = { nombre: '', descripcion: '', categoria: '', precioBase: '', stock: 1, pesoKg: 0.5 };
  mostrarFormulario(res, null, vacio);
}

function crear(req, res) {
  const { errores, valores } = Producto.validar(req.body, db.categorias);
  if (errores.length > 0) {
    return mostrarFormulario(res, null, req.body, errores, 422);
  }

  const imagen = Producto.IMAGEN_POR_CATEGORIA[valores.categoria];
  const producto = new Producto({
    id: db.siguienteId('producto', 'p'),
    ...valores,
    vendedorId: req.usuario.id,
    imagen,
    alt: Producto.ALT_POR_IMAGEN[imagen],
  });
  db.productos.push(producto);

  req.flash('exito', `Publicó "${producto.nombre}". Ya aparece en el catálogo.`);
  res.redirect('/vendedor#titulo-inventario');
}

function editar(req, res, next) {
  const producto = buscarProductoPropio(req);
  if (!producto) return next();
  mostrarFormulario(res, producto, producto);
}

function actualizar(req, res, next) {
  const producto = buscarProductoPropio(req);
  if (!producto) return next();

  const { errores, valores } = Producto.validar(req.body, db.categorias);
  if (errores.length > 0) {
    return mostrarFormulario(res, producto, req.body, errores, 422);
  }

  producto.actualizar(valores);
  req.flash('exito', `Guardó los cambios de "${producto.nombre}".`);
  res.redirect('/vendedor#titulo-inventario');
}

module.exports = { nuevo, crear, editar, actualizar };
