import { webcrypto } from 'node:crypto';
import type { ReadStream } from 'node:fs';
import { WebSocket } from 'ws';

// Instead of setting globalThis.crypto which is read-only, we'll ensure crypto is available
// but won't try to overwrite the global property
// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  return bytes;
};

export const toHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
};

export const streamToString = async (stream: ReadStream): Promise<string> => {
  const chunks: Buffer[] = [];
  return await new Promise((resolve, reject) => {
    stream.on('data', (chunk) =>
      chunks.push(
        typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk,
      ),
    );
    stream.on('error', (err) => {
      reject(err);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
};
