// Funciones de ayuda que usan las vistas y los controladores

function colones(monto) {
  const numero = Math.round(Number(monto) || 0);
  return '₡' + numero.toLocaleString('es-CR');
}

function fecha(valor) {
  return new Date(valor).toLocaleString('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  });
}

// 4 -> "★★★★☆" (en la vista va con aria-hidden y el texto para lectores aparte)
function estrellas(promedio) {
  const llenas = Math.round(Number(promedio) || 0);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

// 4.5 -> "4,5"
function decimal(valor) {
  return Number(valor).toLocaleString('es-CR', { maximumFractionDigits: 1 });
}

// Recibe la lista de errores [{ campo, mensaje }] y devuelve una funcion
// para preguntar el error de un campo desde la vista: errorDe('telefono')
function crearErrorDe(errores = []) {
  return function (campo) {
    const error = errores.find((e) => e.campo === campo);
    return error ? error.mensaje : null;
  };
}

// Solo deja redirigir a rutas internas (que empiecen con "/")
function rutaSegura(ruta, porDefecto = '/') {
  if (typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//')) {
    return ruta;
  }
  return porDefecto;
}

module.exports = { colones, fecha, estrellas, decimal, crearErrorDe, rutaSegura };
