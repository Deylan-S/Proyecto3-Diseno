// Patron Observer: interfaz que tienen que cumplir los observadores
class Observador {
  actualizar(evento) {
    throw new Error('El observador debe implementar actualizar()');
  }
}

module.exports = Observador;
