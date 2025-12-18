// biome-ignore lint/performance/noBarrelFile: this is an intentional library entrypoint
export {
  getLogger,
  resetLogger,
  isLoggerInitialized,
  type LoggerOptions,
} from './logger.js';
export type { Logger } from 'pino';
