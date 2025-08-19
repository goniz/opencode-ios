import { 
  detectFileMentions, 
  getCurrentFileMention, 
  replaceFileMention,
  formatFileSuggestions
} from '../../src/utils/fileMentions';

describe('fileMentions', () => {
  describe('detectFileMentions', () => {
    it('should detect single file mention', () => {
      const text = 'Check out @src/utils/helper.ts for details';
      const mentions = detectFileMentions(text);
      
      expect(mentions).toHaveLength(1);
      expect(mentions[0]).toEqual({
        path: 'src/utils/helper.ts',
        start: 10,
        end: 30,
        query: 'src/utils/helper.ts'
      });
    });

    it('should detect multiple file mentions', () => {
      const text = 'Files @app.tsx and @components/Button.tsx need updates';
      const mentions = detectFileMentions(text);
      
      expect(mentions).toHaveLength(2);
      expect(mentions[0].path).toBe('app.tsx');
      expect(mentions[1].path).toBe('components/Button.tsx');
    });

    it('should handle no mentions', () => {
      const text = 'This is just regular text without any mentions';
      const mentions = detectFileMentions(text);
      
      expect(mentions).toHaveLength(0);
    });

    it('should handle @ symbols that are not file mentions', () => {
      const text = 'Email me @ john@example.com or check @validfile.ts';
      const mentions = detectFileMentions(text);
      
      expect(mentions).toHaveLength(2);
      expect(mentions[0].path).toBe('example.com'); // After the @ in john@example.com
      expect(mentions[1].path).toBe('validfile.ts');
    });
  });

  describe('getCurrentFileMention', () => {
    it('should find current mention when cursor is within it', () => {
      const text = 'Check @src/utils/helper.ts';
      const cursorPosition = 15; // Within the mention
      
      const mention = getCurrentFileMention(text, cursorPosition);
      
      expect(mention).not.toBeNull();
      expect(mention?.query).toBe('src/utils/helper.ts');
      expect(mention?.start).toBe(6);
      expect(mention?.end).toBe(26);
    });

    it('should return null when cursor is outside mention', () => {
      const text = 'Check @src/utils/helper.ts for details';
      const cursorPosition = 30; // After the mention
      
      const mention = getCurrentFileMention(text, cursorPosition);
      
      expect(mention).toBeNull();
    });

    it('should return null when no @ symbol found', () => {
      const text = 'No mentions here';
      const cursorPosition = 5;
      
      const mention = getCurrentFileMention(text, cursorPosition);
      
      expect(mention).toBeNull();
    });
  });

  describe('replaceFileMention', () => {
    it('should replace mention with selected path', () => {
      const text = 'Check @src/utils/hel for details';
      const mention = { start: 6, end: 20 }; // "@src/utils/hel"
      const selectedPath = 'src/utils/helper.ts';
      
      const result = replaceFileMention(text, mention, selectedPath);
      
      expect(result).toBe('Check @src/utils/helper.ts for details');
    });
  });

  describe('formatFileSuggestions', () => {
    it('should sort suggestions by file name length then alphabetically', () => {
      const suggestions = [
        { path: 'src/very-long-filename.ts', fileName: 'very-long-filename.ts', directory: 'src/' },
        { path: 'app.tsx', fileName: 'app.tsx', directory: '/' },
        { path: 'src/utils.ts', fileName: 'utils.ts', directory: 'src/' },
        { path: 'index.ts', fileName: 'index.ts', directory: '/' }
      ];
      
      const formatted = formatFileSuggestions(suggestions);
      
      expect(formatted[0].fileName).toBe('app.tsx');
      expect(formatted[1].fileName).toBe('index.ts');
      expect(formatted[2].fileName).toBe('utils.ts');
      expect(formatted[3].fileName).toBe('very-long-filename.ts');
    });

    it('should limit results to maxResults', () => {
      const suggestions = Array.from({ length: 20 }, (_, i) => ({
        path: `file${i}.ts`,
        fileName: `file${i}.ts`,
        directory: '/'
      }));
      
      const formatted = formatFileSuggestions(suggestions, 5);
      
      expect(formatted).toHaveLength(5);
    });
  });
});