// SPDX-License-Identifier: MIT

import { createLogger } from './logger-utils.js';
import { run } from './cli.js';
import { currentDir, TestnetRemotePSConfig } from './config.js';
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import path from 'node:path';

const config = new TestnetRemotePSConfig();
const dockerEnv = new DockerComposeEnvironment(
  path.resolve(currentDir, '..'),
  'proof-server-testnet.yml',
).withWaitStrategy('proof-server', Wait.forLogMessage('Actix runtime found; starting in Actix runtime', 1));
const logger = await createLogger(config.logDir);
await run(config, logger, dockerEnv); 