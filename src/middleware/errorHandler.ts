import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

// Clases de error personalizadas
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Formato de respuesta de error consistente
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Middleware global de manejo de errores para Hono
 */
export function errorHandler(err: Error, c: Context) {
  // Log del error
  console.error('=== Error Handler ===');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('Request Path:', c.req.path);
  console.error('Request Method:', c.req.method);
  console.error('=====================');

  const timestamp = new Date().toISOString();

  // Manejar HTTPException de Hono
  if (err instanceof HTTPException) {
    const response: ErrorResponse = {
      error: {
        code: 'HTTP_ERROR',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, err.status);
  }

  // Manejar ValidationError
  if (err instanceof ValidationError) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 400);
  }

  // Manejar AuthenticationError
  if (err instanceof AuthenticationError) {
    const response: ErrorResponse = {
      error: {
        code: 'AUTH_ERROR',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 401);
  }

  // Manejar AuthorizationError
  if (err instanceof AuthorizationError) {
    const response: ErrorResponse = {
      error: {
        code: 'FORBIDDEN',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 403);
  }

  // Manejar NotFoundError
  if (err instanceof NotFoundError) {
    const response: ErrorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 404);
  }

  // Manejar AIServiceError
  if (err instanceof AIServiceError) {
    const response: ErrorResponse = {
      error: {
        code: 'AI_ERROR',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 500);
  }

  // Manejar DatabaseError
  if (err instanceof DatabaseError) {
    const response: ErrorResponse = {
      error: {
        code: 'DATABASE_ERROR',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 500);
  }

  // Manejar errores de autenticación (por mensaje) - PRIMERO para evitar conflictos con "Invalid"
  if (err.message.includes('Invalid credentials') ||
      err.message.includes('Invalid token') ||
      err.message.includes('Token expired')) {
    const response: ErrorResponse = {
      error: {
        code: 'AUTH_ERROR',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 401);
  }

  // Manejar errores de validación de datos (por mensaje)
  if (err.message.includes('Validation failed') || 
      err.message.includes('Invalid') ||
      err.message.includes('required') ||
      err.message.includes('must be')) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 400);
  }

  // Manejar errores de autorización (por mensaje)
  if (err.message.includes('Access denied') ||
      err.message.includes('Forbidden') ||
      err.message.includes('Permission denied')) {
    const response: ErrorResponse = {
      error: {
        code: 'FORBIDDEN',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 403);
  }

  // Manejar errores de recurso no encontrado (por mensaje)
  if (err.message.includes('not found') ||
      err.message.includes('does not exist')) {
    const response: ErrorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: err.message,
        timestamp,
      },
    };
    return c.json(response, 404);
  }

  // Error genérico del servidor
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      timestamp,
    },
  };

  return c.json(response, 500);
}

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export function notFoundHandler(c: Context) {
  const response: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response, 404);
}
