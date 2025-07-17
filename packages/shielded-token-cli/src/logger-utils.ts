import pino from 'pino';
import pinoPretty from 'pino-pretty';
import fs from 'node:fs';
import path from 'node:path';

export const createLogger = async (logDir: string): Promise<pino.Logger> => {
  // Ensure log directory exists
  const logDirPath = path.dirname(logDir);
  if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath, { recursive: true });
  }

  const streams = [
    {
      stream: pinoPretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      }),
    },
    {
      stream: fs.createWriteStream(logDir, { flags: 'a' }),
    },
  ];

  return pino(
    {
      level: 'info',
    },
    pino.multistream(streams),
  );
}; 