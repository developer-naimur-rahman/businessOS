export default {
  displayName: 'api-server',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@nestjs/jwt$': '<rootDir>/../node_modules/@nestjs/jwt/dist/index.js',
    '^@nestjs/passport$': '<rootDir>/../node_modules/@nestjs/passport/dist/index.js'
  },
  transformIgnorePatterns: [
    "node_modules/(?!.*\\.mjs$|@nestjs/jwt|@nestjs/passport)"
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/api-server',
};
