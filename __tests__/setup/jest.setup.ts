// Setup file for Jest testing environment

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock SDK functions that may not work in test environment
jest.mock('../../src/api/sdk.gen', () => ({
  ...jest.requireActual('../../src/api/sdk.gen'),
  appGet: jest.fn(() => Promise.resolve({
    data: {
      path: {
        root: '/test/root',
        cwd: '/test/cwd'
      }
    }
  })),
  sessionList: jest.fn(() => Promise.resolve({ data: [] })),
  sessionMessages: jest.fn(() => Promise.resolve({ data: [] })),
  sessionChat: jest.fn(() => Promise.resolve({ data: {} })),
  sessionAbort: jest.fn(() => Promise.resolve({ data: {} })),
}));

// This is needed to make this file a valid test file for Jest
// The actual setup is in the mock functions above
describe('jest.setup', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
});