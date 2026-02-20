// SPDX-License-Identifier: MIT

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import pino from 'pino';
import pinoPretty from 'pino-pretty';

export const createLogger = async (logPath: string): Promise<pino.Logger> => {
  await mkdir(dirname(logPath), { recursive: true });
  const pretty: pinoPretty.PrettyStream = pinoPretty({
    colorize: true,
    sync: true,
  });
  const level =
    process.env.DEBUG_LEVEL !== undefined &&
    process.env.DEBUG_LEVEL !== null &&
    process.env.DEBUG_LEVEL !== ''
      ? process.env.DEBUG_LEVEL
      : 'info';
  return pino(
    {
      level,
      depthLimit: 20,
    },
    pino.multistream([
      { stream: pretty, level },
      { stream: createWriteStream(logPath), level },
    ]),
  );
};
