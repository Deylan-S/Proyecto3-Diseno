const Observador = require('./Observador');
const EVENTOS = require('../tiposEvento');

// Observador: aparta el stock al crear la orden y lo devuelve si se cancela
class ObservadorInventario extends Observador {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  actualizar({ tipo, datos }) {
    const { orden } = datos;
    if (!orden) return;

    if (tipo === EVENTOS.ORDEN_CREADA) {
      orden.items.forEach((item) => this.ajustar(item.productoId, -item.cantidad));
    } else if (tipo === EVENTOS.ORDEN_CANCELADA) {
      orden.items.forEach((item) => this.ajustar(item.productoId, item.cantidad));
    }
  }

  ajustar(productoId, diferencia) {
    const producto = this.almacen.buscarProducto(productoId);
    if (producto) {
      producto.stock = Math.max(0, producto.stock + diferencia);
    }
  }
}

module.exports = ObservadorInventario;
