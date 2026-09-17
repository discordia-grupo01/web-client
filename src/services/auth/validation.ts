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
    errors.email = "Ingresa tu correo electrónico";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "El correo electrónico no es válido";
  }

  if (values.password === "") {
    errors.password = "Ingresa tu contraseña";
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

/** Misma regla que exige el backend para register y reset. */
function passwordStrengthError(password: string): string | undefined {
  if (password === "") return "Ingresa una contraseña";
  if (
    password.length < PASSWORD_MIN ||
    !HAS_UPPERCASE.test(password) ||
    !HAS_LOWERCASE.test(password) ||
    !HAS_DIGIT.test(password)
  ) {
    return "Usa 8+ caracteres con una mayúscula, una minúscula y un número";
  }
  return undefined;
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
    errors.email = "Ingresa tu correo electrónico";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "El correo electrónico no es válido";
  }

  errors.password = passwordStrengthError(values.password);

  return errors;
}

export interface ForgotPasswordValues {
  email: string;
}

export interface ForgotPasswordErrors {
  email?: string;
}

export function validateForgotPassword(
  values: ForgotPasswordValues,
): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {};

  const email = values.email.trim();
  if (email === "") {
    errors.email = "Ingresa tu correo electrónico";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "El correo electrónico no es válido";
  }

  return errors;
}

export interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export function validateResetPassword(
  values: ResetPasswordValues,
): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {};

  errors.newPassword = passwordStrengthError(values.newPassword);

  if (values.confirmPassword === "") {
    errors.confirmPassword = "Confirma tu contraseña";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }

  return errors;
}

export function hasErrors(
  errors:
    LoginErrors | RegisterErrors | ForgotPasswordErrors | ResetPasswordErrors,
): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}
