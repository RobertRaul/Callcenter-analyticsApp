import logger from './logger';

// Tu API siempre responde con este wrapper:
// { success: true, data: { ... }, message: null, error: null }
// El dato real está en response.data.data

export function unwrapResponse(raw: unknown, context = 'api'): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const obj = raw as Record<string, unknown>;

  // Wrapper principal: { success, data, message, error }
  if ('success' in obj && 'data' in obj) {
    logger.debug(context, 'Wrapper detectado — extrayendo data interna');
    return unwrapResponse(obj.data, context); // recursivo por si hay doble wrapper
  }

  return obj;
}

// Extrae un array de una respuesta ya desenvuelta
export function extractArray<T>(data: unknown, keys: string[], context = 'api'): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(obj[key])) {
        logger.debug(context, `Array en clave "${key}" — ${(obj[key] as unknown[]).length} items`);
        return obj[key] as T[];
      }
    }
    // Buscar recursivamente en subclave "data"
    if (obj.data && typeof obj.data === 'object') {
      return extractArray<T>(obj.data, keys, context);
    }
  }

  logger.warn(context, 'No se encontró array en la respuesta', { data });
  return [];
}
