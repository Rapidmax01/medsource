module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./tests/setup.js'],
  setupFilesAfterFramework: ['./tests/setupAfterEnv.js'],
  maxWorkers: 1,
  coveragePathIgnorePatterns: ['/node_modules/', '/prisma/'],
  testTimeout: 10000,
};
