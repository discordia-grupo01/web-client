/**
 * Validacion del formulario de login. Funciones puras, sin librerias:
 * reciben los valores y devuelven un objeto de errores (vacio = todo ok).
 *
 * Se usa en dos lados: en el cliente (al enviar el form) y en el Route Handler
 * (revalidacion en server). El backend es la unica autoridad sobre las
 * credenciales; aca solo evitamos requests obviamente invalidos.
 */

export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

// Suficiente para descartar tipeos: algo@algo.algo
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};

  const email = values.email.trim();
  if (email === "") {
    errors.email = "Ingresa tu correo electronico";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "El correo electronico no es valido";
  }

  if (values.password === "") {
    errors.password = "Ingresa tu contrasena";
  }

  return errors;
}

export function hasErrors(errors: LoginErrors): boolean {
  return Object.keys(errors).length > 0;
}
