const EstrategiaPago = require('./EstrategiaPago');

// Estrategia: pago con tarjeta.
// No se guarda el numero completo, solo un token y los ultimos 4 digitos.
class PagoTarjeta extends EstrategiaPago {
  get id() {
    return 'tarjeta';
  }

  get nombre() {
    return 'Tarjeta de crédito o débito';
  }

  validar(datos = {}) {
    const errores = [];
    const numero = String(datos.numeroTarjeta || '').replace(/[\s-]/g, '');
    const titular = String(datos.titular || '').trim();
    const vencimiento = String(datos.vencimiento || '').trim();
    const cvv = String(datos.cvv || '').trim();

    if (titular.length < 3) {
      errores.push({ campo: 'titular', mensaje: 'Escriba el nombre como aparece en la tarjeta.' });
    }
    if (!/^\d{13,19}$/.test(numero) || !PagoTarjeta.pasaLuhn(numero)) {
      errores.push({ campo: 'numeroTarjeta', mensaje: 'El número de tarjeta no es válido. Revise los dígitos.' });
    }
    if (!PagoTarjeta.vencimientoValido(vencimiento)) {
      errores.push({ campo: 'vencimiento', mensaje: 'La fecha de vencimiento debe tener el formato MM/AA y no estar vencida.' });
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      errores.push({ campo: 'cvv', mensaje: 'El código de seguridad tiene 3 o 4 dígitos.' });
    }
    return errores;
  }

  procesar(monto, datos) {
    const numero = String(datos.numeroTarjeta).replace(/[\s-]/g, '');
    const ultimos4 = numero.slice(-4);

    // Tarjeta de prueba que la "pasarela" rechaza, útil para demostrar el error.
    if (numero === '4000000000000002') {
      return {
        exito: false,
        metodo: this.id,
        errores: [{ campo: 'numeroTarjeta', mensaje: 'El banco rechazó la tarjeta. Pruebe con otra o elija otro método de pago.' }],
      };
    }

    return {
      exito: true,
      metodo: this.id,
      estado: 'retenido',
      referencia: this.generarReferencia('TRJ'),
      token: `tok_${Math.random().toString(36).slice(2, 14)}`,
      detalle: `Tarjeta terminada en ${ultimos4}`,
      monto,
    };
  }

  // Algoritmo de Luhn: detecta errores de digitación en números de tarjeta.
  static pasaLuhn(numero) {
    let suma = 0;
    let duplicar = false;
    for (let i = numero.length - 1; i >= 0; i -= 1) {
      let digito = Number(numero[i]);
      if (duplicar) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      suma += digito;
      duplicar = !duplicar;
    }
    return suma % 10 === 0;
  }

  static vencimientoValido(texto, hoy = new Date()) {
    const coincidencia = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(texto);
    if (!coincidencia) return false;
    const mes = Number(coincidencia[1]);
    const anio = 2000 + Number(coincidencia[2]);
    // La tarjeta sirve hasta el último día del mes indicado.
    const finDeMes = new Date(anio, mes, 0, 23, 59, 59);
    return finDeMes >= hoy;
  }
}

module.exports = PagoTarjeta;
