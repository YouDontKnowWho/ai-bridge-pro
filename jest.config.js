module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1'
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/core/**/*.ts'],
  coveragePathIgnorePatterns: ['/src/core/engines/FluxEngine.ts', '/src/core/pipeline/'],
  coverageThreshold: {
    global: { branches: 50, functions: 60, lines: 70, statements: 70 }
  }
};