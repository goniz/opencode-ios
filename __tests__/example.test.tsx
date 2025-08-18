import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Simple example test to verify setup works
describe('Test Setup', () => {
  test('should render basic Text component', () => {
    const { getByText } = render(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });
});