module.exports = {
    preset: "jest-playwright-preset",
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    setupFiles: ["./jestSetup.js"]
}