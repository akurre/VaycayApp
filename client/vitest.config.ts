import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
const supportsNoExperimentalWebstorage =
  nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 5);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.ts',
    // Node 22.5+ ships an experimental localStorage that collides with happy-dom's;
    // the flag opts out. Older Node versions don't recognise it and crash test workers.
    execArgv: supportsNoExperimentalWebstorage ? ['--no-experimental-webstorage'] : [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/test-utils.tsx',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/index.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
