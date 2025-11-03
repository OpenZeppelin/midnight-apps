# @openzeppelin/midnight-apps-logger

Singleton logger package for Midnight applications using [Pino](https://github.com/pinojs/pino).

## Installation

This package is part of the Midnight apps monorepo and uses pnpm workspaces.

```bash
pnpm add @openzeppelin/midnight-apps-logger
```

## Usage

### Basic Usage

```typescript
import { getLogger } from '@openzeppelin/midnight-apps-logger';

const logger = getLogger();

logger.info('Application started');
logger.error('An error occurred', { error: new Error('Something went wrong') });
logger.debug('Debug information', { data: { foo: 'bar' } });
```

### Custom Configuration

You can pass configuration options on the first call to `getLogger`:

```typescript
import { getLogger } from '@openzeppelin/midnight-apps-logger';

const logger = getLogger({
  level: 'debug',
  browser: { asObject: true },
});
```

**Note:** Configuration options are only applied the first time the logger is created. Subsequent calls to `getLogger()` will return the same singleton instance.

### Browser Usage

For client-side applications:

```typescript
import { getLogger } from '@openzeppelin/midnight-apps-logger';

const logger = getLogger({
  level: 'info',
  browser: {
    asObject: true,
    serialize: true,
  },
});
```

### React Hook

For use in React applications, you can create a custom hook:

```typescript
'use client';

import { getLogger, type Logger } from '@openzeppelin/midnight-apps-logger';

export function useLogger(): Logger {
  return getLogger();
}
```

### Testing

The package provides utilities for testing:

```typescript
import { getLogger, resetLogger, isLoggerInitialized } from '@openzeppelin/midnight-apps-logger';

describe('My tests', () => {
  afterEach(() => {
    resetLogger(); // Reset the singleton between tests
  });

  it('should log messages', () => {
    const logger = getLogger({ level: 'silent' });
    // Your test code
  });
});
```

## API

### `getLogger(options?: LoggerOptions): Logger`

Gets or creates the singleton logger instance. Options are only applied on first initialization.

**Parameters:**
- `options` (optional): Logger configuration options
  - `level`: Log level ('trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent')
  - `browser`: Browser-specific options
  - `transport`: Custom transport configuration

**Returns:** The singleton Pino logger instance

### `resetLogger(): void`

Resets the singleton logger instance. Useful for testing or when you need to reinitialize with different options.

### `isLoggerInitialized(): boolean`

Checks if the logger has been initialized.

**Returns:** `true` if the logger has been created, `false` otherwise

## License

MIT

