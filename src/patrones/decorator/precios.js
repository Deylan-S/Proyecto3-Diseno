// Patron Decorator: el precio final se arma por capas.
// subtotal -> cupon -> IVA -> envio. Cada capa envuelve a la anterior.
// Ejemplo: new CargoEnvio(new ImpuestoIVA(new DescuentoPorcentaje(new PrecioBase(10000), 10, 'PURAVIDA')), 2500)

const TASA_IVA = 0.13; // IVA general en Costa Rica

// Componente: lo que todas las capas comparten.
class ComponentePrecio {
  calcular() {
    throw new Error('Debe implementar calcular()');
  }

  desglose() {
    throw new Error('Debe implementar desglose()');
  }
}

// Componente concreto: el punto de partida, la suma de los productos sin IVA.
class PrecioBase extends ComponentePrecio {
  constructor(monto, concepto = 'Subtotal') {
    super();
    this.monto = Math.round(monto);
    this.concepto = concepto;
  }

  calcular() {
    return this.monto;
  }

  desglose() {
    return [{ concepto: this.concepto, monto: this.monto }];
  }
}

// Decorador base: delega todo en el componente que envuelve.
class DecoradorPrecio extends ComponentePrecio {
  constructor(componente) {
    super();
    this.componente = componente;
  }

  calcular() {
    return this.componente.calcular();
  }

  desglose() {
    return this.componente.desglose();
  }
}

// Decorador concreto: cupón de descuento por porcentaje.
class DescuentoPorcentaje extends DecoradorPrecio {
  constructor(componente, porcentaje, codigo) {
    super(componente);
    this.porcentaje = porcentaje;
    this.codigo = codigo;
  }

  get descuento() {
    return Math.round(this.componente.calcular() * (this.porcentaje / 100));
  }

  calcular() {
    return this.componente.calcular() - this.descuento;
  }

  desglose() {
    return [
      ...this.componente.desglose(),
      { concepto: `Cupón ${this.codigo} (−${this.porcentaje} %)`, monto: -this.descuento },
    ];
  }
}

// Decorador concreto: impuesto al valor agregado.
class ImpuestoIVA extends DecoradorPrecio {
  constructor(componente, tasa = TASA_IVA) {
    super(componente);
    this.tasa = tasa;
  }

  get impuesto() {
    return Math.round(this.componente.calcular() * this.tasa);
  }

  calcular() {
    return this.componente.calcular() + this.impuesto;
  }

  desglose() {
    return [
      ...this.componente.desglose(),
      { concepto: `IVA (${Math.round(this.tasa * 100)} %)`, monto: this.impuesto },
    ];
  }
}

// Decorador concreto: costo del envío.
class CargoEnvio extends DecoradorPrecio {
  constructor(componente, costo, nombreMetodo = 'Envío') {
    super(componente);
    this.costo = Math.round(costo);
    this.nombreMetodo = nombreMetodo;
  }

  calcular() {
    return this.componente.calcular() + this.costo;
  }

  desglose() {
    return [
      ...this.componente.desglose(),
      { concepto: `Envío: ${this.nombreMetodo}`, monto: this.costo },
    ];
  }
}

// Atajo usado en el catálogo para mostrar precios con IVA incluido (Ley 7472).
function precioConIVA(precioSinIVA) {
  return new ImpuestoIVA(new PrecioBase(precioSinIVA)).calcular();
}

module.exports = {
  ComponentePrecio,
  PrecioBase,
  DecoradorPrecio,
  DescuentoPorcentaje,
  ImpuestoIVA,
  CargoEnvio,
  precioConIVA,
  TASA_IVA,
};
