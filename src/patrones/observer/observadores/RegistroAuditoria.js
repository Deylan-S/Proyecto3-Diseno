const Observador = require('./Observador');

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
