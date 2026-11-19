// Patron Observer: sujeto que avisa a los observadores cuando pasa algo con una orden.
const EVENTOS = require('./tiposEvento');

class PublicadorEventos {
  constructor() {
    this.suscripciones = new Map();
  }

  // Suscribe un observador a un tipo de evento ("*" para todos).
  suscribir(tipoEvento, observador) {
    if (typeof observador?.actualizar !== 'function') {
      throw new Error('El observador debe tener un método actualizar(evento)');
    }
    if (!this.suscripciones.has(tipoEvento)) {
      this.suscripciones.set(tipoEvento, new Set());
    }
    this.suscripciones.get(tipoEvento).add(observador);
    return this;
  }

  desuscribir(tipoEvento, observador) {
    this.suscripciones.get(tipoEvento)?.delete(observador);
    return this;
  }

  // Avisa a todos los observadores del evento y a los suscritos a "*".
  notificar(tipoEvento, datos = {}) {
    const evento = { tipo: tipoEvento, datos, fecha: new Date() };
    const destinatarios = new Set([
      ...(this.suscripciones.get(tipoEvento) || []),
      ...(this.suscripciones.get(EVENTOS.TODOS) || []),
    ]);

    destinatarios.forEach((observador) => {
      try {
        observador.actualizar(evento);
      } catch (error) {
        // Degradación elegante: si un observador falla (por ejemplo, el SMS),
        // los demás siguen funcionando y la compra no se cae.
        console.error(`[Observer] ${observador.constructor.name} falló con ${tipoEvento}:`, error.message);
      }
    });
    return destinatarios.size;
  }
}

module.exports = PublicadorEventos;
