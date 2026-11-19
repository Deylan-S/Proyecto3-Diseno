const crypto = require('crypto');

// Modelo del usuario (comprador, vendedor o admin).
// La contraseña se guarda con hash (scrypt) y sal, nunca en texto plano.
class Usuario {
  constructor({ id, nombre, email, password, rol, telefono, tienda = null }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email.toLowerCase();
    this.rol = rol; // 'comprador' | 'vendedor' | 'admin'
    this.telefono = telefono;
    this.tienda = tienda; // { nombre, ubicacion, descripcion } solo para vendedores
    this.sal = crypto.randomBytes(16).toString('hex');
    this.hash = Usuario.hashear(password, this.sal);
  }

  static hashear(password, sal) {
    return crypto.scryptSync(password, sal, 32).toString('hex');
  }

  verificarPassword(password) {
    const calculado = Buffer.from(Usuario.hashear(password, this.sal), 'hex');
    return crypto.timingSafeEqual(calculado, Buffer.from(this.hash, 'hex'));
  }

  // Validaciones del formulario de registro
  static validarRegistro({ nombre, email, telefono, password, confirmar } = {}, correoEnUso = () => false) {
    const errores = [];
    const correo = String(email || '').trim().toLowerCase();
    const clave = String(password || '');

    if (String(nombre || '').trim().length < 3) {
      errores.push({ campo: 'nombre', mensaje: 'Escriba su nombre completo.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      errores.push({ campo: 'email', mensaje: 'Escriba un correo válido, por ejemplo nombre@correo.com.' });
    } else if (correoEnUso(correo)) {
      errores.push({ campo: 'email', mensaje: 'Ya existe una cuenta con ese correo. Puede iniciar sesión.' });
    }
    if (!/^[2-8]\d{3}-?\d{4}$/.test(String(telefono || '').trim())) {
      errores.push({ campo: 'telefono', mensaje: 'Escriba un teléfono de 8 dígitos, por ejemplo 8888-1234.' });
    }
    if (clave.length < 8 || !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(clave) || !/\d/.test(clave)) {
      errores.push({ campo: 'password', mensaje: 'La contraseña necesita al menos 8 caracteres, con letras y números.' });
    } else if (clave !== String(confirmar || '')) {
      errores.push({ campo: 'confirmar', mensaje: 'Las dos contraseñas no coinciden.' });
    }
    return errores;
  }

  get primerNombre() {
    return this.nombre.split(' ')[0];
  }

  // Datos mínimos que se guardan en la sesión.
  aSesion() {
    return { id: this.id, nombre: this.nombre, rol: this.rol };
  }
}

module.exports = Usuario;
