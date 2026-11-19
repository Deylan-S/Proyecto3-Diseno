// Patron Strategy: clase base para los metodos de pago.
// Cada metodo valida y cobra a su manera, el resto del sistema solo usa validar() y procesar().
class EstrategiaPago {
  // Identificador corto que viaja en los formularios (ej. "tarjeta").
  get id() {
    throw new Error('La estrategia debe definir "id"');
  }

  // Nombre visible para la persona usuaria.
  get nombre() {
    throw new Error('La estrategia debe definir "nombre"');
  }

  // Revisa los datos del formulario.
  validar(datos) {
    throw new Error('La estrategia debe implementar validar()');
  }

  // Ejecuta el cobro (simulado).
  procesar(monto, datos) {
    throw new Error('La estrategia debe implementar procesar()');
  }

  // Genera una referencia legible, por ejemplo TRJ-8F3K2A.
  generarReferencia(prefijo) {
    const aleatorio = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefijo}-${aleatorio}`;
  }
}

module.exports = EstrategiaPago;
