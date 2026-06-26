module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setup.js'],
  testTimeout: 20000,
  testMatch: ['**/*.test.js'],
  moduleDirectories: ['node_modules', '<rootDir>/../backend/node_modules']
};

