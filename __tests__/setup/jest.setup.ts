// Setup file for Jest testing environment

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// This is needed to make this file a valid test file for Jest
// The actual setup is in the mock functions above
describe('jest.setup', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
});