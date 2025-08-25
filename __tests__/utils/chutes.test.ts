/**
 * Test suite for Chutes API utility functions
 */

import { ChutesApiKeyRequiredError, ChutesApiKeyInvalidError } from '../../src/utils/chutes';

describe('Chutes Error Classes', () => {
  describe('ChutesApiKeyRequiredError', () => {
    test('creates error with default message', () => {
      const error = new ChutesApiKeyRequiredError();
      expect(error.name).toBe('ChutesApiKeyRequiredError');
      expect(error.message).toBe('Chutes API key is required');
      expect(error).toBeInstanceOf(Error);
    });

    test('creates error with custom message', () => {
      const customMessage = 'Custom error message';
      const error = new ChutesApiKeyRequiredError(customMessage);
      expect(error.name).toBe('ChutesApiKeyRequiredError');
      expect(error.message).toBe(customMessage);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ChutesApiKeyInvalidError', () => {
    test('creates error with default message', () => {
      const error = new ChutesApiKeyInvalidError();
      expect(error.name).toBe('ChutesApiKeyInvalidError');
      expect(error.message).toBe('Chutes API key is invalid or expired');
      expect(error).toBeInstanceOf(Error);
    });

    test('creates error with custom message', () => {
      const customMessage = 'Custom invalid key message';
      const error = new ChutesApiKeyInvalidError(customMessage);
      expect(error.name).toBe('ChutesApiKeyInvalidError');
      expect(error.message).toBe(customMessage);
      expect(error).toBeInstanceOf(Error);
    });
  });
});