const { precioConIVA } = require('../patrones/decorator/precios');

// Modelo del producto. El precio se guarda sin IVA y se muestra con IVA.

// cada categoria usa su propia ilustracion (no se suben fotos)
const IMAGEN_POR_CATEGORIA = {
  'Café': 'cafe.svg',
  'Cacao y chocolate': 'cacao.svg',
  'Artesanía': 'artesania.svg',
  'Hogar': 'hogar.svg',
  'Alimentos': 'alimentos.svg',
  'Textiles': 'textiles.svg',
};

const ALT_POR_IMAGEN = {
  'cafe.svg': 'Ilustración de una bolsa de café con granos',
  'cacao.svg': 'Ilustración de una mazorca de cacao',
  'artesania.svg': 'Ilustración de una rueda de carreta pintada',
  'hogar.svg': 'Ilustración de un artículo para el hogar',
  'alimentos.svg': 'Ilustración de un frasco artesanal',
  'textiles.svg': 'Ilustración de un bolso tejido',
};

class Producto {
  constructor({ id, nombre, descripcion, precioBase, categoria, vendedorId, stock, pesoKg, imagen, alt, destacado = false }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precioBase = precioBase;
    this.categoria = categoria;
    this.vendedorId = vendedorId;
    this.stock = stock;
    this.pesoKg = pesoKg;
    this.imagen = imagen;
    this.alt = alt;
    this.destacado = destacado;
  }

  get precioFinal() {
    return precioConIVA(this.precioBase);
  }

  get agotado() {
    return this.stock <= 0;
  }

  get pocasUnidades() {
    return this.stock > 0 && this.stock <= 5;
  }

  hayStock(cantidad) {
    return cantidad > 0 && cantidad <= this.stock;
  }

  // Aplica cambios ya validados (lo usa el panel del vendedor).
  actualizar({ nombre, descripcion, categoria, precioBase, stock, pesoKg }) {
    Object.assign(this, { nombre, descripcion, categoria, precioBase, stock, pesoKg });
    this.imagen = IMAGEN_POR_CATEGORIA[categoria];
    this.alt = ALT_POR_IMAGEN[this.imagen];
  }

  // Valida y limpia los datos del formulario de producto.
  static validar(datos = {}, categorias = Object.keys(IMAGEN_POR_CATEGORIA)) {
    const errores = [];
    const texto = (valor) => String(valor ?? '').trim();
    const valores = {
      nombre: texto(datos.nombre).slice(0, 80),
      descripcion: texto(datos.descripcion).slice(0, 400),
      categoria: texto(datos.categoria),
      precioBase: Number(texto(datos.precioBase).replace(/[\s.,]/g, '')),
      stock: Number(texto(datos.stock)),
      pesoKg: Number(texto(datos.pesoKg).replace(',', '.')),
    };

    if (valores.nombre.length < 5) errores.push({ campo: 'nombre', mensaje: 'El nombre debe tener al menos 5 caracteres.' });
    if (valores.descripcion.length < 20) {
      errores.push({ campo: 'descripcion', mensaje: 'Cuente un poco más del producto (al menos 20 caracteres).' });
    }
    if (!categorias.includes(valores.categoria)) errores.push({ campo: 'categoria', mensaje: 'Elija una categoría.' });
    if (!Number.isInteger(valores.precioBase) || valores.precioBase < 100 || valores.precioBase > 5000000) {
      errores.push({ campo: 'precioBase', mensaje: 'Escriba el precio en colones, sin decimales, entre ₡100 y ₡5 000 000.' });
    }
    if (!Number.isInteger(valores.stock) || valores.stock < 0 || valores.stock > 999) {
      errores.push({ campo: 'stock', mensaje: 'Las existencias deben ser un número entero entre 0 y 999.' });
    }
    if (!(valores.pesoKg >= 0.05 && valores.pesoKg <= 30)) {
      errores.push({ campo: 'pesoKg', mensaje: 'El peso va en kilos, entre 0,05 y 30. Sirve para calcular el envío.' });
    }
    return { errores, valores };
  }

  coincideCon(texto) {
    if (!texto) return true;
    const normalizar = (valor) => valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const buscado = normalizar(texto);
    return normalizar(`${this.nombre} ${this.descripcion} ${this.categoria}`).includes(buscado);
  }
}

Producto.IMAGEN_POR_CATEGORIA = IMAGEN_POR_CATEGORIA;
Producto.ALT_POR_IMAGEN = ALT_POR_IMAGEN;

module.exports = Producto;
