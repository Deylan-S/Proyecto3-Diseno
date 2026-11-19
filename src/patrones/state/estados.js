const { EstadoOrden, ErrorOrden } = require('./EstadoOrden');
const EVENTOS = require('../observer/tiposEvento');

// Patron State: estados concretos de la orden
// PendientePago -> PagoRetenido -> Despachada -> Entregada -> Liquidada
// Desde PendientePago o PagoRetenido tambien se puede pasar a Cancelada

const COMISION_MERCATICO = 0.08; // 8 % por venta

class PendientePago extends EstadoOrden {
  get codigo() {
    return 'pendiente_pago';
  }

  get nombre() {
    return 'Pendiente de pago';
  }

  get descripcion() {
    return 'Estamos verificando que el pago haya llegado.';
  }

  confirmarPago(orden) {
    orden.cambiarEstado(new PagoRetenido(), EVENTOS.PAGO_RETENIDO, 'Pago verificado y retenido por MercaTico hasta la entrega.');
  }

  cancelar(orden, motivo = 'Cancelada antes del pago') {
    orden.cambiarEstado(new Cancelada(), EVENTOS.ORDEN_CANCELADA, motivo, { reembolso: false });
  }

  accionesPara(rol) {
    if (rol === 'admin') {
      return [
        { id: 'confirmarPago', etiqueta: 'Confirmar pago recibido' },
        { id: 'cancelar', etiqueta: 'Cancelar orden', peligro: true },
      ];
    }
    if (rol === 'comprador') {
      return [{ id: 'cancelar', etiqueta: 'Cancelar orden', peligro: true }];
    }
    return [];
  }
}

class PagoRetenido extends EstadoOrden {
  get codigo() {
    return 'pago_retenido';
  }

  get nombre() {
    return 'Pago retenido';
  }

  get descripcion() {
    return 'El dinero está protegido. El vendedor está preparando el paquete.';
  }

  despachar(orden, numeroGuia) {
    const guia = String(numeroGuia || '').trim();
    if (guia.length < 4) {
      throw new ErrorOrden('Escriba el número de guía del envío (mínimo 4 caracteres).');
    }
    orden.envio.guia = guia;
    orden.cambiarEstado(new Despachada(), EVENTOS.ORDEN_DESPACHADA, `Paquete entregado al transportista. Guía ${guia}.`);
  }

  cancelar(orden, motivo = 'Cancelada antes del despacho') {
    orden.cambiarEstado(new Cancelada(), EVENTOS.ORDEN_CANCELADA, `${motivo}. Se reembolsa el pago retenido.`, { reembolso: true });
  }

  accionesPara(rol) {
    if (rol === 'vendedor') {
      return [{ id: 'despachar', etiqueta: 'Marcar como despachada', pideGuia: true }];
    }
    if (rol === 'comprador' || rol === 'admin') {
      return [{ id: 'cancelar', etiqueta: 'Cancelar y reembolsar', peligro: true }];
    }
    return [];
  }
}

class Despachada extends EstadoOrden {
  get codigo() {
    return 'despachada';
  }

  get nombre() {
    return 'Despachada';
  }

  get descripcion() {
    return 'El paquete va en camino.';
  }

  confirmarEntrega(orden) {
    orden.cambiarEstado(new Entregada(), EVENTOS.ORDEN_ENTREGADA, 'La persona compradora confirmó que recibió el paquete.');
  }

  accionesPara(rol) {
    if (rol === 'comprador' || rol === 'admin') {
      return [{ id: 'confirmarEntrega', etiqueta: 'Confirmar que llegó el paquete' }];
    }
    return [];
  }
}

class Entregada extends EstadoOrden {
  get codigo() {
    return 'entregada';
  }

  get nombre() {
    return 'Entregada';
  }

  get descripcion() {
    return 'Pedido recibido. El pago al vendedor se libera pronto.';
  }

  get permiteResenas() {
    return true;
  }

  liquidar(orden) {
    const comision = Math.round(orden.total * COMISION_MERCATICO);
    orden.liquidacion = {
      comision,
      montoVendedor: orden.total - comision,
      fecha: new Date(),
    };
    orden.cambiarEstado(
      new Liquidada(),
      EVENTOS.PAGO_LIQUIDADO,
      'Pago liberado al vendedor (menos la comisión de MercaTico).',
      { ...orden.liquidacion },
    );
  }

  accionesPara(rol) {
    if (rol === 'admin') {
      return [{ id: 'liquidar', etiqueta: 'Liberar pago al vendedor' }];
    }
    return [];
  }
}

class Liquidada extends EstadoOrden {
  get codigo() {
    return 'liquidada';
  }

  get nombre() {
    return 'Completada';
  }

  get descripcion() {
    return 'Compra completada y vendedor pagado.';
  }

  get esFinal() {
    return true;
  }

  get permiteResenas() {
    return true;
  }
}

class Cancelada extends EstadoOrden {
  get codigo() {
    return 'cancelada';
  }

  get nombre() {
    return 'Cancelada';
  }

  get descripcion() {
    return 'Esta orden se canceló.';
  }

  get esFinal() {
    return true;
  }
}

// Orden en que se muestran los pasos en la línea de tiempo.
const PASOS_FLUJO = [
  { codigo: 'pendiente_pago', nombre: 'Pago' },
  { codigo: 'pago_retenido', nombre: 'Pago retenido' },
  { codigo: 'despachada', nombre: 'En camino' },
  { codigo: 'entregada', nombre: 'Entregada' },
  { codigo: 'liquidada', nombre: 'Completada' },
];

module.exports = {
  PendientePago,
  PagoRetenido,
  Despachada,
  Entregada,
  Liquidada,
  Cancelada,
  PASOS_FLUJO,
  COMISION_MERCATICO,
};
