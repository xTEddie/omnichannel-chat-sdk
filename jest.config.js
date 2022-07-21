module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns : [
    "<rootDir>/samples/",
    "<rootDir>/e2e/"
  ],
  coveragePathIgnorePatterns: [
    "external/aria/"
  ],
  setupFiles: ["./jestSetup.js"]
};