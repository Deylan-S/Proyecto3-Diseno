const { EstrategiaEnvio } = require('./EstrategiaEnvio');

// Estrategia concreta: Correos de Costa Rica (integración simulada).
class EnvioCorreosCR extends EstrategiaEnvio {
  get id() {
    return 'correos';
  }

  get nombre() {
    return 'Correos de Costa Rica';
  }

  get descripcion() {
    return 'Económico, a todo el país.';
  }

  calcularCosto({ pesoKg = 1, provincia }) {
    const kilosExtra = Math.max(0, Math.ceil(pesoKg) - 1);
    const recargoZona = this.esGAM(provincia) ? 0 : 1500;
    return 2500 + kilosExtra * 700 + recargoZona;
  }

  estimarEntrega(provincia) {
    return this.esGAM(provincia) ? '2 a 3 días hábiles' : '3 a 5 días hábiles';
  }
}

// Estrategia concreta: courier exprés privado.
class EnvioCourier extends EstrategiaEnvio {
  get id() {
    return 'courier';
  }

  get nombre() {
    return 'Courier exprés';
  }

  get descripcion() {
    return 'Más rápido, con seguimiento en tiempo real.';
  }

  calcularCosto({ pesoKg = 1, provincia }) {
    const base = this.esGAM(provincia) ? 4500 : 6500;
    const kilosExtra = Math.max(0, Math.ceil(pesoKg) - 2);
    return base + kilosExtra * 500;
  }

  estimarEntrega(provincia) {
    return this.esGAM(provincia) ? '1 día hábil' : '2 días hábiles';
  }
}

// Estrategia concreta: retiro gratis en el centro de distribución de San José.
class RetiroEnPunto extends EstrategiaEnvio {
  get id() {
    return 'retiro';
  }

  get nombre() {
    return 'Retiro en punto MercaTico (San José)';
  }

  get descripcion() {
    return 'Gratis. Le avisamos cuando su pedido esté listo.';
  }

  calcularCosto() {
    return 0;
  }

  estimarEntrega() {
    return '1 a 2 días hábiles';
  }
}

// Patrón STRATEGY: Contexto para envíos.
class CalculadoraEnvio {
  constructor(estrategia) {
    this.estrategia = estrategia;
  }

  setEstrategia(estrategia) {
    this.estrategia = estrategia;
  }

  cotizar({ pesoKg, provincia }) {
    return {
      metodo: this.estrategia.id,
      nombre: this.estrategia.nombre,
      costo: this.estrategia.calcularCosto({ pesoKg, provincia }),
      entrega: this.estrategia.estimarEntrega(provincia),
    };
  }
}

const ESTRATEGIAS_ENVIO = [new EnvioCorreosCR(), new EnvioCourier(), new RetiroEnPunto()];

function obtenerEstrategiaEnvio(id) {
  return ESTRATEGIAS_ENVIO.find((estrategia) => estrategia.id === id) || null;
}

module.exports = {
  EnvioCorreosCR,
  EnvioCourier,
  RetiroEnPunto,
  CalculadoraEnvio,
  ESTRATEGIAS_ENVIO,
  obtenerEstrategiaEnvio,
};
