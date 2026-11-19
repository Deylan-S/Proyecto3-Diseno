const EstrategiaPago = require('./EstrategiaPago');

// Estrategia: pago con SINPE Movil.
// Queda pendiente hasta que el admin revise el comprobante.
class PagoSinpe extends EstrategiaPago {
  static NUMERO_COMERCIO = '8888-0000';

  get id() {
    return 'sinpe';
  }

  get nombre() {
    return 'SINPE Móvil';
  }

  validar(datos = {}) {
    const errores = [];
    const telefono = String(datos.telefonoSinpe || '').replace(/[\s-]/g, '');
    const comprobante = String(datos.comprobante || '').trim();

    // En Costa Rica los celulares tienen 8 dígitos y empiezan con 5, 6, 7 u 8.
    if (!/^[5-8]\d{7}$/.test(telefono)) {
      errores.push({ campo: 'telefonoSinpe', mensaje: 'Escriba un número celular de 8 dígitos, por ejemplo 8888-1234.' });
    }
    if (!/^\d{6,25}$/.test(comprobante)) {
      errores.push({ campo: 'comprobante', mensaje: 'El comprobante de SINPE tiene solo números (mínimo 6).' });
    }
    return errores;
  }

  procesar(monto, datos) {
    const telefono = String(datos.telefonoSinpe).replace(/[\s-]/g, '');
    return {
      exito: true,
      metodo: this.id,
      estado: 'pendiente_verificacion',
      referencia: this.generarReferencia('SNP'),
      comprobante: String(datos.comprobante).trim(),
      detalle: `SINPE Móvil desde ****-${telefono.slice(-4)}`,
      monto,
    };
  }
}

module.exports = PagoSinpe;
