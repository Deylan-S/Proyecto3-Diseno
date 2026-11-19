// Modelo de la reseña. Solo se puede hacer despues de recibir el pedido (lo revisa la orden).
class Resena {
  constructor({ id, productoId, usuarioId, ordenId, calificacion, comentario = '', fecha = new Date() }) {
    this.id = id;
    this.productoId = productoId;
    this.usuarioId = usuarioId;
    this.ordenId = ordenId;
    this.calificacion = calificacion;
    this.comentario = comentario;
    this.fecha = fecha;
  }
  static validar({ calificacion, comentario } = {}) {
    const valores = {
      calificacion: Number(calificacion),
      comentario: String(comentario || '').trim().slice(0, 500),
    };
    const errores = [];
    if (!Number.isInteger(valores.calificacion) || valores.calificacion < 1 || valores.calificacion > 5) {
      errores.push({ campo: 'calificacion', mensaje: 'Elija de 1 a 5 estrellas.' });
    }
    return { errores, valores };
  }
}

module.exports = Resena;
