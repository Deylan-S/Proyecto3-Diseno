const { PendientePago, PASOS_FLUJO } = require('../patrones/state/estados');
const { TransicionInvalidaError, ErrorOrden } = require('../patrones/state/EstadoOrden');
const Resena = require('./Resena');
const EVENTOS = require('../patrones/observer/tiposEvento');

// Modelo de la orden.
// Es el contexto del patron State: guarda su estado actual y le delega las acciones.
// Cada cambio de estado se publica como evento (patron Observer).
class Orden {
  constructor({ id, codigo, compraId, compradorId, vendedorId, items, envio, direccion, desglose, total, pago, publicador }) {
    this.id = id;
    this.codigo = codigo;
    this.compraId = compraId;
    this.compradorId = compradorId;
    this.vendedorId = vendedorId;
    this.items = items; // [{ productoId, nombre, precioUnitario, cantidad }]
    this.envio = envio; // { metodo, nombre, costo, entrega, guia }
    this.direccion = direccion;
    this.desglose = desglose;
    this.total = total;
    this.pago = pago; // { metodo, referencia, detalle, estado }
    this.liquidacion = null;
    this.fechaCreacion = new Date();
    this.publicador = publicador || null;

    this.estado = new PendientePago();
    this.historial = [{ estado: this.estado.nombre, fecha: this.fechaCreacion, nota: 'Pedido creado.' }];
  }

  // ---- Acciones: se delegan al estado actual (patrón State) ----
  confirmarPago() {
    this.estado.confirmarPago(this);
    this.pago.estado = 'retenido';
  }

  despachar(numeroGuia) {
    this.estado.despachar(this, numeroGuia);
  }

  confirmarEntrega() {
    this.estado.confirmarEntrega(this);
  }

  liquidar() {
    this.estado.liquidar(this);
  }

  cancelar(motivo) {
    this.estado.cancelar(this, motivo);
  }

  // Lo llaman los estados para pasar al siguiente.
  cambiarEstado(nuevoEstado, tipoEvento, nota, extra = {}) {
    this.estado = nuevoEstado;
    this.historial.push({ estado: nuevoEstado.nombre, fecha: new Date(), nota });
    if (this.publicador) {
      this.publicador.notificar(tipoEvento, { orden: this, nota, ...extra });
    }
  }

  accionesPara(rol) {
    return this.estado.accionesPara(rol);
  }

  // Crea la reseña de un producto. El estado decide si ya se puede calificar.
  resenar({ id, productoId, calificacion, comentario }) {
    if (!this.estado.permiteResenas) {
      throw new TransicionInvalidaError(`Podrá calificar cuando reciba el pedido (ahora está "${this.estado.nombre}").`);
    }
    const item = this.items.find((i) => i.productoId === productoId);
    if (!item) throw new ErrorOrden('Ese producto no es parte de este pedido.');

    const resena = new Resena({ id, productoId, usuarioId: this.compradorId, ordenId: this.id, calificacion, comentario });
    if (this.publicador) {
      this.publicador.notificar(EVENTOS.RESENA_PUBLICADA, {
        orden: this,
        resena,
        producto: item.nombre,
        nota: `${calificacion} de 5 estrellas para "${item.nombre}".`,
      });
    }
    return resena;
  }

  get cantidadArticulos() {
    return this.items.reduce((suma, item) => suma + item.cantidad, 0);
  }

  // Datos para dibujar la línea de tiempo accesible en la vista.
  get pasos() {
    const indiceActual = PASOS_FLUJO.findIndex((paso) => paso.codigo === this.estado.codigo);
    return PASOS_FLUJO.map((paso, indice) => ({
      ...paso,
      completado: indiceActual > -1 && indice < indiceActual,
      actual: indice === indiceActual,
    }));
  }
}

module.exports = Orden;
