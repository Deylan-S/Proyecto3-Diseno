// Controlador del checkout.
// Solo habla con la fachada (CheckoutFacade), no conoce las estrategias,
// los decoradores ni los estados de la orden.
const Database = require('../config/Database');
const { checkout } = require('../config/inicializar');
const Carrito = require('../models/Carrito');
const { PROVINCIAS } = require('../patrones/facade/CheckoutFacade');
const { ESTRATEGIAS_PAGO } = require('../patrones/strategy/pagos/ProcesadorPago');
const { ESTRATEGIAS_ENVIO } = require('../patrones/strategy/envios/estrategiasEnvio');
const PagoSinpe = require('../patrones/strategy/pagos/PagoSinpe');
const { crearErrorDe } = require('../utils/helpers');

const db = Database.getInstance();

const CAMPOS_DIRECCION = ['nombre', 'telefono', 'provincia', 'canton', 'distrito', 'senas'];
// datos de pago que se pueden volver a mostrar en el formulario (nunca la tarjeta ni el CVV)
const CAMPOS_PAGO = ['titular', 'vencimiento', 'telefonoSinpe', 'comprobante', 'iban', 'titularCuenta'];
const OTROS_CAMPOS = ['metodoEnvio', 'metodoPago', 'cupon'];

function leerFormulario(body) {
  const valores = {};
  const campos = CAMPOS_DIRECCION.concat(CAMPOS_PAGO, OTROS_CAMPOS);
  for (const campo of campos) {
    valores[campo] = String(body[campo] || '').trim().slice(0, 200);
  }
  return valores;
}

function valoresIniciales(req) {
  const valores = {
    nombre: req.usuario.nombre,
    telefono: req.usuario.telefono,
    provincia: '',
    canton: '',
    distrito: '',
    senas: '',
    metodoEnvio: 'correos',
    metodoPago: 'tarjeta',
    cupon: '',
  };
  // si ya habia comprado antes, se usa la ultima direccion
  if (req.session.ultimaDireccion) {
    Object.assign(valores, req.session.ultimaDireccion);
  }
  return valores;
}

function cotizar(req, valores) {
  return checkout.cotizar({
    carrito: Carrito.desdeSesion(req.session),
    provincia: valores.provincia,
    metodoEnvio: valores.metodoEnvio,
    cupon: valores.cupon,
  });
}

function mostrarFormulario(req, res, valores, errores = [], estado = 200) {
  res.status(estado).render('checkout/index', {
    titulo: 'Finalizar compra',
    valores,
    cotizacion: cotizar(req, valores),
    errores,
    errorDe: crearErrorDe(errores),
    provincias: PROVINCIAS,
    metodosEnvio: ESTRATEGIAS_ENVIO,
    metodosPago: ESTRATEGIAS_PAGO,
    numeroSinpe: PagoSinpe.NUMERO_COMERCIO,
  });
}

function mostrar(req, res) {
  if (Carrito.desdeSesion(req.session).estaVacio) {
    req.flash('info', 'Su carrito está vacío. Agregue productos para comprar.');
    return res.redirect('/carrito');
  }
  mostrarFormulario(req, res, valoresIniciales(req));
}

// Boton "Aplicar" del cupon cuando no hay JavaScript: vuelve a mostrar el formulario
function recalcular(req, res) {
  const valores = leerFormulario(req.body);
  const errores = cotizar(req, valores).errores.filter((e) => e.campo === 'cupon');

  if (valores.cupon && errores.length === 0) {
    res.locals.flash.push({ tipo: 'exito', mensaje: `Cupón ${valores.cupon.toUpperCase()} aplicado.` });
  }
  mostrarFormulario(req, res, valores, errores);
}

// Con JavaScript: devuelve solo el resumen del pedido para actualizarlo sin recargar
function cotizacionParcial(req, res) {
  const valores = leerFormulario(req.body);
  const cotizacion = cotizar(req, valores);

  res.render('checkout/_resumen', { cotizacion, valores }, (error, html) => {
    if (error) return res.status(500).json({ ok: false });
    const errorCupon = cotizacion.errores.find((e) => e.campo === 'cupon');
    res.json({ ok: true, html, total: cotizacion.total, errorCupon: errorCupon ? errorCupon.mensaje : null });
  });
}

function procesar(req, res) {
  const valores = leerFormulario(req.body);

  const direccion = {};
  for (const campo of CAMPOS_DIRECCION) direccion[campo] = valores[campo];

  const datosPago = { ...valores, numeroTarjeta: req.body.numeroTarjeta, cvv: req.body.cvv };

  const resultado = checkout.realizarCompra({
    usuario: req.usuario,
    carrito: Carrito.desdeSesion(req.session),
    direccion,
    metodoEnvio: valores.metodoEnvio,
    metodoPago: valores.metodoPago,
    datosPago,
    cupon: valores.cupon,
  });

  if (!resultado.exito) {
    return mostrarFormulario(req, res, valores, resultado.errores, 422);
  }

  req.session.ultimaDireccion = direccion;
  res.redirect('/checkout/confirmacion/' + resultado.compraId);
}

function confirmacion(req, res, next) {
  const ordenes = db.ordenesDeCompra(req.params.compraId).filter((o) => o.compradorId === req.usuario.id);
  if (ordenes.length === 0) return next();

  let total = 0;
  for (const orden of ordenes) total += orden.total;

  res.render('checkout/confirmacion', {
    titulo: 'Compra realizada',
    compraId: req.params.compraId,
    ordenes,
    tiendas: db.obtenerTiendas(),
    total,
    numeroSinpe: PagoSinpe.NUMERO_COMERCIO,
  });
}

module.exports = { mostrar, recalcular, cotizacionParcial, procesar, confirmacion };
