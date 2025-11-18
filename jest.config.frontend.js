module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/frontend'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'public/js/**/*.js',
    '!public/js/**/*.min.js',
  ],
  coverageDirectory: 'coverage/frontend',
  coverageReporters: ['text', 'lcov', 'html', 'text-summary'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.js'],
  // Transform configuration
  transform: {},
  // Note: Coverage for frontend JS files loaded via eval() won't be tracked
  // This is a limitation of testing browser-based JavaScript with Jest
  // For accurate coverage, consider refactoring to use ES6 modules
};
