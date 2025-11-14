import { CreateUserDTO, UpdateUserDTO } from './User';

// Validador de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validador de contraseña (mínimo 8 caracteres)
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Validador de CreateUserDTO
export function validateCreateUser(data: CreateUserDTO): string[] {
  const errors: string[] = [];

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password || !isValidPassword(data.password)) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (data.defaultDiners !== undefined && data.defaultDiners < 1) {
    errors.push('Default diners must be at least 1');
  }

  return errors;
}

// Validador de UpdateUserDTO
export function validateUpdateUser(data: UpdateUserDTO): string[] {
  const errors: string[] = [];

  if (data.email !== undefined && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.name !== undefined && data.name.trim().length === 0) {
    errors.push('Name cannot be empty');
  }

  if (data.defaultDiners !== undefined && data.defaultDiners < 1) {
    errors.push('Default diners must be at least 1');
  }

  return errors;
}

// Validador de preferencias
export function validatePreferences(preferences: string): string[] {
  const errors: string[] = [];

  if (preferences && preferences.length > 1000) {
    errors.push('Preferences text is too long (max 1000 characters)');
  }

  return errors;
}

// Validador de día de la semana
export function isValidDayOfWeek(day: string): boolean {
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return validDays.includes(day.toLowerCase());
}

// Validador de número de platos
export function isValidNumberOfDishes(num: number): boolean {
  return num >= 1 && num <= 5;
}
