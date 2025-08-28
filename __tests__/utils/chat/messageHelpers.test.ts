import { findLastAssistantMessage, extractProviderModel } from '../../../src/utils/chat/messageHelpers';

describe('messageHelpers', () => {
  describe('findLastAssistantMessage', () => {
    it('should return null when no messages', () => {
      const result = findLastAssistantMessage([]);
      expect(result).toBeNull();
    });

    it('should return null when no assistant messages', () => {
      const messages = [
        {
          role: 'user',
          id: '1',
          sessionID: 'session1',
          time: { created: Date.now() }
        }
      ];
      
      const result = findLastAssistantMessage(messages as any);
      expect(result).toBeNull();
    });

    it('should return the last assistant message', () => {
      const assistantMessage = {
        role: 'assistant',
        id: '2',
        sessionID: 'session1',
        time: { created: Date.now() },
        providerID: 'provider1',
        modelID: 'model1',
        mode: 'chat',
        path: { cwd: '/', root: '/' },
        cost: 0,
        tokens: {
          input: 0,
          output: 0,
          reasoning: 0,
          cache: { read: 0, write: 0 }
        }
      };
      
      const messages = [
        {
          role: 'user',
          id: '1',
          sessionID: 'session1',
          time: { created: Date.now() }
        },
        assistantMessage
      ];
      
      const result = findLastAssistantMessage(messages as any);
      expect(result).toEqual(assistantMessage);
    });
  });

  describe('extractProviderModel', () => {
    it('should return null when no provider or model', () => {
      const message = {
        role: 'assistant',
        id: '1',
        sessionID: 'session1',
        time: { created: Date.now() },
        mode: 'chat',
        path: { cwd: '/', root: '/' },
        cost: 0,
        tokens: {
          input: 0,
          output: 0,
          reasoning: 0,
          cache: { read: 0, write: 0 }
        }
      };
      
      const result = extractProviderModel(message as any);
      expect(result).toBeNull();
    });

    it('should extract provider and model correctly', () => {
      const message = {
        role: 'assistant',
        id: '1',
        sessionID: 'session1',
        time: { created: Date.now() },
        providerID: 'provider1',
        modelID: 'model1',
        mode: 'chat',
        path: { cwd: '/', root: '/' },
        cost: 0,
        tokens: {
          input: 0,
          output: 0,
          reasoning: 0,
          cache: { read: 0, write: 0 }
        }
      };
      
      const result = extractProviderModel(message as any);
      expect(result).toEqual({
        providerID: 'provider1',
        modelID: 'model1'
      });
    });
  });
});