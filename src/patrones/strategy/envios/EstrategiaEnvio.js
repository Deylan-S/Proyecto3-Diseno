// Patron Strategy: clase base para los metodos de envio
const PROVINCIAS_GAM = ['San José', 'Alajuela', 'Heredia', 'Cartago'];

class EstrategiaEnvio {
  get id() {
    throw new Error('La estrategia debe definir "id"');
  }

  get nombre() {
    throw new Error('La estrategia debe definir "nombre"');
  }

  get descripcion() {
    return '';
  }

  calcularCosto({ pesoKg, provincia }) {
    throw new Error('La estrategia debe implementar calcularCosto()');
  }

  estimarEntrega(provincia) {
    throw new Error('La estrategia debe implementar estimarEntrega()');
  }

  esGAM(provincia) {
    return PROVINCIAS_GAM.includes(provincia);
  }
}

module.exports = { EstrategiaEnvio, PROVINCIAS_GAM };
