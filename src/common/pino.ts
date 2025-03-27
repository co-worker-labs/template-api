import { stdTimeFunctions } from 'pino';

export function buildPinoOption() {
  const pretty = process.env.LOG_PRETTY === 'true';
  const log_level = process.env.LOG_LEVEL;
  const app_id = process.env.APP_ID;

  return {
    base: {
      service: app_id || undefined,
    },
    transport: pretty ? { target: 'pino-pretty' } : null,
    level: log_level || 'info',
    formatters: {
      level: (label: string) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: stdTimeFunctions.isoTime,
    autoLogging: false,
    serializers: {
      req: (req) => {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
          params: req.params,
        };
      },
      res: (res) => {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  };
}
