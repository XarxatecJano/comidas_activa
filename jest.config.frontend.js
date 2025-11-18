module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/frontend'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'public/js/**/*.js',
    '!public/js/**/*.min.js',
  ],
  coverageDirectory: 'coverage/frontend',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.js'],
};
