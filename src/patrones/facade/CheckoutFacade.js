const Orden = require('../../models/Orden');
const EVENTOS = require('../observer/tiposEvento');
const { ProcesadorPago, obtenerEstrategiaPago } = require('../strategy/pagos/ProcesadorPago');
const { CalculadoraEnvio, obtenerEstrategiaEnvio } = require('../strategy/envios/estrategiasEnvio');
const { PrecioBase, DescuentoPorcentaje, ImpuestoIVA, CargoEnvio } = require('../decorator/precios');

const PROVINCIAS = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

// Patron Facade: el controlador solo llama cotizar() y realizarCompra()
// y esta clase coordina inventario, envios, precios, pagos, ordenes y avisos.
// Si la compra tiene productos de varias tiendas se crea una orden por tienda.
class CheckoutFacade {
  constructor(almacen, publicador) {
    this.almacen = almacen;
    this.publicador = publicador;
  }

  // Calcula cuánto costaría la compra, sin cobrar nada.
  cotizar({ carrito, provincia, metodoEnvio, cupon }) {
    const errores = [];
    const lineas = carrito.detallar((id) => this.almacen.buscarProducto(id));

    if (lineas.length === 0) {
      errores.push({ campo: 'general', mensaje: 'Su carrito está vacío.' });
    }
    lineas.forEach(({ producto, cantidad }) => {
      if (!producto.hayStock(cantidad)) {
        errores.push({
          campo: 'general',
          mensaje: producto.agotado
            ? `"${producto.nombre}" se agotó. Quítelo del carrito para continuar.`
            : `De "${producto.nombre}" solo quedan ${producto.stock} unidades.`,
        });
      }
    });

    const estrategiaEnvio = obtenerEstrategiaEnvio(metodoEnvio);
    if (!estrategiaEnvio) {
      errores.push({ campo: 'metodoEnvio', mensaje: 'Elija cómo quiere recibir su pedido.' });
    }
    const provinciaValida = PROVINCIAS.includes(provincia) ? provincia : null;

    let cuponAplicado = null;
    if (cupon && String(cupon).trim()) {
      cuponAplicado = this.almacen.buscarCupon(cupon);
      if (!cuponAplicado) {
        errores.push({ campo: 'cupon', mensaje: `El cupón "${String(cupon).trim()}" no existe o ya venció.` });
      }
    }

    // Agrupar por vendedor: cada grupo será una orden.
    const grupos = new Map();
    lineas.forEach((linea) => {
      const { vendedorId } = linea.producto;
      if (!grupos.has(vendedorId)) grupos.set(vendedorId, []);
      grupos.get(vendedorId).push(linea);
    });

    const calculadora = new CalculadoraEnvio(estrategiaEnvio);
    const resumenGrupos = [...grupos.entries()].map(([vendedorId, lineasGrupo]) => {
      const vendedor = this.almacen.buscarUsuario(vendedorId);
      const subtotal = lineasGrupo.reduce((s, l) => s + l.producto.precioBase * l.cantidad, 0);
      const pesoKg = lineasGrupo.reduce((s, l) => s + l.producto.pesoKg * l.cantidad, 0);

      const envio = estrategiaEnvio && provinciaValida ? calculadora.cotizar({ pesoKg, provincia: provinciaValida }) : null;

      // Decorator: cada capa envuelve a la anterior.
      let precio = new PrecioBase(subtotal);
      if (cuponAplicado) precio = new DescuentoPorcentaje(precio, cuponAplicado.porcentaje, cuponAplicado.codigo);
      precio = new ImpuestoIVA(precio);
      if (envio) precio = new CargoEnvio(precio, envio.costo, envio.nombre);

      return {
        vendedorId,
        tienda: vendedor?.tienda?.nombre || 'Vendedor',
        lineas: lineasGrupo,
        envio,
        desglose: precio.desglose(),
        total: precio.calcular(),
      };
    });

    return {
      errores,
      grupos: resumenGrupos,
      cupon: cuponAplicado,
      total: resumenGrupos.reduce((s, g) => s + g.total, 0),
      listoParaPagar: errores.length === 0 && Boolean(provinciaValida),
    };
  }

