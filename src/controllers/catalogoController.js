// Controlador del catalogo y del detalle de producto
const Database = require('../config/Database');

const db = Database.getInstance();

// opciones del select "Ordenar por"
const ORDENES = {
  relevancia: { etiqueta: 'Destacados primero', comparar: (a, b) => Number(b.destacado) - Number(a.destacado) },
  'precio-asc': { etiqueta: 'Precio: menor a mayor', comparar: (a, b) => a.precioBase - b.precioBase },
  'precio-desc': { etiqueta: 'Precio: mayor a menor', comparar: (a, b) => b.precioBase - a.precioBase },
  nombre: { etiqueta: 'Nombre (A-Z)', comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
};

// { idProducto: { promedio, cantidad } }
function calificacionesDe(productos) {
  const calificaciones = {};
  for (const p of productos) calificaciones[p.id] = db.calificacionDe(p.id);
  return calificaciones;
}

function inicio(req, res) {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const categoria = db.categorias.includes(req.query.categoria) ? req.query.categoria : '';
  const orden = ORDENES[req.query.orden] ? req.query.orden : 'relevancia';

  let productos = db.productos.filter((p) => p.coincideCon(q));
  if (categoria) productos = productos.filter((p) => p.categoria === categoria);
  productos.sort(ORDENES[orden].comparar);

  let titulo = 'Catálogo';
  if (categoria) titulo = categoria;
  if (q) titulo = `Resultados para "${q}"`;

  res.render('catalogo/index', {
    titulo,
    productos,
    tiendas: db.obtenerTiendas(),
    calificaciones: calificacionesDe(productos),
    categorias: db.categorias,
    ordenes: ORDENES,
    filtros: { q, categoria, orden },
    hayFiltros: Boolean(q || categoria),
  });
}

function detalle(req, res, next) {
  const producto = db.buscarProducto(req.params.id);
  if (!producto) return next();

  const relacionados = db.productos
    .filter((p) => p.categoria === producto.categoria && p.id !== producto.id)
    .slice(0, 3);

  // el autor de la reseña se muestra como "Maria R."
  const resenas = db.resenasDeProducto(producto.id).map((r) => {
    const autor = db.buscarUsuario(r.usuarioId);
    const partes = autor ? autor.nombre.split(' ') : ['Cliente'];
    const nombre = partes[1] ? partes[0] + ' ' + partes[1][0] + '.' : partes[0];
    return { ...r, autor: nombre };
  });

  res.render('catalogo/detalle', {
    titulo: producto.nombre,
    producto,
    vendedor: db.buscarUsuario(producto.vendedorId),
    relacionados,
    tiendas: db.obtenerTiendas(),
    resenas,
    calificacion: db.calificacionDe(producto.id),
    calificaciones: calificacionesDe(relacionados),
  });
}

function accesibilidad(req, res) {
  res.render('accesibilidad', { titulo: 'Declaración de accesibilidad' });
}

module.exports = { inicio, detalle, accesibilidad };
