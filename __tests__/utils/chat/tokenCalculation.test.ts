import { formatTokenCount, calculateTokenInfo } from '../../../src/utils/chat/tokenCalculation';

describe('tokenCalculation', () => {
  describe('formatTokenCount', () => {
    it('should format small numbers correctly', () => {
      expect(formatTokenCount(100)).toBe('100');
      expect(formatTokenCount(999)).toBe('999');
    });

    it('should format thousands correctly', () => {
      expect(formatTokenCount(1000)).toBe('1K');
      expect(formatTokenCount(1500)).toBe('1.5K');
      expect(formatTokenCount(9999)).toBe('10K');
    });

    it('should format millions correctly', () => {
      expect(formatTokenCount(1000000)).toBe('1M');
      expect(formatTokenCount(1500000)).toBe('1.5M');
      expect(formatTokenCount(9999999)).toBe('10M');
    });
  });

  describe('calculateTokenInfo', () => {
    const mockMessages = [
      {
        role: 'assistant',
        id: '1',
        sessionID: 'session1',
        time: { created: Date.now() },
        providerID: 'provider1',
        modelID: 'model1',
        mode: 'chat',
        path: { cwd: '/', root: '/' },
        cost: 0.01,
        tokens: {
          input: 100,
          output: 200,
          reasoning: 0,
          cache: { read: 0, write: 0 }
        }
      }
    ];

    const mockAvailableModels = [
      {
        providerID: 'provider1',
        modelID: 'model1',
        displayName: 'Provider 1 / Model 1',
        contextLimit: 100000
      }
    ];

    const mockCurrentModel = {
      providerID: 'provider1',
      modelID: 'model1'
    };

    it('should calculate token info correctly', () => {
      const result = calculateTokenInfo(mockMessages as any, mockAvailableModels, mockCurrentModel);
      
      expect(result).toEqual({
        currentTokens: 300,
        maxTokens: 100000,
        percentage: 0,
        sessionCost: 0.01,
        isSubscriptionModel: false
      });
    });

    it('should return null when no current model', () => {
      const result = calculateTokenInfo(mockMessages as any, mockAvailableModels, undefined);
      expect(result).toBeNull();
    });

    it('should return null when no available models', () => {
      const result = calculateTokenInfo(mockMessages as any, [], mockCurrentModel);
      expect(result).toBeNull();
    });
  });
});