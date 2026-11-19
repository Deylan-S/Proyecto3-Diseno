const Observador = require('./Observador');
const EVENTOS = require('../tiposEvento');
const { colones } = require('../../../utils/helpers');

// Observador: manda correos (simulados) al comprador y al vendedor.
// Se guardan como notificaciones para verlos en la pagina de avisos.
class NotificadorEmail extends Observador {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  actualizar({ tipo, datos }) {
    const { orden } = datos;
    if (!orden) return;

    const mensajes = this.plantillas(tipo, orden, datos);
    mensajes.forEach(({ usuarioId, asunto, mensaje }) => {
      this.almacen.agregarNotificacion({ usuarioId, canal: 'email', asunto, mensaje, ordenId: orden.id });
    });
  }

  plantillas(tipo, orden, datos) {
    const comprador = orden.compradorId;
    const vendedor = orden.vendedorId;
    const codigo = orden.codigo;

    switch (tipo) {
      case EVENTOS.ORDEN_CREADA:
        return [{
          usuarioId: comprador,
          asunto: `Recibimos su pedido ${codigo}`,
          mensaje: `Gracias por comprar en MercaTico. Su pedido de ${colones(orden.total)} quedó registrado.`,
        }];
      case EVENTOS.PAGO_RETENIDO:
        return [
          {
            usuarioId: comprador,
            asunto: `Pago confirmado - ${codigo}`,
            mensaje: 'Su dinero está protegido: el vendedor lo recibe hasta que usted confirme la entrega.',
          },
          {
            usuarioId: vendedor,
            asunto: `Nueva venta pagada - ${codigo}`,
            mensaje: 'El pago está retenido. Prepare el paquete y márquelo como despachado con el número de guía.',
          },
        ];
      case EVENTOS.ORDEN_DESPACHADA:
        return [{
          usuarioId: comprador,
          asunto: `Su pedido ${codigo} va en camino`,
          mensaje: `Lo envía ${orden.envio.nombre}. Número de guía: ${orden.envio.guia}.`,
        }];
      case EVENTOS.ORDEN_ENTREGADA:
        return [{
          usuarioId: vendedor,
          asunto: `Entrega confirmada - ${codigo}`,
          mensaje: 'La persona compradora recibió el pedido. Su pago se liberará pronto.',
        }];
      case EVENTOS.PAGO_LIQUIDADO:
        return [{
          usuarioId: vendedor,
          asunto: `Le depositamos ${colones(datos.montoVendedor)}`,
          mensaje: `Pago de la orden ${codigo}. Comisión de MercaTico: ${colones(datos.comision)}.`,
        }];
      case EVENTOS.ORDEN_CANCELADA:
        return [
          {
            usuarioId: comprador,
            asunto: `Orden ${codigo} cancelada`,
            mensaje: datos.reembolso
              ? `Le devolvemos ${colones(orden.total)} por el mismo método de pago.`
              : 'La orden se canceló. No se realizó ningún cobro.',
          },
          {
            usuarioId: vendedor,
            asunto: `Orden ${codigo} cancelada`,
            mensaje: 'No despache este pedido.',
          },
        ];
      case EVENTOS.RESENA_PUBLICADA:
        return [{
          usuarioId: vendedor,
          asunto: `Nueva reseña: ${datos.resena.calificacion} de 5 estrellas`,
          mensaje: datos.resena.comentario
            ? `Sobre "${datos.producto}": “${datos.resena.comentario}”`
            : `Calificaron "${datos.producto}" sin comentario.`,
        }];
      default:
        return [];
    }
  }
}

module.exports = NotificadorEmail;
