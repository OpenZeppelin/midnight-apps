import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message: string): boolean =>
      /Signed-off-by: dependabot\[bot]/m.test(message),
  ],
};

export default config;
