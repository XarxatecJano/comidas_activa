import { Context, Next } from 'hono';
import AuthService from '../services/AuthService';

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ error: { code: 'AUTH_ERROR', message: 'No authorization header' } }, 401);
    }

    // Formato esperado: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return c.json({ error: { code: 'AUTH_ERROR', message: 'Invalid authorization format' } }, 401);
    }

    const token = parts[1];
    
    // Verificar token
    const decoded = AuthService.verifyToken(token);
    
    // Guardar información del usuario en el contexto
    c.set('userId', decoded.userId);
    c.set('userEmail', decoded.email);
    
    await next();
  } catch (error) {
    return c.json({ error: { code: 'AUTH_ERROR', message: 'Invalid or expired token' } }, 401);
  }
}

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero lo verifica si existe
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = AuthService.verifyToken(token);
        c.set('userId', decoded.userId);
        c.set('userEmail', decoded.email);
      }
    }
    
    await next();
  } catch (error) {
    // Si el token es inválido, simplemente continuamos sin autenticación
    await next();
  }
}
