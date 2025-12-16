export type { Logger } from 'pino';
// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  getLogger,
  isLoggerInitialized,
  type LoggerOptions,
  resetLogger,
} from './logger.js';
