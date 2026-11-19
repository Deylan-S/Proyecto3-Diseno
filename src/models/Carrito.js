// Modelo del carrito. Se guarda en la sesion y solo tiene ids y cantidades.
const MAXIMO_POR_PRODUCTO = 10;

class Carrito {
  constructor(lineas = []) {
    this.lineas = lineas; // [{ productoId, cantidad }]
  }

  static desdeSesion(sesion) {
    if (!Array.isArray(sesion.carrito)) sesion.carrito = [];
    return new Carrito(sesion.carrito);
  }

  agregar(productoId, cantidad = 1) {
    const linea = this.lineas.find((l) => l.productoId === productoId);
    if (linea) {
      linea.cantidad = Math.min(MAXIMO_POR_PRODUCTO, linea.cantidad + cantidad);
    } else {
      this.lineas.push({ productoId, cantidad: Math.min(MAXIMO_POR_PRODUCTO, cantidad) });
    }
  }

  actualizar(productoId, cantidad) {
    if (cantidad <= 0) {
      this.quitar(productoId);
      return;
    }
    const linea = this.lineas.find((l) => l.productoId === productoId);
    if (linea) linea.cantidad = Math.min(MAXIMO_POR_PRODUCTO, cantidad);
  }

  quitar(productoId) {
    const indice = this.lineas.findIndex((l) => l.productoId === productoId);
    if (indice > -1) this.lineas.splice(indice, 1);
  }

  vaciar() {
    this.lineas.splice(0, this.lineas.length);
  }

  get estaVacio() {
    return this.lineas.length === 0;
  }

  get cantidadTotal() {
    return this.lineas.reduce((suma, l) => suma + l.cantidad, 0);
  }

  // Une cada línea con su producto. Descarta productos que ya no existen.
  detallar(buscarProducto) {
    return this.lineas
      .map((linea) => ({ ...linea, producto: buscarProducto(linea.productoId) }))
      .filter((linea) => linea.producto)
      .map((linea) => ({
        ...linea,
        totalLinea: linea.producto.precioFinal * linea.cantidad,
      }));
  }
}

Carrito.MAXIMO_POR_PRODUCTO = MAXIMO_POR_PRODUCTO;

module.exports = Carrito;
