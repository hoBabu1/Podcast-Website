import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // mockUSDT/ is a standalone Foundry project — its bundled JS test files
  // (forge-std, openzeppelin-contracts) are not part of this app and must not
  // be collected or scanned (they also cause haste-map name collisions).
  testPathIgnorePatterns: ['/node_modules/', '/mockUSDT/'],
  modulePathIgnorePatterns: ['/mockUSDT/'],
  // Prevent lib/env.ts from running its validation at import time during tests
  // Each test sets process.env manually before importing the validator
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true, jsx: 'react-jsx' } }],
  },
}

export default config
