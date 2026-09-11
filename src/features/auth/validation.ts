/**
 * Validacion de los formularios de auth (login y registro). Funciones puras,
 * sin librerias: reciben los valores y devuelven un objeto de errores
 * (vacio = todo ok).
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

/** Nombre de usuario: entre 3 y 32 caracteres. */
const NAME_MIN = 3;
const NAME_MAX = 32;

/** El backend exige 8+ caracteres con mayuscula, minuscula y numero. */
const PASSWORD_MIN = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

export interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function validateRegister(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};

  const name = values.name.trim();
  if (name === "") {
    errors.name = "Ingresa un nombre de usuario";
  } else if (name.length < NAME_MIN) {
    errors.name = `El nombre debe tener al menos ${NAME_MIN} caracteres`;
  } else if (name.length > NAME_MAX) {
    errors.name = `El nombre no puede superar los ${NAME_MAX} caracteres`;
  }

  const email = values.email.trim();
  if (email === "") {
    errors.email = "Ingresa tu correo electronico";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "El correo electronico no es valido";
  }

  const { password } = values;
  if (password === "") {
    errors.password = "Ingresa una contrasena";
  } else if (
    password.length < PASSWORD_MIN ||
    !HAS_UPPERCASE.test(password) ||
    !HAS_LOWERCASE.test(password) ||
    !HAS_DIGIT.test(password)
  ) {
    errors.password =
      "Usa 8+ caracteres con una mayuscula, una minuscula y un numero";
  }

  return errors;
}

export function hasErrors(errors: LoginErrors | RegisterErrors): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}