  // Hace toda la compra: valida, cobra, crea las órdenes y vacía el carrito.
  realizarCompra({ usuario, carrito, direccion, metodoEnvio, metodoPago, datosPago, cupon }) {
    // 1. Validar dirección (formato de Costa Rica: provincia, cantón, distrito).
    const errores = this.validarDireccion(direccion);

    // 2. Cotizar (inventario + envío + precios).
    const cotizacion = this.cotizar({ carrito, provincia: direccion.provincia, metodoEnvio, cupon });
    errores.push(...cotizacion.errores);

    // 3. Elegir la estrategia de pago.
    const estrategiaPago = obtenerEstrategiaPago(metodoPago);
    if (!estrategiaPago) {
      errores.push({ campo: 'metodoPago', mensaje: 'Elija un método de pago.' });
    }
    if (errores.length > 0) return { exito: false, errores, cotizacion };

    // 4. Cobrar con la estrategia elegida.
    const procesador = new ProcesadorPago(estrategiaPago);
    const pago = procesador.pagar(cotizacion.total, datosPago);
    if (!pago.exito) return { exito: false, errores: pago.errores, cotizacion };

    // 5. Crear una orden por vendedor.
    const compraId = this.almacen.siguienteCompra();
    const ordenes = cotizacion.grupos.map((grupo) => {
      const { id, codigo } = this.almacen.siguienteCodigoOrden();
      const orden = new Orden({
        id,
        codigo,
        compraId,
        compradorId: usuario.id,
        vendedorId: grupo.vendedorId,
        items: grupo.lineas.map((l) => ({
          productoId: l.producto.id,
          nombre: l.producto.nombre,
          precioUnitario: l.producto.precioFinal,
          cantidad: l.cantidad,
        })),
        envio: { ...grupo.envio, guia: null },
        direccion: { ...direccion },
        desglose: grupo.desglose,
        total: grupo.total,
        pago: {
          metodo: estrategiaPago.nombre,
          referencia: pago.referencia,
          detalle: pago.detalle,
          estado: pago.estado,
        },
        publicador: this.publicador,
      });
      this.almacen.guardarOrden(orden);

      // 6. Avisar que se creó (Observer: inventario, correo, auditoría).
      this.publicador.notificar(EVENTOS.ORDEN_CREADA, { orden, nota: `Pedido creado con ${estrategiaPago.nombre}.` });

      // 7. Si el pago fue inmediato (tarjeta), pasa a "Pago retenido" (State).
      if (pago.estado === 'retenido') orden.confirmarPago();
      return orden;
    });

    // 8. Vaciar el carrito.
    carrito.vaciar();

    return { exito: true, compraId, ordenes, pago };
  }

  validarDireccion(direccion = {}) {
    const errores = [];
    if (!String(direccion.nombre || '').trim()) errores.push({ campo: 'nombre', mensaje: 'Escriba el nombre de quien recibe.' });
    if (!/^[5-8]\d{3}-?\d{4}$/.test(String(direccion.telefono || '').trim())) {
      errores.push({ campo: 'telefono', mensaje: 'Escriba un teléfono de 8 dígitos, por ejemplo 8888-1234.' });
    }
    if (!PROVINCIAS.includes(direccion.provincia)) errores.push({ campo: 'provincia', mensaje: 'Elija la provincia.' });
    if (!String(direccion.canton || '').trim()) errores.push({ campo: 'canton', mensaje: 'Escriba el cantón.' });
    if (!String(direccion.distrito || '').trim()) errores.push({ campo: 'distrito', mensaje: 'Escriba el distrito.' });
    if (String(direccion.senas || '').trim().length < 10) {
      errores.push({ campo: 'senas', mensaje: 'Agregue otras señas (al menos 10 caracteres) para que el repartidor encuentre el lugar.' });
    }
    return errores;
  }
}

module.exports = { CheckoutFacade, PROVINCIAS };
