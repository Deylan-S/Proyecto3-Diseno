const Observador = require('./Observador');

// Observador: bitacora de todos los eventos (se suscribe a "*")
class RegistroAuditoria extends Observador {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  actualizar({ tipo, datos, fecha }) {
    this.almacen.auditoria.unshift({
      fecha,
      evento: tipo,
      orden: datos.orden?.codigo || '-',
      detalle: datos.nota || '',
    });
  }
}

module.exports = RegistroAuditoria;
