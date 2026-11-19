// Patron State: clase base de los estados de la orden.
// Por defecto ninguna accion se puede hacer; cada estado sobreescribe las que si permite.

// Error de negocio de una orden: se le muestra a la persona usuaria.
class ErrorOrden extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorOrden';
  }
}

// La acción no está permitida en el estado actual.
class TransicionInvalidaError extends ErrorOrden {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'TransicionInvalidaError';
  }
}

class EstadoOrden {
  get codigo() {
    throw new Error('El estado debe definir "codigo"');
  }

  get nombre() {
    throw new Error('El estado debe definir "nombre"');
  }

  get descripcion() {
    return '';
  }

  // Indica si la orden ya no admite más cambios.
  get esFinal() {
    return false;
  }

  // Solo se pueden calificar productos que ya llegaron.
  get permiteResenas() {
    return false;
  }

  confirmarPago(orden) {
    this.rechazar('confirmar el pago');
  }

  despachar(orden, numeroGuia) {
    this.rechazar('despachar');
  }

  confirmarEntrega(orden) {
    this.rechazar('confirmar la entrega');
  }

  liquidar(orden) {
    this.rechazar('liberar el pago al vendedor');
  }

  cancelar(orden, motivo) {
    this.rechazar('cancelar');
  }

  // Botones que ve cada rol en este estado (la vista le pregunta al estado)
  accionesPara(rol) {
    return [];
  }

  rechazar(accion) {
    throw new TransicionInvalidaError(`No se puede ${accion} porque la orden está "${this.nombre}".`);
  }
}

module.exports = { EstadoOrden, ErrorOrden, TransicionInvalidaError };
