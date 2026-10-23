module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-native$": "<rootDir>/tests/__mocks__/react-native.js",
    "^expo-sqlite$": "<rootDir>/tests/__mocks__/expo-sqlite.js",
    "^expo-location$": "<rootDir>/tests/__mocks__/expo-location.js",
    "^expo-network$": "<rootDir>/tests/__mocks__/expo-network.js",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
};
