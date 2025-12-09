// jest.config.js
module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  clearMocks: true,
  // Si tienes problemas con ES modules en node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(module-to-transform)/)'
  ],
};