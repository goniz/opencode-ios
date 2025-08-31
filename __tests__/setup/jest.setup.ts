// Setup file for Jest testing environment

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Vector Icons to prevent act() warnings from async state updates
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  
  const createIconSet = () => {
    // Return a simple mock component that doesn't have internal state
    const MockIcon = ({ name, ...props }: { name: string; [key: string]: any }) => 
      React.createElement(Text, props, name);
    return MockIcon;
  };

  return new Proxy({}, {
    get(_target, _prop) {
      return createIconSet();
    }
  });
});

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
  commandList: jest.fn(() => Promise.resolve({ data: [] })),
  sessionList: jest.fn(() => Promise.resolve({ data: [] })),
  sessionMessages: jest.fn(() => Promise.resolve({ data: [] })),
  sessionChat: jest.fn(() => Promise.resolve({ data: {} })),
  sessionAbort: jest.fn(() => Promise.resolve({ data: {} })),
}));

// Mock GitHubClient to avoid @octokit/rest ES module issues in tests
jest.mock('../../src/integrations/github/GitHubClient', () => ({
  GitHubClient: jest.fn().mockImplementation(() => ({
    searchIssues: jest.fn(),
    searchPullRequests: jest.fn(),
    getIssue: jest.fn(),
    getPullRequest: jest.fn(),
  })),
}));

// This is needed to make this file a valid test file for Jest
// The actual setup is in the mock functions above
describe('jest.setup', () => {
  it('should be a valid test file', () => {
    expect(true).toBe(true);
  });
});