const EstrategiaPago = require('./EstrategiaPago');

// Estrategia: transferencia con cuenta IBAN de Costa Rica. Tambien queda pendiente.
class PagoTransferencia extends EstrategiaPago {
  get id() {
    return 'transferencia';
  }

  get nombre() {
    return 'Transferencia bancaria';
  }

  validar(datos = {}) {
    const errores = [];
    const iban = String(datos.iban || '').replace(/\s/g, '').toUpperCase();
    const titular = String(datos.titularCuenta || '').trim();

    // IBAN de Costa Rica: "CR" + 20 dígitos (22 caracteres en total).
    if (!/^CR\d{20}$/.test(iban)) {
      errores.push({ campo: 'iban', mensaje: 'La cuenta IBAN de Costa Rica empieza con CR y tiene 22 caracteres.' });
    }
    if (titular.length < 3) {
      errores.push({ campo: 'titularCuenta', mensaje: 'Escriba el nombre de la persona dueña de la cuenta.' });
    }
    return errores;
  }

  procesar(monto, datos) {
    const iban = String(datos.iban).replace(/\s/g, '').toUpperCase();
    return {
      exito: true,
      metodo: this.id,
      estado: 'pendiente_verificacion',
      referencia: this.generarReferencia('TRF'),
      detalle: `Transferencia desde cuenta CR…${iban.slice(-4)}`,
      monto,
    };
  }
}

module.exports = PagoTransferencia;
