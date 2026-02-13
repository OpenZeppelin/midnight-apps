'use client';

import pino from 'pino';

let singletonLogger: pino.Logger | null = null;

export function useLogger(): pino.Logger {
  if (!singletonLogger) {
    singletonLogger = pino({
      level: 'info',
      browser: { asObject: true },
    });
  }
  return singletonLogger;
}
