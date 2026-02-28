import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.mjs"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/apps/"],
  collectCoverageFrom: ["components/landing/**/*.{ts,tsx}", "lib/use*.ts"],
  coveragePathIgnorePatterns: ["/node_modules/"],
};

export default createJestConfig(config);
