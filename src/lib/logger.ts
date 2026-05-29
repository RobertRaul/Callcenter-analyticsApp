// ─── Logger centralizado para Call Center Analytics ──────────────────────────
// Todos los errores y eventos importantes se muestran en la terminal de Expo
// con colores, timestamps y contexto suficiente para diagnosticar problemas.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

// En desarrollo muestra todo; en producción solo warn y error
const IS_DEV = __DEV__;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
};

const MIN_LEVEL: LogLevel = IS_DEV ? 'debug' : 'warn';

// Historial en memoria (últimas 200 entradas) para mostrar en pantalla de debug
const logHistory: LogEntry[] = [];
const MAX_HISTORY = 200;

function formatEntry(entry: LogEntry): string {
  const prefix = {
    debug: '[DEBUG]',
    info:  '[ INFO]',
    warn:  '[ WARN]',
    error: '[ERROR]',
  }[entry.level];

  const data = entry.data !== undefined
    ? '\n       ' + JSON.stringify(entry.data, null, 2).replace(/\n/g, '\n       ')
    : '';

  return `${prefix} ${entry.timestamp} [${entry.context}] ${entry.message}${data}`;
}

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

  const entry: LogEntry = {
    level,
    context,
    message,
    data,
    timestamp: new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
  };

  // Guardar en historial
  logHistory.push(entry);
  if (logHistory.length > MAX_HISTORY) logHistory.shift();

  // Imprimir en terminal con el método correcto de console
  const formatted = formatEntry(entry);
  switch (level) {
    case 'debug': console.debug(formatted); break;
    case 'info':  console.info(formatted);  break;
    case 'warn':  console.warn(formatted);  break;
    case 'error': console.error(formatted); break;
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const logger = {
  debug: (context: string, message: string, data?: unknown) =>
    log('debug', context, message, data),
  info:  (context: string, message: string, data?: unknown) =>
    log('info',  context, message, data),
  warn:  (context: string, message: string, data?: unknown) =>
    log('warn',  context, message, data),
  error: (context: string, message: string, data?: unknown) =>
    log('error', context, message, data),

  getHistory: () => [...logHistory],
  clearHistory: () => { logHistory.length = 0; },
};

export default logger;
