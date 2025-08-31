export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'ERROR' | 'WARN' | 'INFO';
  message: string;
}

export interface DiagnosticParseResult {
  fileDiagnostics: Diagnostic[];
  projectDiagnostics: Diagnostic[];
  cleanResult: string;
}

/**
 * Parses LSP diagnostics from tool output result string
 * Supports both file_diagnostics and project_diagnostics tags from the server
 */
export const parseLSPDiagnostics = (result: string): DiagnosticParseResult => {
  if (!result) {
    return { fileDiagnostics: [], projectDiagnostics: [], cleanResult: result };
  }

  // Remove all diagnostic-related content from the result
  let cleanResult = result
    .replace(/<project_diagnostics>.*?<\/project_diagnostics>/gs, '')
    .replace(/<file_diagnostics>.*?<\/file_diagnostics>/gs, '')
    .replace(/This file has errors, please fix/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
    .trim();
  
  // If after cleaning there's nothing meaningful left, return empty string
  if (!cleanResult || cleanResult.length < 10) {
    cleanResult = '';
  }

  const fileDiagnostics: Diagnostic[] = [];
  const projectDiagnostics: Diagnostic[] = [];

  // Parse file diagnostics (errors in the current file)
  const fileMatches = result.matchAll(/<file_diagnostics>(.*?)<\/file_diagnostics>/gs);
  for (const fileMatch of fileMatches) {
    const fileErrors = fileMatch[1].trim();
    if (fileErrors) {
      const errorLines = fileErrors.split('\n').filter(line => line.trim());
      
      for (const errorLine of errorLines) {
        const match = errorLine.match(/(ERROR|WARN|INFO) \[(\d+):(\d+)\] (.+)/);
        if (match) {
          fileDiagnostics.push({
            file: 'current', // File diagnostics are for the current file
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            severity: match[1] as 'ERROR' | 'WARN' | 'INFO',
            message: match[4]
          });
        }
      }
    }
  }

  // Parse project diagnostics (errors in other files)
  const projectMatches = result.matchAll(/<project_diagnostics>(.*?)<\/project_diagnostics>/gs);
  for (const projectMatch of projectMatches) {
    const projectText = projectMatch[1].trim();
    if (projectText) {
      const lines = projectText.split('\n');
      const filePath = lines[0].trim(); // First line is the file path, trim whitespace
      const errorLines = lines.slice(1).filter(line => line.trim());
      
      for (const errorLine of errorLines) {
        const match = errorLine.match(/(ERROR|WARN|INFO) \[(\d+):(\d+)\] (.+)/);
        if (match) {
          projectDiagnostics.push({
            file: filePath,
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            severity: match[1] as 'ERROR' | 'WARN' | 'INFO',
            message: match[4]
          });
        }
      }
    }
  }

  return { fileDiagnostics, projectDiagnostics, cleanResult };
};