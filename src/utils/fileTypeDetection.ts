interface FileTypeInfo {
  type: 'image' | 'text' | 'code' | 'document' | 'audio' | 'video' | 'archive' | 'unknown';
  icon: string;
  label: string;
}

export const getFileTypeInfo = (filename: string = '', mimeType: string = ''): FileTypeInfo => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const mime = mimeType.toLowerCase();
  
  // Image files
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico'].includes(extension)) {
    return { type: 'image', icon: 'IMG', label: 'Image' };
  }

  // Audio files
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma'].includes(extension)) {
    return { type: 'audio', icon: 'AUD', label: 'Audio' };
  }

  // Video files
  if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(extension)) {
    return { type: 'video', icon: 'VID', label: 'Video' };
  }

  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'dmg', 'pkg', 'deb', 'rpm'].includes(extension)) {
    return { type: 'archive', icon: 'ZIP', label: 'Archive' };
  }

  // Code files
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'kt', 'swift', 'dart', 'scala', 'clj', 'sh', 'bash', 'ps1'].includes(extension)) {
    return { type: 'code', icon: 'CODE', label: 'Code' };
  }

  // Config/markup files
  if (['html', 'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'json', 'toml', 'ini', 'conf', 'config'].includes(extension)) {
    return { type: 'code', icon: 'CFG', label: 'Config' };
  }

  // Text files
  if (mime.startsWith('text/') || ['txt', 'md', 'markdown', 'rst', 'log', 'csv', 'tsv'].includes(extension)) {
    return { type: 'text', icon: 'TXT', label: 'Text' };
  }

  // Document files
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf'].includes(extension)) {
    return { type: 'document', icon: 'DOC', label: 'Document' };
  }

  // Fallback
  return { type: 'unknown', icon: 'FILE', label: 'File' };
};

export const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return '';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  
  return `${size} ${sizes[i]}`;
};

export const truncateFileName = (filename: string, maxLength: number = 25): string => {
  if (filename.length <= maxLength) return filename;
  
  const extension = filename.split('.').pop();
  const name = filename.substring(0, filename.lastIndexOf('.'));
  
  if (extension && extension.length < maxLength - 3) {
    const maxNameLength = maxLength - extension.length - 4; // 4 for "..." + "."
    return `${name.substring(0, maxNameLength)}...${extension}`;
  }
  
  return `${filename.substring(0, maxLength - 3)}...`;
};