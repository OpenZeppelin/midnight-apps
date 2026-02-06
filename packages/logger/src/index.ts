export type { Logger } from 'pino';
// biome-ignore lint/performance/noBarrelFile: this is an intentional library entrypoint
export {
  getLogger,
  isLoggerInitialized,
  type LoggerOptions,
  resetLogger,
} from './logger.js';
