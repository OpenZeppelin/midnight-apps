'use client';

import pino from 'pino';

let singletonLogger: pino.Logger | null = null;

const levelLabels: Record<number, string> = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
};

const levelMethods: Record<number, 'debug' | 'info' | 'warn' | 'error'> = {
  10: 'debug',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'error',
};

export function useLogger(): pino.Logger {
  if (!singletonLogger) {
    singletonLogger = pino({
      level: 'info',
      browser: {
        write(o: object) {
          const { time, level, msg, error, ...rest } = o as Record<string, unknown>;
          const label = levelLabels[level as number] ?? 'LOG';
          const method = levelMethods[level as number] ?? 'log';
          const prefix = `[${label}] ${msg ?? ''}`;
          if (error) {
            console[method](prefix, '\n', error, Object.keys(rest).length ? rest : '');
          } else if (Object.keys(rest).length) {
            console[method](prefix, rest);
          } else {
            console[method](prefix);
          }
        },
      },
    });
  }
  return singletonLogger;
}
