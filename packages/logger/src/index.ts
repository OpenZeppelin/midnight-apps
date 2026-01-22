export type { Logger } from 'pino';
// biome-ignore lint/performance/noBarrelFile: Intentional barrel file for library exports
export {
  getLogger,
  isLoggerInitialized,
  type LoggerOptions,
  resetLogger,
} from './logger.js';
