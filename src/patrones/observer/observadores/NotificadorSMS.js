const Observador = require('./Observador');
const EVENTOS = require('../tiposEvento');

// Observador: mensajes de texto (simulados) para el comprador
class NotificadorSMS extends Observador {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  actualizar({ tipo, datos }) {
    const { orden } = datos;
    if (!orden) return;

    let texto = null;
    if (tipo === EVENTOS.PAGO_RETENIDO) {
      texto = `MercaTico: pago de ${orden.codigo} confirmado. Le avisaremos cuando vaya en camino.`;
    } else if (tipo === EVENTOS.ORDEN_DESPACHADA) {
      texto = `MercaTico: ${orden.codigo} va en camino. Guía ${orden.envio.guia}.`;
    }

    if (texto) {
      this.almacen.agregarNotificacion({
        usuarioId: orden.compradorId,
        canal: 'sms',
        asunto: 'Mensaje de texto',
        mensaje: texto,
        ordenId: orden.id,
      });
    }
  }
}

module.exports = NotificadorSMS;
