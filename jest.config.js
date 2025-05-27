const { createDefaultPreset } = require("ts-jest");
const tsJestPreset = createDefaultPreset();

/** @type {import('jest').Config} */
module.exports = {
  ...tsJestPreset,
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
};
