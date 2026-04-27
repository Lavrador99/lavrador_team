import type { Config } from 'jest';

const config: Config = {
  displayName: 'lavrador-platform',
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',

  // Transform TypeScript and TSX files with ts-jest
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        diagnostics: false,
      },
    ],
  },

  // Resolve path aliases from tsconfig.base.json
  moduleNameMapper: {
    '^@lavrador-team/types$': '<rootDir>/../../libs/types/src/index.ts',
    '^@libs/types$': '<rootDir>/../../libs/types/src/index.ts',
    // Stub out CSS modules and static assets
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.ts',
    '\\.(jpg|jpeg|png|gif|svg|ico|webp)$': '<rootDir>/__mocks__/fileMock.ts',
  },

  // Import @testing-library/jest-dom matchers after framework is set up
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};

export default config;
