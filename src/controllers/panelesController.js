// Controlador del panel de vendedor, el panel de administracion y las notificaciones
const Database = require('../config/Database');

const db = Database.getInstance();

function sumar(lista, campo) {
  let total = 0;
  for (const item of lista) total += campo(item);
  return total;
}

function vendedor(req, res) {
  const ordenes = db.ordenesDeVendedor(req.usuario.id);
  const productos = db.productosDeVendedor(req.usuario.id);

  const porDespachar = ordenes.filter((o) => o.estado.codigo === 'pago_retenido');
  const enProceso = ordenes.filter((o) => ['pendiente_pago', 'despachada', 'entregada'].includes(o.estado.codigo));
  const cerradas = ordenes.filter((o) => o.estado.esFinal);
  const liquidadas = ordenes.filter((o) => o.liquidacion);
  const retenidas = ordenes.filter((o) => ['pago_retenido', 'despachada', 'entregada'].includes(o.estado.codigo));

  res.render('vendedor/index', {
    titulo: 'Panel de vendedor',
    tienda: req.usuario.tienda,
    porDespachar,
    enProceso,
    cerradas,
    productos,
    metricas: {
      recibido: sumar(liquidadas, (o) => o.liquidacion.montoVendedor),
      porCobrar: sumar(retenidas, (o) => o.total),
      pedidos: ordenes.length,
      calificacion: db.calificacionDe(productos.map((p) => p.id)),
    },
  });
}

function admin(req, res) {
  const filtro = String(req.query.estado || '');
  const ordenes = filtro ? db.ordenes.filter((o) => o.estado.codigo === filtro) : db.ordenes;
  const liquidadas = db.ordenes.filter((o) => o.liquidacion);
  const noCanceladas = db.ordenes.filter((o) => o.estado.codigo !== 'cancelada');

  const usuarios = {};
  for (const u of db.usuarios) usuarios[u.id] = u;

  res.render('admin/index', {
    titulo: 'Administración',
    ordenes,
    filtro,
    tiendas: db.obtenerTiendas(),
    usuarios,
    pendientesVerificacion: db.ordenes.filter((o) => o.estado.codigo === 'pendiente_pago'),
    porLiquidar: db.ordenes.filter((o) => o.estado.codigo === 'entregada'),
    auditoria: db.auditoria.slice(0, 25),
    metricas: {
      ventas: sumar(noCanceladas, (o) => o.total),
      comisiones: sumar(liquidadas, (o) => o.liquidacion.comision),
      ordenes: db.ordenes.length,
    },
    estados: [
      ['', 'Todos'],
      ['pendiente_pago', 'Pendiente de pago'],
      ['pago_retenido', 'Pago retenido'],
      ['despachada', 'Despachada'],
      ['entregada', 'Entregada'],
      ['liquidada', 'Completada'],
      ['cancelada', 'Cancelada'],
    ],
  });
}

function notificaciones(req, res) {
  const misNotificaciones = db.notificacionesDe(req.usuario.id);
  // se marca cuales eran nuevas antes de ponerlas como leidas
  const lista = misNotificaciones.map((n) => ({ ...n, nueva: !n.leida }));
  for (const n of misNotificaciones) n.leida = true;

  res.locals.notificacionesNoLeidas = 0;
  res.render('notificaciones', { titulo: 'Notificaciones', notificaciones: lista });
}

module.exports = { vendedor, admin, notificaciones };
