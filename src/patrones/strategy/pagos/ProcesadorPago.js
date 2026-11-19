const PagoTarjeta = require('./PagoTarjeta');
const PagoSinpe = require('./PagoSinpe');
const PagoTransferencia = require('./PagoTransferencia');

// Patron Strategy: contexto. Usa la estrategia que se le asigne para cobrar
class ProcesadorPago {
  constructor(estrategia) {
    this.estrategia = estrategia;
  }

  setEstrategia(estrategia) {
    this.estrategia = estrategia;
  }

  pagar(monto, datos) {
    if (!this.estrategia) {
      return { exito: false, errores: [{ campo: 'metodoPago', mensaje: 'Elija un método de pago' }] };
    }
    if (!(monto > 0)) {
      return { exito: false, errores: [{ campo: 'general', mensaje: 'El monto a pagar debe ser mayor a cero' }] };
    }
    const errores = this.estrategia.validar(datos);
    if (errores.length > 0) {
      return { exito: false, metodo: this.estrategia.id, errores };
    }
    return this.estrategia.procesar(monto, datos);
  }
}

// Catálogo de estrategias disponibles. Agregar un método = agregar una línea aquí.
const ESTRATEGIAS_PAGO = [new PagoTarjeta(), new PagoSinpe(), new PagoTransferencia()];

function obtenerEstrategiaPago(id) {
  return ESTRATEGIAS_PAGO.find((estrategia) => estrategia.id === id) || null;
}

module.exports = { ProcesadorPago, ESTRATEGIAS_PAGO, obtenerEstrategiaPago };
