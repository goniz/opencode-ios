import { parseLSPDiagnostics } from '../../src/utils/diagnosticParser';

describe('parseLSPDiagnostics', () => {
  it('should return empty arrays and original result when no diagnostics present', () => {
    const result = 'This is a normal tool output';
    const parsed = parseLSPDiagnostics(result);
    
    expect(parsed.fileDiagnostics).toEqual([]);
    expect(parsed.projectDiagnostics).toEqual([]);
    expect(parsed.cleanResult).toBe(result);
  });

  it('should parse file diagnostics correctly', () => {
    const result = `
This file has errors, please fix
<file_diagnostics>
ERROR [10:5] Cannot find name 'foo'
WARN [20:15] Unused variable 'bar'
INFO [30:8] Consider using const instead of let
</file_diagnostics>
`;
    
    const parsed = parseLSPDiagnostics(result);
    
    expect(parsed.fileDiagnostics).toHaveLength(3);
    expect(parsed.fileDiagnostics[0]).toEqual({
      file: 'current',
      line: 10,
      column: 5,
      severity: 'ERROR',
      message: "Cannot find name 'foo'"
    });
    expect(parsed.fileDiagnostics[1]).toEqual({
      file: 'current',
      line: 20,
      column: 15,
      severity: 'WARN',
      message: "Unused variable 'bar'"
    });
    expect(parsed.fileDiagnostics[2]).toEqual({
      file: 'current',
      line: 30,
      column: 8,
      severity: 'INFO',
      message: 'Consider using const instead of let'
    });
    expect(parsed.cleanResult).toBe('');
  });

  it('should parse project diagnostics correctly', () => {
    const result = `
<project_diagnostics>
src/components/TestComponent.tsx
ERROR [45:12] Type 'string' is not assignable to type 'number'
WARN [50:5] Function 'calculateValue' is declared but never used
</project_diagnostics>

<project_diagnostics>
src/utils/helpers.ts  
ERROR [15:20] Cannot find module 'unknown-package'
</project_diagnostics>
`;
    
    const parsed = parseLSPDiagnostics(result);
    
    expect(parsed.projectDiagnostics).toHaveLength(3);
    expect(parsed.projectDiagnostics[0]).toEqual({
      file: 'src/components/TestComponent.tsx',
      line: 45,
      column: 12,
      severity: 'ERROR',
      message: "Type 'string' is not assignable to type 'number'"
    });
    expect(parsed.projectDiagnostics[1]).toEqual({
      file: 'src/components/TestComponent.tsx',
      line: 50,
      column: 5,
      severity: 'WARN',
      message: "Function 'calculateValue' is declared but never used"
    });
    expect(parsed.projectDiagnostics[2]).toEqual({
      file: 'src/utils/helpers.ts',
      line: 15,
      column: 20,
      severity: 'ERROR',
      message: "Cannot find module 'unknown-package'"
    });
    expect(parsed.cleanResult).toBe('');
  });

  it('should parse both file and project diagnostics together', () => {
    const result = `
File written successfully.

This file has errors, please fix
<file_diagnostics>
ERROR [25:10] Missing semicolon
</file_diagnostics>

<project_diagnostics>
src/other/file.js
WARN [100:1] Trailing whitespace
</project_diagnostics>
`;
    
    const parsed = parseLSPDiagnostics(result);
    
    expect(parsed.fileDiagnostics).toHaveLength(1);
    expect(parsed.fileDiagnostics[0]).toEqual({
      file: 'current',
      line: 25,
      column: 10,
      severity: 'ERROR',
      message: 'Missing semicolon'
    });
    
    expect(parsed.projectDiagnostics).toHaveLength(1);
    expect(parsed.projectDiagnostics[0]).toEqual({
      file: 'src/other/file.js',
      line: 100,
      column: 1,
      severity: 'WARN',
      message: 'Trailing whitespace'
    });
    
    expect(parsed.cleanResult).toBe('File written successfully.');
  });

  it('should clean result properly removing diagnostic markers', () => {
    const result = `
File edited successfully with 5 lines changed.

This file has errors, please fix
<file_diagnostics>
ERROR [1:1] Some error
</file_diagnostics>

Operation completed.
`;
    
    const parsed = parseLSPDiagnostics(result);
    
    expect(parsed.cleanResult).toBe('File edited successfully with 5 lines changed.\n\nOperation completed.');
  });

  it('should handle empty diagnostic sections', () => {
    const result = `
<file_diagnostics>
</file_diagnostics>

<project_diagnostics>
</project_diagnostics>

Normal output here.
`;
    
    const parsed = parseLSPDiagnostics(result);
    
    expect(parsed.fileDiagnostics).toEqual([]);
    expect(parsed.projectDiagnostics).toEqual([]);
    expect(parsed.cleanResult).toBe('Normal output here.');
  });

  it('should handle malformed diagnostic entries gracefully', () => {
    const result = `
<file_diagnostics>
ERROR [invalid] Malformed line
VALID ERROR [10:5] Valid error message
NOT_AN_ERROR This is not a valid diagnostic
WARN [20:10] Valid warning
</file_diagnostics>
`;
    
    const parsed = parseLSPDiagnostics(result);
    
    expect(parsed.fileDiagnostics).toHaveLength(2);
    expect(parsed.fileDiagnostics[0]).toEqual({
      file: 'current',
      line: 10,
      column: 5,
      severity: 'ERROR',
      message: 'Valid error message'
    });
    expect(parsed.fileDiagnostics[1]).toEqual({
      file: 'current',
      line: 20,
      column: 10,
      severity: 'WARN',
      message: 'Valid warning'
    });
  });

  it('should handle null or empty input', () => {
    expect(parseLSPDiagnostics('')).toEqual({
      fileDiagnostics: [],
      projectDiagnostics: [],
      cleanResult: ''
    });
    
    expect(parseLSPDiagnostics(null as any)).toEqual({
      fileDiagnostics: [],
      projectDiagnostics: [],
      cleanResult: null
    });
    
    expect(parseLSPDiagnostics(undefined as any)).toEqual({
      fileDiagnostics: [],
      projectDiagnostics: [],
      cleanResult: undefined
    });
  });
});