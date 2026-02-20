// SPDX-License-Identifier: MIT

import { TestnetRemoteConfig } from '../config.js';
import { run } from '../index.js';
import { createLogger } from '../logger-utils.js';

const config = new TestnetRemoteConfig();
const logger = await createLogger(config.logDir);
const testEnvironment = config.getEnvironment(logger);
await run(config, testEnvironment, logger);
